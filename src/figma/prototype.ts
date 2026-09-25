import * as v from "valibot";

import {
  BridgeError,
  fingerprint,
  MAX_RESULT,
  parse,
  utf8,
} from "../protocol/index";
import {
  prototypeOperationSchema,
  prototypeReadSchema,
  prototypePlaybackSchema,
  reactionSchema,
  type PrototypeOperation,
} from "../protocol/prototype";

export function prototypeState(node: BaseNode): Record<string, unknown> {
  const state: Record<string, unknown> = {};
  if ("reactions" in node) state.reactions = node.reactions;
  if (node.type === "PAGE") state.flowStartingPoints = node.flowStartingPoints;
  for (const key of [
    "overflowDirection",
    "overlayPositionType",
    "overlayBackground",
    "overlayBackgroundInteraction",
  ] as const) {
    if (key in node) state[key] = (node as FrameNode)[key];
  }
  return state;
}
export function isPrototypeOperation(op: {
  type: string;
}): op is PrototypeOperation {
  return [
    "upsert_reaction",
    "remove_reaction",
    "upsert_flow_start",
    "remove_flow_start",
    "update_prototype_settings",
  ].includes(op.type);
}
function pageOf(node: BaseNode): PageNode | null {
  let current: BaseNode | null = node;
  while (current && current.type !== "PAGE") current = current.parent;
  return current as PageNode | null;
}
async function find(api: PluginAPI, id: string) {
  const node = await api.getNodeByIdAsync(id);
  if (!node || node.removed) throw new BridgeError("PROTOTYPE_NODE_NOT_FOUND");
  return node;
}
function screen(node: BaseNode) {
  return (
    ["FRAME", "COMPONENT", "INSTANCE"].includes(node.type) &&
    (node.parent?.type === "PAGE" || node.parent?.type === "SECTION")
  );
}
function actions(reaction: any): any[] {
  return Array.isArray(reaction.actions)
    ? reaction.actions
    : reaction.action
      ? [reaction.action]
      : [];
}
export async function checkPrototypeOperation(
  api: PluginAPI,
  node: BaseNode,
  op: PrototypeOperation,
  root: BaseNode
) {
  parse(prototypeOperationSchema, op);
  if (op.type === "upsert_reaction" || op.type === "remove_reaction") {
    if (!("setReactionsAsync" in node))
      throw new BridgeError("REACTIONS_UNSUPPORTED");
    if (node.reactions.length > 1000)
      throw new BridgeError("TOO_MANY_REACTIONS");
    if (op.index !== undefined && op.index >= node.reactions.length)
      throw new BridgeError("REACTION_INDEX_NOT_FOUND");
    if (op.type === "upsert_reaction") {
      for (const action of op.reaction.actions)
        if (action.type === "NODE") {
          const destination = await find(api, action.destinationId);
          if (pageOf(destination)?.id !== pageOf(node)?.id)
            throw new BridgeError("PROTOTYPE_CROSS_PAGE");
          if (!screen(destination))
            throw new BridgeError("PROTOTYPE_DESTINATION_NOT_SCREEN");
        }
    }
  } else if (
    op.type === "upsert_flow_start" ||
    op.type === "remove_flow_start"
  ) {
    if (node.type !== "PAGE" || root.id !== node.id)
      throw new BridgeError("FLOW_REQUIRES_PAGE_LEASE");
    if (node.flowStartingPoints.length > 1000)
      throw new BridgeError("TOO_MANY_FLOWS");
    if (op.type === "upsert_flow_start") {
      const destination = await find(api, op.startNodeId);
      if (pageOf(destination)?.id !== node.id || !screen(destination))
        throw new BridgeError("INVALID_FLOW_START");
    } else if (
      !node.flowStartingPoints.some((flow) => flow.nodeId === op.startNodeId)
    )
      throw new BridgeError("FLOW_START_NOT_FOUND");
  } else if (!("overflowDirection" in node))
    throw new BridgeError("PROTOTYPE_SETTINGS_UNSUPPORTED");
}
export async function writePrototypeOperation(
  node: BaseNode,
  op: PrototypeOperation
) {
  if (op.type === "upsert_reaction" || op.type === "remove_reaction") {
    const target = node as SceneNode & ReactionMixin;
    const next = JSON.parse(JSON.stringify(target.reactions)) as Reaction[];
    if (op.type === "remove_reaction") next.splice(op.index, 1);
    else if (op.index === undefined) next.push(op.reaction as Reaction);
    else next[op.index] = op.reaction as Reaction;
    await target.setReactionsAsync(next);
  } else if (
    op.type === "upsert_flow_start" ||
    op.type === "remove_flow_start"
  ) {
    const page = node as PageNode;
    const next = page.flowStartingPoints.map((flow) => ({ ...flow }));
    const index = next.findIndex((flow) => flow.nodeId === op.startNodeId);
    if (op.type === "remove_flow_start") next.splice(index, 1);
    else if (index < 0) next.push({ nodeId: op.startNodeId, name: op.name });
    else next[index] = { nodeId: op.startNodeId, name: op.name };
    page.flowStartingPoints = next;
  } else (node as FrameNode).overflowDirection = op.patch.overflowDirection;
}

