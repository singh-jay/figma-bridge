import { test, expect } from "bun:test";

import { BridgeEngine, snapshot } from "../src/figma/engine";
import { createFigmaMock, MockNode } from "./fixtures/figma-mock";
function fixture() {
  const api = createFigmaMock();
  const page = api.currentPage;
  const find = (node: MockNode, id: string): MockNode | undefined =>
    node.id === id ? node : node.children.map((n) => find(n, id)).find(Boolean);
  Object.assign(api, {
    getNodeByIdAsync: async (id: string) => find(api.root, id) ?? null,
    commitUndo: () => {},
    mixed: Symbol("mixed"),
  });
  return { api, page, engine: new BridgeEngine(api as unknown as PluginAPI) };
}
function args(page: MockNode, operations: unknown[]) {
  return {
    sessionId: "s",
    generation: "g",
    leaseId: "l",
    operationId: crypto.randomUUID(),
    rootId: page.id,
    operations,
  };
}
const fp = (n: MockNode) => snapshot(n as unknown as BaseNode).fingerprint;
test("stale fingerprints, locked targets and missing fonts fail before writes", async () => {
  const { engine, page, api } = fixture();
  const create = {
    type: "create",
    kind: "FRAME",
    key: "a",
    parentId: page.id,
    expectedFingerprint: "stale",
  };
  const result = (await engine.dispatch("apply", args(page, [create]))) as any;
  expect(result.status).toBe("rejected_before_write");
  expect(page.children).toHaveLength(0);
  const font = (await engine.dispatch(
    "apply",
    args(page, [
      {
        ...create,
        kind: "TEXT",
        expectedFingerprint: fp(page),
        font: { family: "missing", style: "Regular" },
      },
    ])
  )) as any;
  expect(font.status).toBe("rejected_before_write");
  expect(page.children).toHaveLength(0);
  const n = api.createFrame();
  n.locked = true;
  const locked = (await engine.dispatch(
    "apply",
    args(page, [
      {
        type: "update",
        nodeId: n.id,
        expectedFingerprint: fp(n),
        patch: { name: "changed" },
      },
    ])
  )) as any;
  expect(locked.error).toBe("NODE_LOCKED");
});
test("same operation ID returns receipt without duplicate nodes; different payload rejected", async () => {
  const { engine, page } = fixture();
  const request = args(page, [
    {
      type: "create",
      kind: "FRAME",
      key: "a",
      parentId: page.id,
      expectedFingerprint: fp(page),
      patch: { name: "QA fixture" },
    },
  ]);
  const first = (await engine.dispatch("apply", request)) as any;
  expect(first.status).toBe("complete");
  expect(await engine.dispatch("apply", request)).toEqual(first);
  expect(page.children).toHaveLength(1);
  await expect(
    engine.dispatch("apply", { ...request, operations: [] })
  ).rejects.toThrow();
});
test("partial failure returns created IDs; cancellation does not start another write", async () => {
  const { engine, page, api } = fixture();
  const make = api.createFrame;
  api.createFrame = () => {
    const node = make();
    node.resize = () => {
      throw new Error("Injected native failure");
    };
    return node;
  };
  const request = args(page, [
    {
      type: "create",
      kind: "FRAME",
      key: "a",
      parentId: page.id,
      expectedFingerprint: fp(page),
      patch: { width: 120 },
    },
  ]);
  const result = (await engine.dispatch("apply", request)) as any;
  expect(result.status).toBe("partial");
  expect(result.created.a).toBe(page.children[0].id);
  const cancel = args(page, [
    {
      type: "create",
      kind: "FRAME",
      key: "b",
      parentId: page.id,
      expectedFingerprint: fp(page),
    },
  ]);
  await engine.dispatch("cancel_operation", {
    operationId: cancel.operationId,
  });
  expect(((await engine.dispatch("apply", cancel)) as any).error).toBe(
    "CANCELLED"
  );
  expect(page.children).toHaveLength(1);
});
test("reads explicitly report depth truncation and fingerprints change on human edits", async () => {
  const { engine, page, api } = fixture();
  const n = api.createFrame();
  const before = fp(n);
  n.name = "Human edit";
  expect(fp(n)).not.toBe(before);
  const read = (await engine.dispatch("read_nodes", {
    sessionId: "s",
    nodeIds: [page.id],
    depth: 0,
    maxNodes: 1,
  })) as any;
  expect(read.complete).toBe(false);
  expect(read.pendingNodeIds).toEqual([n.id]);
});
