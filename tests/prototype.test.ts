import { test, expect } from "bun:test";

import { BridgeEngine, snapshot } from "../src/figma/engine";
import { parse, tools, MAX_RESULT } from "../src/protocol/index";
import { createFigmaMock, MockNode } from "./fixtures/figma-mock";

const fp = (node: MockNode) =>
  snapshot(node as unknown as BaseNode).fingerprint;
function fixture() {
  const api = createFigmaMock();
  const find = (node: MockNode, id: string): MockNode | undefined =>
    node.id === id
      ? node
      : node.children.map((child) => find(child, id)).find(Boolean);
  Object.assign(api, {
    getNodeByIdAsync: async (id: string) => find(api.root, id) ?? null,
    commitUndo() {},
  });
  const page = api.currentPage;
  page.flowStartingPoints = [];
  const make = (name: string, parent = page) => {
    const node = api.createFrame();
    node.name = name;
    parent.appendChild(node);
    node.reactions = [];
    node.overflowDirection = "NONE";
    node.setReactionsAsync = async (reactions: unknown) => {
      node.reactions = reactions;
    };
    return node;
  };
  const a = make("A"),
    b = make("B"),
    overlay = make("Overlay"),
    button = make("Next", a);
  const engine = new BridgeEngine(api as unknown as PluginAPI);
  const operation = (node: MockNode, values: object) => ({
    nodeId: node.id,
    expectedFingerprint: fp(node),
    ...values,
  });
  const request = (operations: unknown[], root = page) => ({
    sessionId: "s",
    generation: "g",
    leaseId: "l",
    operationId: crypto.randomUUID(),
    rootId: root.id,
    operations,
  });
  const apply = async (operations: unknown[], root = page) =>
    engine.dispatch("apply", request(operations, root)) as Promise<any>;
  const read = (extra = {}) => ({
    sessionId: "s",
    pageId: page.id,
    nodeIds: [a.id],
    traverseDestinations: true,
    ...extra,
  });
  return {
    api,
    page,
    a,
    b,
    overlay,
    button,
    engine,
    operation,
    request,
    apply,
    read,
    make,
  };
}
const nav = (id: string) => ({
  trigger: { type: "ON_CLICK" },
  actions: [
    {
      type: "NODE",
      destinationId: id,
      navigation: "NAVIGATE",
      transition: null,
    },
  ],
});

test("scoped prototype writes preserve other interactions and flow starts, read back, and replay once", async () => {
  const f = fixture();
  const legacy = {
    trigger: { type: "ON_HOVER" },
    actions: [{ type: "URL", url: "https://example.com" }],
  };
  f.button.reactions = [legacy];
  f.page.flowStartingPoints = [{ nodeId: f.b.id, name: "Existing" }];
  const request = f.request([
    f.operation(f.button, { type: "upsert_reaction", reaction: nav(f.b.id) }),
    f.operation(f.page, {
      type: "upsert_flow_start",
      startNodeId: f.a.id,
      name: "New flow",
    }),
  ]);
  const first = (await f.engine.dispatch("apply", request)) as any;
  expect(first.status).toBe("complete");
  expect(await f.engine.dispatch("apply", request)).toEqual(first);
  expect(f.button.reactions).toHaveLength(2);
  expect((f.button.reactions as any[])[0]).toEqual(legacy);
  expect(f.page.flowStartingPoints).toEqual([
    { nodeId: f.b.id, name: "Existing" },
    { nodeId: f.a.id, name: "New flow" },
  ]);
  const result = (await f.engine.dispatch("read_prototype", f.read())) as any;
  expect(
    result.nodes.find((n: any) => n.id === f.button.id).prototype.reactions
  ).toHaveLength(2);
  expect(
    result.edges.filter((e: any) => e.destinationId === f.b.id)
  ).toHaveLength(1);
  expect(
    result.issues.some((i: any) => i.code === "UNSUPPORTED_REACTION")
  ).toBe(true);
  expect(
    (
      await f.apply([
        f.operation(f.button, { type: "remove_reaction", index: 1 }),
        f.operation(f.page, { type: "remove_flow_start", startNodeId: f.a.id }),
      ])
    ).status
  ).toBe("complete");
  expect(f.button.reactions).toEqual([legacy]);
  expect(f.page.flowStartingPoints).toEqual([
    { nodeId: f.b.id, name: "Existing" },
  ]);
});

