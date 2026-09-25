import { afterEach, expect, test } from "bun:test";
import { realpathSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

import { startBridge } from "../src/bridge/server";
import { secret } from "../src/bridge/state";
import { VERSION, tools, SUPPORTED_OPERATIONS } from "../src/protocol/index";
const cleanup: Array<() => unknown> = [];
afterEach(async () => {
  for (const fn of cleanup.reverse()) await fn();
  cleanup.length = 0;
});
async function setup(timeout = 1000) {
  const token = secret(),
    workspace = realpathSync(mkdtempSync(join(tmpdir(), "figma-bridge-test-")));
  const bridge = await startBridge({
    token,
    port: 0,
    stateDirectory: workspace,
    requestTimeoutMs: timeout,
  });
  cleanup.push(
    () => rmSync(workspace, { recursive: true, force: true }),
    () => bridge.stop()
  );
  const url = `http://127.0.0.1:${bridge.port}`,
    headers = { Authorization: `Bearer ${token}` };
  async function client() {
    const c = new Client({ name: "test", version: "1" });
    await c.connect(
      new StreamableHTTPClientTransport(new URL(`${url}/mcp`), {
        requestInit: { headers },
      })
    );
    cleanup.push(() => c.close());
    return c;
  }
  async function peer(
    handler?: (method: string, params: any) => Promise<unknown>,
    capabilities = Object.keys(tools),
    operations: string[] = SUPPORTED_OPERATIONS
  ) {
    const pair = (await (
      await fetch(`${url}/pair`, { method: "POST", headers })
    ).json()) as any;
    const ws = new WebSocket(`${url.replace("http", "ws")}/plugin`);
    cleanup.push(() => ws.close());
    const ready = await new Promise<any>((resolve, reject) => {
      ws.onopen = () =>
        ws.send(
          JSON.stringify({
            type: "hello",
            version: VERSION,
            token: pair.token,
            nonce: "test",
            documentName: "Fixture",
            capabilities,
            operations,
          })
        );
      ws.onerror = reject;
      ws.onmessage = async (event) => {
        const d = JSON.parse(String(event.data));
        if (d.type === "ready") resolve(d);
        else if (d.type === "ping") ws.send('{"type":"pong"}');
        else {
          const result = await (handler?.(d.method, d.params) ??
            Promise.resolve({ ok: true }));
          ws.send(
            JSON.stringify({
              type: "result",
              version: VERSION,
              requestId: d.requestId,
              ok: true,
              result,
            })
          );
        }
      };
    });
    return ready;
  }
  return { url, headers, client, peer };
}
async function call(
  client: Client,
  name: string,
  args: Record<string, unknown> = {}
) {
  const r = await client.callTool({
    name: `figma_bridge_${name}`,
    arguments: args,
  });
  return r.isError
    ? JSON.parse((r.content as any)[0].text)
    : (r.structuredContent as any);
}
test("HTTP requires token, exact host and no browser origin", async () => {
  const s = await setup();
  expect((await fetch(`${s.url}/health`)).status).toBe(401);
  expect(
    (
      await fetch(`${s.url}/health`, {
        headers: { ...s.headers, Origin: "null" },
      })
    ).status
  ).toBe(403);
  expect(
    (
      await fetch(`${s.url}/health`, {
        headers: { ...s.headers, Host: "attacker.example" },
      })
    ).status
  ).toBe(403);
  expect((await fetch(`${s.url}/health`, { headers: s.headers })).status).toBe(
    200
  );
});
test("unpaired sockets cannot register a session", async () => {
  const s = await setup();
  const ws = new WebSocket(s.url.replace("http", "ws") + "/plugin");
  await new Promise<void>((resolve) => {
    ws.onopen = () =>
      ws.send(
        JSON.stringify({
          type: "hello",
          version: VERSION,
          token: "0".repeat(64),
          nonce: "x",
          documentName: "bad",
          capabilities: Object.keys(tools),
          operations: SUPPORTED_OPERATIONS,
        })
      );
    ws.onclose = () => resolve();
  });
  const c = await s.client();
  expect((await c.listTools()).tools.length).toBeGreaterThan(6);
  expect((await call(c, "sessions")).sessions).toHaveLength(0);
});
test("explicit sessions route independently and simultaneous writers cannot steal scope", async () => {
  const s = await setup();
  const a = await s.peer(async () => {
      await Bun.sleep(30);
      return { file: "A" };
    }),
    b = await s.peer(async () => ({ file: "B" }));
  const c = await s.client(),
    d = await s.client();
  expect((await call(c, "selection", { sessionId: b.sessionId })).file).toBe(
    "B"
  );
  expect((await call(c, "selection", { sessionId: "wrong" })).error).toBe(
    "UNKNOWN_SESSION"
  );
  const leases = await Promise.all([
    call(c, "write_scope", {
      sessionId: a.sessionId,
      rootId: "root",
      action: "acquire",
    }),
    call(d, "write_scope", {
      sessionId: a.sessionId,
      rootId: "root",
      action: "acquire",
    }),
  ]);
  expect(leases.filter((r) => r.error === "TARGET_BUSY")).toHaveLength(1);
});
test("lost acknowledgements quarantine writes and recover receipts without replay", async () => {
  const s = await setup(30);
  let creates = 0;
  const receipt = {
    operationId: crypto.randomUUID(),
    status: "complete",
    created: { a: "1:2" },
    steps: [{ index: 0, nodeId: "1:2" }],
  };
  const p = await s.peer(async (method) => {
    if (method === "apply") {
      creates++;
      await Bun.sleep(100);
      return receipt;
    }
    if (method === "operation_status") return receipt;
    return {};
  });
  const c = await s.client();
  const lease = await call(c, "write_scope", {
    sessionId: p.sessionId,
    rootId: "root",
    action: "acquire",
  });
  const args = {
    sessionId: p.sessionId,
    generation: p.generation,
    leaseId: lease.leaseId,
    operationId: receipt.operationId,
    operations: [
      {
        type: "create",
        key: "a",
        kind: "FRAME",
        parentId: "root",
        expectedFingerprint: "before",
      },
    ],
  };
  expect((await call(c, "apply", { ...args, generation: "stale" })).error).toBe(
    "STALE_GENERATION"
  );
  expect((await call(c, "apply", args)).status).toBe("unknown");
  expect((await call(c, "apply", args)).status).toBe("unknown");
  expect(
    (await call(c, "apply", { ...args, operationId: crypto.randomUUID() }))
      .error
  ).toBe("OPERATION_UNRESOLVED");
  expect(
    (
      await call(c, "operation_status", {
        sessionId: p.sessionId,
        operationId: receipt.operationId,
      })
    ).status
  ).toBe("complete");
  expect((await call(c, "apply", args)).status).toBe("complete");
  expect(creates).toBe(1);
  expect((await call(c, "apply", { ...args, operations: [] })).error).toBe(
    "INVALID_ARGUMENTS"
  );
});

test("peer capabilities are advertised and enforced independently of the server tool list", async () => {
  const s = await setup();
  const peer = await s.peer(undefined, ["selection", "apply"], ["update"]);
  const client = await s.client();
  const sessions = await call(client, "sessions");
  expect(sessions.sessions[0].capabilities).toEqual(["apply", "selection"]);
  expect(sessions.sessions[0].operations).toEqual(["update"]);
  expect(
    (
      await call(client, "read_prototype", {
        sessionId: peer.sessionId,
        pageId: "p",
        nodeIds: ["n"],
      })
    ).error
  ).toBe("UNSUPPORTED_PEER_CAPABILITY");
  expect(
    (
      await call(client, "apply", {
        sessionId: peer.sessionId,
        generation: peer.generation,
        leaseId: "l",
        operationId: crypto.randomUUID(),
        operations: [
          {
            type: "remove_reaction",
            nodeId: "n",
            expectedFingerprint: "f",
            index: 0,
          },
        ],
      })
    ).error
  ).toBe("UNSUPPORTED_PEER_OPERATION");
});

test("old plugins receive an actionable protocol mismatch and cannot register", async () => {
  const s = await setup();
  const pair = (await (
    await fetch(`${s.url}/pair`, { method: "POST", headers: s.headers })
  ).json()) as any;
  const ws = new WebSocket(s.url.replace("http", "ws") + "/plugin");
  const closed = await new Promise<CloseEvent>((resolve) => {
    ws.onopen = () =>
      ws.send(
        JSON.stringify({
          type: "hello",
          version: 1,
          token: pair.token,
          nonce: "old",
          documentName: "Old",
        })
      );
    ws.onclose = resolve;
  });
  expect(closed.code).toBe(1008);
  expect(closed.reason).toContain("init --force");
  expect((await call(await s.client(), "sessions")).sessions).toHaveLength(0);
});
