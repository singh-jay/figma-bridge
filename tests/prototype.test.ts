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

test("prototype schemas reject excessive actions, arbitrary patches and unconfirmed create references", async () => {
  const f = fixture();
  for (const operation of [
    f.operation(f.button, {
      type: "upsert_reaction",
      reaction: {
        trigger: { type: "ON_CLICK" },
        actions: Array.from({ length: 17 }, () => ({ type: "BACK" })),
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

const boolValue = (value: boolean) => ({
  type: "BOOLEAN",
  resolvedType: "BOOLEAN",
  value,
});
function prototypeVariables(f: ReturnType<typeof fixture>) {
  const variable = {
    id: "VariableID:qa",
    name: "qa",
    resolvedType: "BOOLEAN",
    remote: false,
    variableCollectionId: "collection:qa",
    valuesByMode: { default: false },
  };
  const collection = {
    id: "collection:qa",
    name: "QA",
    remote: false,
    modes: [
      { modeId: "default", name: "Default" },
      { modeId: "alternate", name: "Alternate" },
    ],
    defaultModeId: "default",
  };
  Object.assign(f.api.variables, {
    getVariableByIdAsync: async (id: string) =>
      id === variable.id ? variable : null,
    getVariableCollectionByIdAsync: async (id: string) =>
      id === collection.id ? collection : null,
  });
  return { variable, collection };
}
test("advanced triggers and Smart Animate retain timing and input metadata in readback", async () => {
  const f = fixture();
  for (const trigger of [
    { type: "ON_HOVER" },
    { type: "ON_DRAG" },
    { type: "ON_PRESS" },
    { type: "ON_KEY_DOWN", device: "KEYBOARD", keyCodes: [16, 65] },
    { type: "AFTER_TIMEOUT", timeout: 0.8 },
    { type: "MOUSE_ENTER", delay: 0.1, deprecatedVersion: false },
  ]) {
    const reaction = nav(f.b.id) as any;
    reaction.trigger = trigger;
    reaction.actions[0].transition = {
      type: "SMART_ANIMATE",
      duration: 0.4,
      easing: { type: "GENTLE" },
    };
    expect(
      (
        await f.apply([
          f.operation(f.button, { type: "upsert_reaction", reaction }),
        ])
      ).status
    ).toBe("complete");
  }
  const flow = (await f.engine.dispatch("prepare_prototype_playback", {
    ...f.read(),
    startNodeId: f.a.id,
  })) as any;
  expect(flow.readyForPlayback).toBe(true);
  expect(flow.steps[3].trigger.keyCodes).toEqual([16, 65]);
  expect(flow.steps[4].trigger.timeout).toBe(0.8);
  expect(flow.steps[0].action.transition.type).toBe("SMART_ANIMATE");
});
test("conditional actions validate references recursively and emit unique branch checks", async () => {
  const f = fixture();
  const { variable } = prototypeVariables(f);
  const condition = {
    type: "VARIABLE_ALIAS",
    resolvedType: "BOOLEAN",
    value: { type: "VARIABLE_ALIAS", id: variable.id },
  };
  const reaction = {
    trigger: { type: "ON_CLICK" },
    actions: [
      {
        type: "SET_VARIABLE",
        variableId: variable.id,
        variableValue: boolValue(true),
      },
      {
        type: "CONDITIONAL",
        conditionalBlocks: [
          { condition, actions: nav(f.b.id).actions },
          {
            actions: [
              {
                type: "SET_VARIABLE",
                variableId: variable.id,
                variableValue: boolValue(false),
              },
            ],
          },
        ],
      },
    ],
  };
  expect(
    (
      await f.apply([
        f.operation(f.button, { type: "upsert_reaction", reaction }),
      ])
    ).status
  ).toBe("complete");
  const graph = (await f.engine.dispatch("prepare_prototype_playback", {
    ...f.read({
      scenario: { startNodeId: f.a.id, expectedScreenIds: [f.b.id] },
    }),
    startNodeId: f.a.id,
  })) as any;
  expect(graph.structuralStatus).toBe("valid");
  expect(graph.scenarioStatus).toBe("requires_playback");
  expect(
    graph.steps
      .filter((s: any) => s.type === "CONDITIONAL_BRANCH")
      .map((s: any) => s.actionPath)
  ).toEqual(["1/branch/0", "1/branch/1"]);
  expect(graph.steps.some((s: any) => s.destinationId === f.b.id)).toBe(true);
  const before = graph.flowFingerprint;
  variable.valuesByMode.default = true;
  expect(
    (
      (await f.engine.dispatch("prepare_prototype_playback", {
        ...f.read({
          scenario: { startNodeId: f.a.id, expectedScreenIds: [f.b.id] },
        }),
        startNodeId: f.a.id,
      })) as any
    ).flowFingerprint
  ).not.toBe(before);
  reaction.actions[1] = {
    type: "CONDITIONAL",
    conditionalBlocks: [{ condition, actions: nav("missing").actions }],
  } as any;
  expect(
    (
      await f.apply([
        f.operation(f.button, { type: "upsert_reaction", reaction }),
      ])
    ).error
  ).toBe("PROTOTYPE_NODE_NOT_FOUND");
});
test("expressions and variable modes enforce type, arity, availability and mode membership", async () => {
  const f = fixture();
  const { variable, collection } = prototypeVariables(f);
  const applyActions = (actions: unknown[]) =>
    f.apply([
      f.operation(f.button, {
        type: "upsert_reaction",
        reaction: { trigger: { type: "ON_CLICK" }, actions },
      }),
    ]);
  const assign = (value: unknown) => ({
    type: "SET_VARIABLE",
    variableId: variable.id,
    variableValue: value,
  });
  expect(
    (
      await applyActions([
        assign({
          type: "EXPRESSION",
          resolvedType: "BOOLEAN",
          value: {
            expressionFunction: "NOT",
            expressionArguments: [boolValue(true)],
          },
        }),
        {
          type: "SET_VARIABLE_MODE",
          variableCollectionId: collection.id,
          variableModeId: "alternate",
        },
      ])
    ).status
  ).toBe("complete");
  expect(
    (
      await applyActions([
        assign({ type: "FLOAT", resolvedType: "FLOAT", value: 4 }),
      ])
    ).error
  ).toBe("PROTOTYPE_VALUE_TYPE_MISMATCH");
  expect(
    (
      await applyActions([
        assign({
          type: "EXPRESSION",
          resolvedType: "BOOLEAN",
          value: {
            expressionFunction: "AND",
            expressionArguments: [boolValue(true)],
          },
        }),
      ])
    ).error
  ).toBe("EXPRESSION_ARITY_MISMATCH");
  expect(
    (
      await applyActions([
        {
          type: "SET_VARIABLE_MODE",
          variableCollectionId: collection.id,
          variableModeId: "missing",
        },
      ])
    ).error
  ).toBe("PROTOTYPE_MODE_NOT_FOUND");
  expect(
    (
      await applyActions([
        {
          type: "CONDITIONAL",
          conditionalBlocks: [
            {
              condition: { type: "FLOAT", resolvedType: "FLOAT", value: 1 },
              actions: [{ type: "BACK" }],
            },
          ],
        },
      ])
    ).error
  ).toBe("CONDITION_MUST_BE_BOOLEAN");
  variable.remote = true;
  expect((await applyActions([assign(boolValue(false))])).error).toBe(
    "PROTOTYPE_VARIABLE_UNAVAILABLE"
  );
});
test("change-to permits only variants in the source component set", async () => {
  const f = fixture();
  const set = f.make("Set");
  set.type = "COMPONENT_SET";
  const first = f.make("Default", set);
  first.type = "COMPONENT";
  const next = f.make("Hover", set);
  next.type = "COMPONENT";
  const nested = f.make("Button", first);
  const reaction = nav(next.id) as any;
  reaction.actions[0].navigation = "CHANGE_TO";
  expect(
    (
      await f.apply([
        f.operation(nested, { type: "upsert_reaction", reaction }),
      ])
    ).status
  ).toBe("complete");
  expect(
    (
      (await f.engine.dispatch(
        "validate_prototype",
        f.read({ nodeIds: [set.id] })
      )) as any
    ).structuralStatus
  ).toBe("valid");
  reaction.actions[0].destinationId = f.b.id;
  expect(
    (
      await f.apply([
        f.operation(nested, { type: "upsert_reaction", reaction }),
      ])
    ).error
  ).toBe("CHANGE_TO_REQUIRES_SIBLING_VARIANT");
});
test("advanced schemas reject excess nesting, invalid inputs and misplaced else", () => {
  const f = fixture();
  const check = (reaction: unknown) => {
    const { rootId, ...payload } = f.request([
      f.operation(f.button, { type: "upsert_reaction", reaction }),
    ]);
    expect(() => parse(tools.apply.schema, payload)).toThrow();
  };
  for (const trigger of [
    { type: "AFTER_TIMEOUT", timeout: -1 },
    { type: "ON_KEY_DOWN", device: "KEYBOARD", keyCodes: [65, 65] },
    { type: "ON_KEY_DOWN", device: "KEYBOARD", keyCodes: [] },
  ])
    check({ trigger, actions: [{ type: "BACK" }] });
  let actions: any[] = [{ type: "BACK" }];
  for (let i = 0; i < 4; i++)
    actions = [
      {
        type: "CONDITIONAL",
        conditionalBlocks: [{ condition: boolValue(true), actions }],
      },
    ];
  check({ trigger: { type: "ON_CLICK" }, actions });
  check({
    trigger: { type: "ON_CLICK" },
    actions: [
      {
        type: "CONDITIONAL",
        conditionalBlocks: [
          { actions: [{ type: "BACK" }] },
          { condition: boolValue(true), actions: [{ type: "BACK" }] },
        ],
      },
    ],
  });
});

test("variable dependency changes during awaited reads prevent complete validation", async () => {
  const f = fixture();
  const { variable, collection } = prototypeVariables(f);
  f.button.reactions = [
    {
      trigger: { type: "ON_CLICK" },
      actions: [
        {
          type: "SET_VARIABLE",
          variableId: variable.id,
          variableValue: boolValue(true),
        },
      ],
    },
  ];
  f.api.variables.getVariableCollectionByIdAsync = async () => {
    variable.valuesByMode.default = true;
    return collection;
  };
  const result = (await f.engine.dispatch(
    "validate_prototype",
    f.read()
  )) as any;
  expect(result.complete).toBe(false);
  expect(result.structuralStatus).toBe("inconclusive");
  expect(
    result.issues.some(
      (issue: any) => issue.code === "PROTOTYPE_RESOURCE_CHANGED"
    )
  ).toBe(true);
});

test("default variable aliases affect fingerprints and cyclic aliases are rejected", async () => {
  const f = fixture();
  const { variable } = prototypeVariables(f);
  const alias = {
    ...variable,
    id: "VariableID:alias",
    valuesByMode: { default: false },
  };
  (variable.valuesByMode as any).default = {
    type: "VARIABLE_ALIAS",
    id: alias.id,
  };
  f.api.variables.getVariableByIdAsync = async (id: string) =>
    id === variable.id ? variable : id === alias.id ? alias : null;
  const reaction = {
    trigger: { type: "ON_CLICK" },
    actions: [
      {
        type: "SET_VARIABLE",
        variableId: variable.id,
        variableValue: boolValue(true),
      },
    ],
  };
  expect(
    (
      await f.apply([
        f.operation(f.button, { type: "upsert_reaction", reaction }),
      ])
    ).status
  ).toBe("complete");
  const before = (await f.engine.dispatch("read_prototype", f.read())) as any;
  expect(before.dependencies.some((item: any) => item.id === alias.id)).toBe(
    true
  );
  alias.valuesByMode.default = true;
  const after = (await f.engine.dispatch("read_prototype", f.read())) as any;
  expect(after.flowFingerprint).not.toBe(before.flowFingerprint);
  (alias.valuesByMode as any).default = {
    type: "VARIABLE_ALIAS",
    id: variable.id,
  };
  expect(
    (
      await f.apply([
        f.operation(f.button, { type: "upsert_reaction", reaction }),
      ])
    ).error
  ).toBe("PROTOTYPE_VARIABLE_ALIAS_CYCLE");
});