test("human interaction edits invalidate fingerprints; invalid destinations and narrow leases reject before writing", async () => {
  const f = fixture();
  const before = f.operation(f.button, {
    type: "upsert_reaction",
    reaction: nav(f.b.id),
  });
  f.button.reactions = [
    { trigger: { type: "ON_CLICK" }, actions: [{ type: "BACK" }] },
  ];
  expect((await f.apply([before])).error).toBe("STALE_FINGERPRINT");
  expect(
    (
      await f.apply([
        f.operation(f.button, {
          type: "upsert_reaction",
          reaction: nav("missing"),
        }),
      ])
    ).status
  ).toBe("rejected_before_write");
  const page2 = new MockNode("PAGE");
  f.api.root.appendChild(page2);
  const other = f.make("Other", page2);
  expect(
    (
      await f.apply([
        f.operation(f.button, {
          type: "upsert_reaction",
          reaction: nav(other.id),
        }),
      ])
    ).error
  ).toBe("PROTOTYPE_CROSS_PAGE");
  expect(
    (
      await f.apply(
        [f.operation(f.b, { type: "upsert_reaction", reaction: nav(f.a.id) })],
        f.a
      )
    ).error
  ).toBe("OUTSIDE_WRITE_SCOPE");
  expect(
    (
      await f.apply(
        [
          f.operation(f.a, {
            type: "upsert_flow_start",
            startNodeId: f.a.id,
            name: "No",
          }),
        ],
        f.a
      )
    ).error
  ).toBe("FLOW_REQUIRES_PAGE_LEASE");
  expect(
    (
      await f.apply([
        f.operation(f.button, {
          type: "upsert_reaction",
          reaction: nav(f.button.id),
        }),
      ])
    ).error
  ).toBe("PROTOTYPE_DESTINATION_NOT_SCREEN");
});

test("dry-run, cancellation and native failures retain receipt semantics", async () => {
  const f = fixture();
  const request = f.request([
    f.operation(f.button, { type: "upsert_reaction", reaction: nav(f.b.id) }),
  ]);
  expect(
    ((await f.engine.dispatch("apply", { ...request, dryRun: true })) as any)
      .status
  ).toBe("preflight");
  expect(f.button.reactions).toEqual([]);
  await f.engine.dispatch("cancel_operation", {
    operationId: request.operationId,
  });
  expect(((await f.engine.dispatch("apply", request)) as any).error).toBe(
    "CANCELLED"
  );
  f.b.setReactionsAsync = async () => {
    throw new Error("Native failure");
  };
  const partial = await f.apply([
    f.operation(f.button, { type: "upsert_reaction", reaction: nav(f.b.id) }),
    f.operation(f.b, { type: "upsert_reaction", reaction: nav(f.a.id) }),
  ]);
  expect(partial.status).toBe("partial");
  expect(partial.steps).toHaveLength(1);
  expect(f.button.reactions).toHaveLength(1);
});

test("prototype destination is rechecked after preflight and source is checked after async validation", async () => {
  const f = fixture();
  const original = f.api.getNodeByIdAsync as (
    id: string
  ) => Promise<MockNode | null>;
  let destinationReads = 0;
  f.api.getNodeByIdAsync = async (id: string) => {
    const node = await original(id);
    if (id === f.b.id && ++destinationReads === 2)
      f.button.reactions = [
        { trigger: { type: "ON_CLICK" }, actions: [{ type: "BACK" }] },
      ];
    return node;
  };
  expect(
    (
      await f.apply([
        f.operation(f.button, {
          type: "upsert_reaction",
          reaction: nav(f.b.id),
        }),
      ])
    ).error
  ).toBe("STALE_FINGERPRINT");
  expect(f.button.reactions).toHaveLength(1);
});

test("cyclic flows terminate, budgets are explicit and broken links are invalid", async () => {
  const f = fixture();
  f.button.reactions = [nav(f.b.id)];
  f.b.reactions = [nav(f.a.id)];
  f.page.flowStartingPoints = [{ nodeId: f.a.id, name: "Flow" }];
  const full = (await f.engine.dispatch("validate_prototype", f.read())) as any;
  expect(full.complete).toBe(true);
  expect(full.structuralStatus).toBe("valid");
  expect(full.nodes).toHaveLength(3);
  expect(full.edges).toHaveLength(2);
  const bounded = (await f.engine.dispatch(
    "validate_prototype",
    f.read({ maxNodes: 1 })
  )) as any;
  expect(bounded.complete).toBe(false);
  expect(bounded.structuralStatus).toBe("inconclusive");
  expect(bounded.pendingNodeIds).toContain(f.button.id);
  const edgeLimited = (await f.engine.dispatch(
    "read_prototype",
    f.read({ maxEdges: 1 })
  )) as any;
  expect(edgeLimited.complete).toBe(false);
  expect(edgeLimited.pendingNodeIds).toContain(f.b.id);
  f.b.reactions = [nav("deleted")];
  expect(
    ((await f.engine.dispatch("validate_prototype", f.read())) as any)
      .structuralStatus
  ).toBe("invalid");
});

