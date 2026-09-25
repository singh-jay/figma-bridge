import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  mkdtempSync,
  realpathSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const packed = JSON.parse(
  execFileSync(npm, ["pack", "--ignore-scripts", "--json"], {
    cwd: root,
    encoding: "utf8",
  })
)[0];
assert(packed.files.some((f) => f.path === "plugin/code.js"));
assert(packed.files.some((f) => f.path === "schema/project.schema.json"));
assert(packed.files.some((f) => f.path === "skills/figma-bridge/SKILL.md"));
assert(
  packed.files.every(
    (f) =>
      !/^(tests|src|node_modules|\.artifacts|\.figma-bridge)\//.test(f.path)
  )
);
for (const file of packed.files) {
  assert(
    !/@omni\/|\/Users\/savari|omni-care|workspace:\*|catalog:/.test(
      readFileSync(join(root, file.path), "utf8")
    ),
    `Project coupling in ${file.path}`
  );
}
const work = realpathSync(mkdtempSync(join(tmpdir(), "figma-bridge-install-")));
const peers = [],
  clients = [];
let bridge;
try {
  execFileSync(
    npm,
    [
      "install",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      "--prefix",
      work,
      resolve(root, packed.filename),
    ],
    { cwd: work, stdio: "pipe" }
  );
  const installed = join(work, "node_modules/@local/figma-bridge");
  const { startBridge } = await import(
    pathToFileURL(join(installed, "dist/bridge/server.js"))
  );
  const { Client } = await import(
    pathToFileURL(
      join(
        work,
        "node_modules/@modelcontextprotocol/sdk/dist/esm/client/index.js"
      )
    )
  );
  const { StdioClientTransport } = await import(
    pathToFileURL(
      join(
        work,
        "node_modules/@modelcontextprotocol/sdk/dist/esm/client/stdio.js"
      )
    )
  );
  const { WebSocket } = await import(
    pathToFileURL(join(work, "node_modules/ws/wrapper.mjs"))
  );
  const state = join(work, "state"),
    token = "c".repeat(64);
  mkdirSync(state, { mode: 0o700 });
  writeFileSync(join(state, "credential"), token, { mode: 0o600 });
  bridge = await startBridge({ token, stateDirectory: state, port: 0 });
  const projectA = join(work, "vue-project"),
    projectB = join(work, "react-project");
  for (const [project, framework] of [
    [projectA, "vue"],
    [projectB, "react"],
  ]) {
    mkdirSync(join(project, "components"), { recursive: true });
    writeFileSync(
      join(project, "figma-bridge.config.json"),
      JSON.stringify({
        version: 1,
        targets: { web: { framework, components: ["components"] } },
      })
    );
  }
  const cli = join(installed, "dist/cli/index.js");
  const common = ["--state-dir", state, "--port", String(bridge.port)];
  execFileSync(
    process.execPath,
    [cli, "init", "--project", projectA, ...common],
    { cwd: work, stdio: "pipe" }
  );
  assert(
    readFileSync(
      join(projectA, ".figma-bridge/plugin/manifest.json"),
      "utf8"
    ).includes(`localhost:${bridge.port}`)
  );
  assert(
    !readFileSync(
      join(projectA, ".figma-bridge/plugin/code.js"),
      "utf8"
    ).includes("__FIGMA_BRIDGE_PORT__")
  );
  assert.equal(
    JSON.parse(readFileSync(join(projectA, "figma-bridge.config.json"))).targets
      .web.framework,
    "vue"
  );
  execFileSync(
    process.execPath,
    [cli, "install-skill", "--skill-dir", join(work, "skills")],
    { cwd: work, stdio: "pipe" }
  );
  assert(
    readFileSync(join(work, "skills/figma-bridge/SKILL.md"), "utf8").includes(
      "name: figma-bridge"
    )
  );
  const image = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZlKAAAAAASUVORK5CYII=",
    "base64"
  );
  let creates = 0;
  async function peer(file) {
    const pairing = await (
      await fetch(`http://127.0.0.1:${bridge.port}/pair`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })
    ).json();
    const ws = new WebSocket(`ws://localhost:${bridge.port}/plugin`);
    peers.push(ws);
    const receipts = new Map();
    return new Promise((resolvePeer, reject) => {
      ws.on("error", reject);
      ws.on("open", () =>
        ws.send(
          JSON.stringify({
            type: "hello",
            version: 1,
            token: pairing.token,
            nonce: "fixture",
            documentName: file,
          })
        )
      );
      ws.on("message", async (raw) => {
        const request = JSON.parse(raw.toString());
        if (request.type === "ready") return resolvePeer(request);
        if (request.type === "ping") return ws.send('{"type":"pong"}');
        let result = { file };
        if (request.method === "read_nodes")
          result = { nodes: [{ id: "root", name: file }], complete: true };
        if (request.method === "apply") {
          creates++;
          result = {
            status: "complete",
            operationId: request.params.operationId,
            created: { qa: `${file}:1` },
            steps: [{ index: 0, nodeId: `${file}:1` }],
          };
          receipts.set(request.params.operationId, result);
        }
        if (request.method === "operation_status")
          result = receipts.get(request.params.operationId);
        if (request.method === "export_begin")
          result = {
            exportId: "png",
            bytes: image.length,
            chunks: 1,
            sha256: createHash("sha256").update(image).digest("hex"),
            mime: "image/png",
          };
        if (request.method === "export_chunk")
          result = { index: 0, data: image.toString("base64") };
        ws.send(
          JSON.stringify({
            type: "result",
            version: 1,
            requestId: request.requestId,
            ok: true,
            result,
          })
        );
      });
    });
  }
  const a = await peer("A"),
    b = await peer("B");
  async function client(project) {
    const client = new Client({ name: "packaged-node-test", version: "1" });
    clients.push(client);
    await client.connect(
      new StdioClientTransport({
        command: process.execPath,
        args: [cli, "mcp", "--project", project, ...common],
      })
    );
    assert(client.getInstructions()?.includes("Project context"));
    assert.equal((await client.listTools()).tools.length, 11);
    return client;
  }
  const ca = await client(projectA),
    cb = await client(projectB);
  async function call(client, tool, args) {
    const r = await client.callTool({
      name: `figma_bridge_${tool}`,
      arguments: args,
    });
    return r.isError ? JSON.parse(r.content[0].text) : r.structuredContent;
  }
  assert.equal(
    (await call(ca, "selection", { sessionId: b.sessionId })).file,
    "B"
  );
  const contextA = await call(ca, "design_context", {
    sessionId: a.sessionId,
    nodeId: "root",
  });
  const contextB = await call(cb, "design_context", {
    sessionId: a.sessionId,
    nodeId: "root",
  });
  assert.equal(contextA.repository.framework, "vue");
  assert.equal(contextB.repository.framework, "react");
  assert.equal(
    contextA.repository.sources[0].path,
    join(projectA, "components")
  );
  assert.equal(
    contextB.repository.sources[0].path,
    join(projectB, "components")
  );
  const lease = await call(ca, "write_scope", {
    sessionId: a.sessionId,
    rootId: "root",
    action: "acquire",
  });
  assert.equal(
    (
      await call(cb, "write_scope", {
        sessionId: a.sessionId,
        rootId: "root",
        action: "acquire",
      })
    ).error,
    "TARGET_BUSY"
  );
  const operationId = crypto.randomUUID();
  const args = {
    sessionId: a.sessionId,
    generation: a.generation,
    leaseId: lease.leaseId,
    operationId,
    operations: [
      {
        type: "create",
        key: "qa",
        kind: "FRAME",
        parentId: "root",
        expectedFingerprint: "before",
      },
    ],
  };
  assert.equal((await call(ca, "apply", args)).status, "complete");
  assert.equal((await call(ca, "apply", args)).created.qa, "A:1");
  assert.equal(creates, 1);
  assert.equal(
    (
      await call(ca, "operation_status", {
        sessionId: a.sessionId,
        operationId,
      })
    ).status,
    "complete"
  );
  assert.equal(
    (
      await call(ca, "write_scope", {
        sessionId: a.sessionId,
        rootId: "root",
        action: "release",
      })
    ).released,
    true
  );
  const artifact = await call(cb, "export", {
    sessionId: b.sessionId,
    nodeId: "root",
    format: "PNG",
  });
  assert.deepEqual(readFileSync(artifact.path), image);
  console.log(
    JSON.stringify(
      {
        passed: true,
        runtime: process.version,
        tarball: resolve(root, packed.filename),
        checks: [
          "isolated npm install",
          "prebuilt plugin/custom port",
          "skill installation",
          "11 stdio tools/instructions",
          "two projects/two controlled document peers",
          "scoped leases",
          "idempotent writes",
          "receipt recovery",
          "verified PNG export",
        ],
      },
      null,
      2
    )
  );
} finally {
  for (const client of clients) await client.close();
  for (const ws of peers) ws.terminate();
  if (bridge) await bridge.stop();
  rmSync(work, { recursive: true, force: true });
}