type Issue = {
  severity: "error" | "warning";
  code: string;
  nodeId: string;
  reactionIndex?: number;
};
type Snapshot = (node: BaseNode) => { fingerprint: string };
export async function readPrototype(
  api: PluginAPI,
  input: Record<string, unknown>,
  snapshot: Snapshot
) {
  const args = parse(prototypeReadSchema, input);
  const page = await find(api, args.pageId);
  if (page.type !== "PAGE") throw new BridgeError("PROTOTYPE_PAGE_REQUIRED");
  const pageFingerprint = snapshot(page).fingerprint;
  if (utf8(JSON.stringify(page.flowStartingPoints)).length > 16000)
    throw new BridgeError("FLOW_LIST_TOO_LARGE");
  const queue = [...args.nodeIds],
    visited = new Set<string>(),
    pending = new Set<string>(),
    edgeLimited = new Set<string>();
  const scheduled = new Set(args.nodeIds);
  let queueTruncated = false;
  const enqueue = (ids: string[]) => {
    for (const id of ids) {
      if (scheduled.has(id)) continue;
      if (scheduled.size >= 2000) {
        queueTruncated = true;
        pending.add(id);
        break;
      }
      scheduled.add(id);
      queue.push(id);
    }
  };
  const nodes: Array<{
    id: string;
    name: string;
    type: string;
    parentId: string | null;
    fingerprint: string;
    prototype: Record<string, unknown>;
  }> = [];
  const edges: Array<{
    sourceId: string;
    reactionIndex: number;
    actionIndex: number;
    type: string;
    destinationId?: string;
    navigation?: string;
  }> = [];
  const issues: Issue[] = [];
  let bytes = 20000,
    complete = true;
  const issue = (
    severity: Issue["severity"],
    code: string,
    nodeId: string,
    reactionIndex?: number
  ) => {
    if (issues.length < 100)
      issues.push({
        severity,
        code,
        nodeId,
        ...(reactionIndex === undefined ? {} : { reactionIndex }),
      });
    else complete = false;
  };
  while (queue.length) {
    const id = queue.shift()!;
    if (visited.has(id)) continue;
    if (nodes.length >= args.maxNodes) {
      pending.add(id);
      complete = false;
      continue;
    }
    visited.add(id);
    const node = await api.getNodeByIdAsync(id);
    if (!node || node.removed) {
      issue("error", "MISSING_NODE", id);
      continue;
    }
    if (pageOf(node)?.id !== page.id || node.type === "PAGE") {
      issue("error", "OUTSIDE_PROTOTYPE_PAGE", id);
      continue;
    }
    const state = prototypeState(node);
    const entry = {
      id,
      name: node.name,
      type: node.type,
      parentId: node.parent?.id ?? null,
      fingerprint: snapshot(node).fingerprint,
      prototype: state,
    };
    const size = utf8(JSON.stringify(entry)).length;
    if (bytes + size > MAX_RESULT - 96000) {
      pending.add(id);
      complete = false;
      issue("warning", "READ_BUDGET_EXCEEDED", id);
      continue;
    }
    bytes += size;
    nodes.push(entry);
    if ("children" in node) {
      if (node.children.length > 10000) throw new BridgeError("NODE_TOO_WIDE");
      enqueue(node.children.map((child) => child.id));
    }
    if (!("reactions" in node)) continue;
    for (const [reactionIndex, reaction] of node.reactions.entries()) {
      const canonical = {
        trigger: reaction.trigger,
        actions: actions(reaction),
      };
      if (!v.safeParse(reactionSchema, canonical).success)
        issue("warning", "UNSUPPORTED_REACTION", id, reactionIndex);
      for (const [actionIndex, action] of actions(reaction).entries()) {
        if (edges.length >= args.maxEdges) {
          complete = false;
          pending.add(id);
          edgeLimited.add(id);
          continue;
        }
        const edge = {
          sourceId: id,
          reactionIndex,
          actionIndex,
          type: String(action.type),
          ...(typeof action.destinationId === "string"
            ? { destinationId: action.destinationId }
            : {}),
          ...(action.navigation
            ? { navigation: String(action.navigation) }
            : {}),
        };
        const edgeSize = utf8(JSON.stringify(edge)).length;
        if (bytes + edgeSize > MAX_RESULT - 96000) {
          complete = false;
          pending.add(id);
          edgeLimited.add(id);
          continue;
        }
        bytes += edgeSize;
        edges.push(edge);
        if (action.type === "CONDITIONAL")
          issue("warning", "CONDITIONAL_PATH_INDETERMINATE", id, reactionIndex);
        if (action.type === "NODE") {
          const destination =
            typeof action.destinationId === "string"
              ? await api.getNodeByIdAsync(action.destinationId)
              : null;
          if (!destination || destination.removed)
            issue("error", "MISSING_DESTINATION", id, reactionIndex);
          else if (pageOf(destination)?.id !== page.id)
            issue("error", "CROSS_PAGE_DESTINATION", id, reactionIndex);
          else {
            if (
              ["NAVIGATE", "OVERLAY"].includes(action.navigation) &&
              !screen(destination)
            )
              issue("error", "DESTINATION_NOT_SCREEN", id, reactionIndex);
            if (args.traverseDestinations) enqueue([destination.id]);
            else if (
              !visited.has(destination.id) &&
              !queue.includes(destination.id)
            ) {
              pending.add(destination.id);
            }
          }
        }
      }
    }
  }
  for (const id of visited)
    if (
      nodes.some((n) => n.id === id) &&
      !issues.some((i) => i.nodeId === id && i.code === "READ_BUDGET_EXCEEDED")
    ) {
      // Edge-limit continuations must remain pending even when their source was read.
      if (!edgeLimited.has(id)) pending.delete(id);
    }
  if (pending.size || queueTruncated) complete = false;
  if (!page.flowStartingPoints.length)
    issue("warning", "NO_FLOW_STARTS", page.id);
  // Verify the read was stable across awaited lookups; no atomic snapshot is implied.
  if (snapshot(page).fingerprint !== pageFingerprint) {
    complete = false;
    issue("warning", "FLOW_CHANGED_DURING_READ", page.id);
  }
  for (const node of nodes) {
    const live = await api.getNodeByIdAsync(node.id);
    if (
      !live ||
      live.removed ||
      snapshot(live).fingerprint !== node.fingerprint
    ) {
      complete = false;
      issue("warning", "NODE_CHANGED_DURING_READ", node.id);
    }
  }
  for (const flow of page.flowStartingPoints) {
    const start = await api.getNodeByIdAsync(flow.nodeId);
    if (
      !start ||
      start.removed ||
      pageOf(start)?.id !== page.id ||
      !screen(start)
    )
      issue("error", "INVALID_FLOW_START", flow.nodeId);
  }
  const result = {
    pageId: page.id,
    pageFingerprint,
    flowStartingPoints: page.flowStartingPoints,
    nodes,
    edges,
    issues,
    complete,
    pendingNodeIds: [...pending].slice(0, 100),
    pendingTruncated: pending.size > 100 || queueTruncated,
  };
  return { ...result, flowFingerprint: fingerprint(result) };
}
export async function prototypeTool(
  api: PluginAPI,
  method: string,
  input: Record<string, unknown>,
  snapshot: Snapshot
) {
  const playback =
    method === "prepare_prototype_playback"
      ? parse(prototypePlaybackSchema, input)
      : undefined;
  const {
    startNodeId: _start,
    prototypeUrl: _url,
    ...readArgs
  } = playback ?? input;
  const graph = await readPrototype(api, readArgs, snapshot);
  if (method === "read_prototype") return graph;
  const structuralStatus = graph.issues.some((i) => i.severity === "error")
    ? "invalid"
    : !graph.complete ||
        graph.issues.some((i) => i.code === "UNSUPPORTED_REACTION")
      ? "inconclusive"
      : "valid";
  if (!playback)
    return { ...graph, structuralStatus, playbackStatus: "not_run" };
  const start = await find(api, playback.startNodeId);
  if (
    !screen(start) ||
    pageOf(start)?.id !== graph.pageId ||
    !graph.nodes.some((node) => node.id === start.id)
  )
    throw new BridgeError("START_NOT_IN_INSPECTED_FLOW");
  const candidates = graph.edges.map((edge) => ({
    ...edge,
    targetName:
      graph.nodes.find((node) => node.id === edge.sourceId)?.name ?? null,
    expected:
      edge.type === "BACK"
        ? "Previous screen is visible"
        : edge.type === "CLOSE"
          ? "Top overlay closes"
          : edge.navigation === "OVERLAY"
            ? "Destination overlay is visible"
            : edge.navigation === "NAVIGATE"
              ? "Destination screen is visible"
              : "Unsupported action: inspect manually",
    status: "not_run",
  }));
  const steps: typeof candidates = [];
  let stepBytes = 0;
  for (const step of candidates) {
    stepBytes += utf8(JSON.stringify(step)).length;
    if (stepBytes > 64000) break;
    steps.push(step);
  }
  const stepsComplete = steps.length === candidates.length;
  return {
    pageId: graph.pageId,
    flowFingerprint: graph.flowFingerprint,
    complete: graph.complete,
    pendingNodeIds: graph.pendingNodeIds,
    pendingTruncated: graph.pendingTruncated,
    issues: graph.issues,
    stepsComplete,
    structuralStatus,
    playbackStatus: "not_run",
    readyForPlayback: structuralStatus === "valid" && stepsComplete,
    startNodeId: start.id,
    startName: start.name,
    prototypeUrl: playback.prototypeUrl ?? null,
    documentIdentity: "requires_player_confirmation",
    requiredController: "agent_browser_or_desktop",
    steps,
    evidence: {
      format: "figma-bridge.prototype-run",
      version: 1,
      flowFingerprint: graph.flowFingerprint,
      status: "not_run",
      steps: [],
      viewport: null,
    },
    instructions: [
      "Confirm this player is the requested document and starting frame; a supplied URL is not proof.",
      "Restart at the confirmed starting frame before each independent scenario.",
      "Use current screenshots or accessible targets; editor coordinates are not player coordinates.",
      "Record actions, expected outcomes, observations and screenshot paths. Graph edges are candidates, not an ordered test script.",
      "If tools, login or document identity are unavailable, report blocked. Static exports do not prove playback.",
      "Re-read the flow after playback. A changed fingerprint invalidates the run; retain partial/unsupported coverage.",
    ],
  };
}