test("playback preparation never claims execution or verified document identity", async () => {
  const f = fixture();
  f.button.reactions = [nav(f.b.id)];
  f.page.flowStartingPoints = [{ nodeId: f.a.id, name: "Flow" }];
  const result = (await f.engine.dispatch("prepare_prototype_playback", {
    ...f.read(),
    startNodeId: f.a.id,
    prototypeUrl: "https://www.figma.com/proto/ExampleFile/Fixture?node-id=1-2",
  })) as any;
  expect(result.readyForPlayback).toBe(true);
  expect(result.playbackStatus).toBe("not_run");
  expect(result.documentIdentity).toBe("requires_player_confirmation");
  expect(result.steps[0].status).toBe("not_run");
  expect(JSON.stringify(result).length).toBeLessThan(MAX_RESULT);
  for (const prototypeUrl of [
    "https://figma.com.evil.test/proto/x",
    "javascript:alert(1)",
    "https://user@figma.com/proto/x",
    "https://figma.com/design/x",
  ]) {
    expect(() =>
      parse(tools.prepare_prototype_playback.schema, {
        ...f.read(),
        startNodeId: f.a.id,
        prototypeUrl,
      })
    ).toThrow();
  }
  await expect(
    f.engine.dispatch("prepare_prototype_playback", {
      ...f.read(),
      startNodeId: f.overlay.id,
    })
  ).rejects.toThrow("START_NOT_IN_INSPECTED_FLOW");
});

test("prototype schemas reject multi-actions, arbitrary patches and unconfirmed create references", async () => {
  const f = fixture();
  for (const operation of [
    f.operation(f.button, {
      type: "upsert_reaction",
      reaction: {
        trigger: { type: "ON_CLICK" },
        actions: [{ type: "BACK" }, { type: "CLOSE" }],
      },
    }),
    f.operation(f.a, {
      type: "update_prototype_settings",
      patch: { overlayBackground: {} },
    }),
    f.operation(f.button, { type: "upsert_reaction", reaction: nav("$new") }),
  ]) {
    const { rootId, ...payload } = f.request([operation]);
    expect(() => parse(tools.apply.schema, payload)).toThrow();
  }
});

// These defaults and the legacy action mirror are emitted by the real Figma API.
test("native normalized reactions remain supported and automatic flow starts trigger stale guards", async () => {
  const f = fixture();
  const reaction = nav(f.b.id);
  const action = {
    ...reaction.actions[0],
    resetVideoPosition: false,
    resetScrollPosition: true,
  };
  f.button.reactions = [
    { trigger: reaction.trigger, action, actions: [action] },
  ];
  const validation = (await f.engine.dispatch(
    "validate_prototype",
    f.read()
  )) as any;
  expect(validation.structuralStatus).toBe("valid");
  f.button.setReactionsAsync = async (reactions: unknown) => {
    f.button.reactions = reactions;
    f.page.flowStartingPoints = [{ nodeId: f.a.id, name: "Flow 1" }];
  };
  const receipt = await f.apply([
    f.operation(f.button, { type: "upsert_reaction", index: 0, reaction }),
    f.operation(f.page, {
      type: "upsert_flow_start",
      startNodeId: f.a.id,
      name: "QA",
    }),
  ]);
  expect(receipt.status).toBe("partial");
  expect(receipt.steps).toHaveLength(1);
  expect(receipt.error).toBe("STALE_FINGERPRINT");
});

test("prototype output budgets count UTF-8 bytes and report incomplete coverage", async () => {
  const f = fixture();
  for (let index = 0; index < 100; index++) f.make("🧭".repeat(1000), f.a);
  const graph = (await f.engine.dispatch(
    "read_prototype",
    f.read({ maxNodes: 500 })
  )) as any;
  expect(Buffer.byteLength(JSON.stringify(graph))).toBeLessThan(MAX_RESULT);
  expect(graph.complete).toBe(false);
  expect(graph.pendingNodeIds.length).toBeGreaterThan(0);
  expect(
    graph.issues.some((issue: any) => issue.code === "READ_BUDGET_EXCEEDED")
  ).toBe(true);
});

test("scenario warnings distinguish unreachable screens, intentional terminals and history-dependent exits", async () => {
  const f = fixture();
  f.button.reactions = [nav(f.b.id)];
  const read = f.read({
    nodeIds: [f.a.id, f.overlay.id],
    scenario: {
      startNodeId: f.a.id,
      expectedScreenIds: [f.b.id, f.overlay.id],
      requireExitNodeIds: [f.b.id],
    },
  });
  const result = (await f.engine.dispatch("validate_prototype", read)) as any;
  expect(result.issues.map((i: any) => i.code)).toContain("UNREACHABLE_SCREEN");
  expect(result.issues.map((i: any) => i.code)).toContain("MISSING_EXIT_PATH");
  expect(result.scenarioStatus).toBe("warnings");
  const terminal = (await f.engine.dispatch(
    "validate_prototype",
    f.read({ scenario: { startNodeId: f.a.id, expectedScreenIds: [f.b.id] } })
  )) as any;
  expect(terminal.scenarioStatus).toBe("satisfied");
  f.b.reactions = [
    { trigger: { type: "ON_CLICK" }, actions: [{ type: "BACK" }] },
  ];
  const back = (await f.engine.dispatch(
    "validate_prototype",
    f.read({ scenario: { startNodeId: f.a.id, requireExitNodeIds: [f.b.id] } })
  )) as any;
  expect(back.scenarioStatus).toBe("requires_playback");
  expect(back.structuralStatus).toBe("valid");
  expect(back.issues.map((i: any) => i.code)).toContain(
    "EXIT_REQUIRES_PLAYBACK_HISTORY"
  );
  f.b.reactions = [nav(f.a.id)];
  const cycle = (await f.engine.dispatch(
    "validate_prototype",
    f.read({ scenario: { startNodeId: f.a.id, requireExitNodeIds: [f.b.id] } })
  )) as any;
  expect(cycle.scenarioStatus).toBe("satisfied");
});

test("partial/unsupported scenario coverage never claims an unreachable or missing exit", async () => {
  const f = fixture();
  f.button.reactions = [nav(f.b.id)];
  for (const extra of [
    { maxNodes: 1 },
    { nodeIds: [f.a.id], traverseDestinations: false },
    { nodeIds: [f.a.id, f.b.id], maxEdges: 1 },
  ]) {
    f.b.reactions = [nav(f.a.id)];
    const result = (await f.engine.dispatch(
      "validate_prototype",
      f.read({
        ...extra,
        scenario: {
          startNodeId: f.a.id,
          expectedScreenIds: [f.b.id],
          requireExitNodeIds: [f.b.id],
        },
      })
    )) as any;
    expect(result.scenarioStatus).toBe("inconclusive");
    expect(
      result.issues.some((i: any) =>
        ["UNREACHABLE_SCREEN", "MISSING_EXIT_PATH"].includes(i.code)
      )
    ).toBe(false);
  }
});

test("playback rejects expectations validated from a different starting screen", async () => {
  const f = fixture();
  await expect(
    f.engine.dispatch(
      "prepare_prototype_playback",
      f.read({
        nodeIds: [f.a.id, f.b.id],
        startNodeId: f.a.id,
        scenario: { startNodeId: f.b.id, expectedScreenIds: [f.b.id] },
      })
    )
  ).rejects.toThrow("SCENARIO_START_MISMATCH");
});

for (const method of ["validate_prototype", "prepare_prototype_playback"]) {
  for (const phase of ["node verification", "flow-start validation"]) {
    test(`${method} detects flow edits during final ${phase} lookups`, async () => {
      const f = fixture();
      f.page.flowStartingPoints = [{ nodeId: f.a.id, name: "Original flow" }];
      const original = f.api.getNodeByIdAsync as (
        id: string
      ) => Promise<MockNode | null>;
      const reads = new Map<string, number>();
      let changed = false;
      f.api.getNodeByIdAsync = async (id: string) => {
        const node = await original(id);
        const count = (reads.get(id) ?? 0) + 1;
        reads.set(id, count);
        const editNow =
          phase === "node verification"
            ? id === f.button.id && count === 2
            : id === f.a.id && count === 3;
        if (editNow) {
          f.page.flowStartingPoints = [{ nodeId: f.a.id, name: "Edited flow" }];
          changed = true;
        }
        return node;
      };
      const result = (await f.engine.dispatch(
        method,
        f.read({
          scenario: { startNodeId: f.a.id },
          ...(method === "prepare_prototype_playback"
            ? { startNodeId: f.a.id }
            : {}),
        })
      )) as any;
      expect(changed).toBe(true);
      expect(result.complete).toBe(false);
      expect(result.structuralStatus).toBe("inconclusive");
      expect(result.scenarioStatus).toBe("inconclusive");
      expect(result.issues).toContainEqual({
        severity: "warning",
        code: "FLOW_CHANGED_DURING_READ",
        nodeId: f.page.id,
      });
      if (method === "prepare_prototype_playback")
        expect(result.readyForPlayback).toBe(false);
    });
  }
}
