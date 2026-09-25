import {
  BridgeError,
  fingerprint,
  MAX_OPERATIONS,
  MAX_RESULT,
  parse,
  tools,
  type Operation,
} from "../protocol/index";
import {
  prototypeState,
  prototypeTool,
  isPrototypeOperation,
  checkPrototypeOperation,
  writePrototypeOperation,
} from "./prototype";
import { readResources, Exports } from "./resources";
import { serializeBridgeNode } from "./serialize";

const fields = [
  "name",
  "visible",
  "locked",
  "x",
  "y",
  "width",
  "height",
  "rotation",
  "relativeTransform",
  "opacity",
  "fills",
  "strokes",
  "strokeWeight",
  "effects",
  "cornerRadius",
  "clipsContent",
  "layoutMode",
  "layoutSizingHorizontal",
  "layoutSizingVertical",
  "primaryAxisAlignItems",
  "counterAxisAlignItems",
  "paddingTop",
  "paddingBottom",
  "paddingLeft",
  "paddingRight",
  "itemSpacing",
  "fontSize",
  "fontName",
  "characters",
  "textAutoResize",
  "textAlignHorizontal",
  "lineHeight",
  "letterSpacing",
  "boundVariables",
  "componentProperties",
] as const;
function normalized(value: unknown): unknown {
  if (typeof value === "symbol") return { $figma: "mixed" };
  if (value === undefined) return undefined;
  return JSON.parse(
    JSON.stringify(value, (_, v) =>
      typeof v === "symbol" ? { $figma: "mixed" } : v
    )
  );
}
export function snapshot(node: BaseNode) {
  const properties: Record<string, unknown> = {};
  const source = node as unknown as Record<string, unknown>;
  for (const field of fields) {
    if (!(field in node)) continue;
    try {
      properties[field] = normalized(source[field]);
    } catch {
      properties[field] = { unavailable: true };
    }
  }
  if (node.type === "TEXT" && node.characters.length > 8192) {
    properties.characters = node.characters.slice(0, 8192);
    properties.textTruncated = true;
    properties.textLength = node.characters.length;
    properties.textHash = fingerprint(node.characters);
    properties.nextOffset = 8192;
  }
  const children =
    "children" in node ? node.children.map((child) => child.id) : [];
  if (children.length > 10_000) throw new BridgeError("NODE_TOO_WIDE");
  if (JSON.stringify(properties).length > 96_000)
    throw new BridgeError("NODE_TOO_LARGE");
  const state = {
    id: node.id,
    type: node.type,
    parentId: node.parent?.id ?? null,
    properties,
    prototypeFingerprint: fingerprint(prototypeState(node)),
    children,
  };
  return { ...state, fingerprint: fingerprint(state) };
}
const lookup = async (api: PluginAPI, id: string) => {
  const node = await api.getNodeByIdAsync(id);
  if (!node || node.removed) throw new BridgeError("NODE_NOT_FOUND");
  return node;
};
function inScope(node: BaseNode, root: BaseNode) {
  let at: BaseNode | null = node,
    inside = false;
  while (at) {
    if ("locked" in at && at.locked) throw new BridgeError("NODE_LOCKED");
    if (at.id === root.id) inside = true;
    at = at.parent;
  }
  if (!inside) throw new BridgeError("OUTSIDE_WRITE_SCOPE");
}
function checkPatch(node: BaseNode, patch: Record<string, unknown>) {
  for (const field of Object.keys(patch))
    if (!(field in node))
      throw new BridgeError(`UNSUPPORTED_PROPERTY:${field}`);
  if ("width" in patch && Number(patch.width) <= 0)
    throw new BridgeError("INVALID_WIDTH");
  if ("height" in patch && Number(patch.height) <= 0)
    throw new BridgeError("INVALID_HEIGHT");
}
function patchNode(node: BaseNode, patch: Record<string, unknown>) {
  checkPatch(node, patch);
  const { width, height, ...rest } = patch;
  const target = node as unknown as Record<string, unknown>;
  for (const [key, value] of Object.entries(rest)) target[key] = value;
  if (width !== undefined || height !== undefined) {
    if (!("resize" in node)) throw new BridgeError("NOT_RESIZABLE");
    node.resize(Number(width ?? node.width), Number(height ?? node.height));
  }
}
type Receipt = {
  operationId: string;
  status: string;
  steps: Array<{ index: number; nodeId: string }>;
  created: Record<string, string>;
  error?: string;
};
export class BridgeEngine {
  private cancelled = new Set<string>();
  private receipts = new Map<string, { hash: string; result: Receipt }>();
  private exports: Exports;
  constructor(private api: PluginAPI) {
    this.exports = new Exports(api);
  }
  async dispatch(
    method: string,
    input: Record<string, unknown>
  ): Promise<unknown> {
    if (method === "cancel_operation") {
      if (this.cancelled.size >= 500)
        throw new BridgeError("SESSION_OPERATION_LIMIT");
      this.cancelled.add(String(input.operationId));
      return { requested: true, operationId: input.operationId };
    }
    if (
      [
        "read_prototype",
        "validate_prototype",
        "prepare_prototype_playback",
      ].includes(method)
    )
      return prototypeTool(this.api, method, input, snapshot);
    if (method === "read_text") {
      const args = parse(tools.read_text.schema, input),
        node = await lookup(this.api, args.nodeId);
      if (node.type !== "TEXT") throw new BridgeError("NOT_TEXT");
      const hash = fingerprint(node.characters);
      if (args.expectedTextHash && args.expectedTextHash !== hash)
        throw new BridgeError("TEXT_CHANGED");
      if (args.offset > node.characters.length)
        throw new BridgeError("INVALID_OFFSET");
      const end = Math.min(node.characters.length, args.offset + args.length);
      return {
        nodeId: node.id,
        text: node.characters.slice(args.offset, end),
        segments: node.getStyledTextSegments(
          ["fontName", "fontSize", "fills", "lineHeight", "letterSpacing"],
          args.offset,
          end
        ),
        textHash: hash,
        nextOffset: end < node.characters.length ? end : null,
        complete: end === node.characters.length,
      };
    }
    if (method === "read_resources") return readResources(this.api, input);
    if (method.startsWith("export_"))
      return this.exports.dispatch(method, input);
    if (method === "selection")
      return {
        page: { id: this.api.currentPage.id, name: this.api.currentPage.name },
        selection: this.api.currentPage.selection.map((n) => ({
          id: n.id,
          name: n.name,
          type: n.type,
        })),
        documentName: this.api.root.name,
      };
    if (method === "scope") {
      const root = await lookup(this.api, String(input.rootId));
      if (!["PAGE", "FRAME", "SECTION"].includes(root.type))
        throw new BridgeError("INVALID_SCOPE_ROOT");
      inScope(root, root);
      return { rootId: root.id, fingerprint: snapshot(root).fingerprint };
    }
    if (method === "operation_status")
      return (
        this.receipts.get(String(input.operationId))?.result ?? {
          operationId: input.operationId,
          status: "unknown",
        }
      );
    if (method === "read_nodes") {
      const args = parse(tools.read_nodes.schema, input);
      let count = 0,
        bytes = 0;
      const output: unknown[] = [];
      const pending: string[] = [];
      const walk = async (node: BaseNode, depth: number): Promise<unknown> => {
        if (count >= args.maxNodes) {
          pending.push(node.id);
          return { id: node.id, truncated: true };
        }
        const base = snapshot(node);
        const rich =
          node.type !== "DOCUMENT" && node.type !== "PAGE"
            ? await serializeBridgeNode(node as SceneNode)
            : undefined;
        const state = {
            ...base,
            ...(rich
              ? {
                  design: rich.data,
                  resourceIds: {
                    variables: rich.variableIds,
                    styles: rich.styleIds,
                  },
                }
              : {}),
          },
          length = JSON.stringify(state).length * 3;
        if (bytes + length > MAX_RESULT - 8192) {
          pending.push(node.id);
          return { id: node.id, truncated: true };
        }
        bytes += length;
        count++;
        const descendants: unknown[] = [];
        if (depth === 0) pending.push(...state.children);
        if (depth > 0 && "children" in node)
          for (const child of node.children) {
            if (count >= args.maxNodes || bytes > MAX_RESULT - 8192) {
              pending.push(child.id);
              continue;
            }
            descendants.push(await walk(child, depth - 1));
          }
        if (snapshot(node).fingerprint !== base.fingerprint)
          throw new BridgeError("READ_CHANGED_RETRY");
        return {
          ...state,
          nodes: descendants,
          childrenTruncated: state.children.length > descendants.length,
        };
      };
      for (const id of args.nodeIds)
        output.push(await walk(await lookup(this.api, id), args.depth));
      return {
        schema: "figma-bridge.nodes",
        version: 1,
        nodes: output,
        nodeCount: count,
        complete: pending.length === 0,
        pendingNodeIds: pending.slice(0, 500),
        pendingTruncated: pending.length > 500,
      };
    }
    if (method === "apply") return this.apply(input);
    throw new BridgeError("UNSUPPORTED_COMMAND");
  }
  private async fonts(node: BaseNode, font?: FontName) {
    if (node.type !== "TEXT") return;
    const fonts = font
      ? [font]
      : node.characters.length
        ? node.getRangeAllFontNames(0, node.characters.length)
        : node.fontName === this.api.mixed
          ? []
          : [node.fontName];
    if (fonts.length === 0) throw new BridgeError("FONT_REQUIRED");
    for (const f of fonts) await this.api.loadFontAsync(f);
  }
  private async apply(input: Record<string, unknown>) {
    const { rootId, ...payload } = input;
    const args = parse(tools.apply.schema, payload);
    const hash = fingerprint(input);
    const cached = this.receipts.get(args.operationId);
    if (cached) {
      if (cached.hash !== hash) throw new BridgeError("OPERATION_ID_REUSED");
      return cached.result;
    }
    if (this.receipts.size >= MAX_OPERATIONS)
      throw new BridgeError("SESSION_OPERATION_LIMIT");
    const result: Receipt = {
      operationId: args.operationId,
      status: "rejected_before_write",
      steps: [],
      created: {},
    };
    if (!args.dryRun) this.receipts.set(args.operationId, { hash, result });
    let started = false;
    try {
      const root = await lookup(this.api, String(rootId));
      inScope(root, root);
      const baselines = new Map<string, string>();
      const creations = new Map<string, Operation>();
      for (const op of args.operations) {
        const id = op.type === "create" ? op.parentId : op.nodeId;
        if (id.startsWith("$")) {
          const creator = creations.get(id.slice(1));
          if (!creator || creator.type !== "create")
            throw new BridgeError("INVALID_LOCAL_REFERENCE");
          if (op.expectedFingerprint !== "created")
            throw new BridgeError("LOCAL_REFERENCE_FINGERPRINT");
          if (op.type === "create" && creator.kind !== "FRAME")
            throw new BridgeError("INVALID_PARENT");
          if (
            op.type !== "create" &&
            op.type !== "update" &&
            op.type !== "set_text"
          )
            throw new BridgeError("LOCAL_REFERENCE_UNSUPPORTED");
          if (op.type === "set_text" && creator.kind !== "TEXT")
            throw new BridgeError("NOT_TEXT");
        } else {
          const node = await lookup(this.api, id);
          inScope(node, root);
          const fp = snapshot(node).fingerprint;
          if (fp !== op.expectedFingerprint)
            throw new BridgeError("STALE_FINGERPRINT");
          baselines.set(id, fp);
          if (
            op.type === "create" &&
            !["PAGE", "FRAME", "SECTION"].includes(node.type)
          )
            throw new BridgeError("INVALID_PARENT");
          if (op.type === "update") {
            checkPatch(node, op.patch);
            if (node.type === "TEXT") await this.fonts(node);
          }
          if (op.type === "set_text") {
            if (node.type !== "TEXT") throw new BridgeError("NOT_TEXT");
            await this.fonts(node, op.font);
          }
        }
        if (op.type === "create") {
          if (op.patch) {
            if (op.patch.width !== undefined && op.patch.width <= 0)
              throw new BridgeError("INVALID_WIDTH");
            if (op.patch.height !== undefined && op.patch.height <= 0)
              throw new BridgeError("INVALID_HEIGHT");
            if (op.kind !== "TEXT" && op.patch.fontSize !== undefined)
              throw new BridgeError("NOT_TEXT");
            if (
              (op.kind === "TEXT" || op.kind === "RECTANGLE") &&
              [
                "layoutMode",
                "paddingTop",
                "paddingBottom",
                "paddingLeft",
                "paddingRight",
                "itemSpacing",
                "clipsContent",
              ].some((k) => k in op.patch!)
            )
              throw new BridgeError("UNSUPPORTED_LAYOUT_PROPERTY");
          }
          if (creations.has(op.key))
            throw new BridgeError("DUPLICATE_CREATE_KEY");
          creations.set(op.key, op);
          if (op.kind === "INSTANCE") {
            const component = op.componentId
              ? await lookup(this.api, op.componentId)
              : null;
            if (
              !component ||
              component.type !== "COMPONENT" ||
              component.remote
            )
              throw new BridgeError("LOCAL_COMPONENT_REQUIRED");
          }
          if (op.kind === "TEXT") {
            if (!op.font) throw new BridgeError("FONT_REQUIRED");
            await this.api.loadFontAsync(op.font);
          } else if (op.characters !== undefined || op.font !== undefined)
            throw new BridgeError("TEXT_PROPERTIES_REQUIRE_TEXT");
        }
      }
      for (const op of args.operations) {
        if (isPrototypeOperation(op))
          await checkPrototypeOperation(
            this.api,
            await lookup(this.api, op.nodeId),
            op,
            root
          );
        if (op.type === "move") {
          const node = await lookup(this.api, op.nodeId),
            parent = await lookup(this.api, op.parentId);
          inScope(parent, root);
          if (!["PAGE", "FRAME", "SECTION"].includes(parent.type))
            throw new BridgeError("INVALID_PARENT");
          let at: BaseNode | null = parent;
          while (at) {
            if (at.id === node.id) throw new BridgeError("CYCLIC_MOVE");
            at = at.parent;
          }
          if (snapshot(parent).fingerprint !== op.parentFingerprint)
            throw new BridgeError("STALE_PARENT");
          baselines.set(parent.id, op.parentFingerprint);
        }
        if (op.type === "instance_properties") {
          const n = await lookup(this.api, op.nodeId);
          if (n.type !== "INSTANCE") throw new BridgeError("NOT_INSTANCE");
          const queue: SceneNode[] = [n];
          let checked = 0;
          while (queue.length) {
            if (++checked > 500) throw new BridgeError("INSTANCE_TOO_LARGE");
            const child = queue.pop()!;
            if (child.type === "TEXT") await this.fonts(child);
            if ("children" in child) queue.push(...child.children);
          }
          for (const key of Object.keys(op.properties))
            if (
              !Object.prototype.hasOwnProperty.call(n.componentProperties, key)
            )
              throw new BridgeError("UNKNOWN_INSTANCE_PROPERTY");
        }
        if (op.type === "bind_variable") {
          const target = await lookup(this.api, op.nodeId);
          if (target.type === "TEXT") await this.fonts(target);
          const variable = await this.api.variables.getVariableByIdAsync(
            op.variableId
          );
          if (!variable || variable.remote)
            throw new BridgeError("LOCAL_VARIABLE_REQUIRED");
          if (
            variable.resolvedType !== (op.field === "fills" ? "COLOR" : "FLOAT")
          )
            throw new BridgeError("VARIABLE_TYPE_MISMATCH");
        }
      }
      if (args.dryRun) return { ...result, status: "preflight" };
      if (this.cancelled.has(args.operationId))
        throw new BridgeError("CANCELLED");
      this.api.commitUndo();
      for (const [index, op] of args.operations.entries()) {
        if (this.cancelled.has(args.operationId))
          throw new BridgeError("CANCELLED");
        const id = op.type === "create" ? op.parentId : op.nodeId;
        const node = await lookup(
          this.api,
          id.startsWith("$") ? result.created[id.slice(1)]! : id
        );
        inScope(node, root);
        if (
          !id.startsWith("$") &&
          snapshot(node).fingerprint !== baselines.get(id)
        )
          throw new BridgeError("STALE_FINGERPRINT");
        if (isPrototypeOperation(op)) {
          await checkPrototypeOperation(this.api, node, op, root);
          if (snapshot(node).fingerprint !== baselines.get(id))
            throw new BridgeError("STALE_FINGERPRINT");
        }
        let changed = node;
        started = true;
        if (op.type === "create") {
          const created =
            op.kind === "FRAME"
              ? this.api.createFrame()
              : op.kind === "TEXT"
                ? this.api.createText()
                : op.kind === "INSTANCE"
                  ? (
                      (await lookup(this.api, op.componentId!)) as ComponentNode
                    ).createInstance()
                  : this.api.createRectangle();
          result.created[op.key] = created.id;
          changed = created;
          if (!("appendChild" in node)) throw new BridgeError("INVALID_PARENT");
          (node as PageNode | FrameNode | SectionNode).appendChild(created);
          if (created.type === "TEXT") {
            created.fontName = op.font!;
            created.characters = op.characters ?? "";
          }
          patchNode(created, op.patch ?? {});
        } else if (op.type === "move") {
          const parent = await lookup(this.api, op.parentId);
          inScope(parent, root);
          if (snapshot(parent).fingerprint !== baselines.get(parent.id))
            throw new BridgeError("STALE_PARENT");
          (parent as FrameNode).insertChild(op.index, node as SceneNode);
          baselines.set(parent.id, snapshot(parent).fingerprint);
        } else if (op.type === "instance_properties") {
          (node as InstanceNode).setProperties(op.properties);
        } else if (op.type === "bind_variable") {
          const variable = await this.api.variables.getVariableByIdAsync(
            op.variableId
          );
          if (!variable) throw new BridgeError("VARIABLE_NOT_FOUND");
          if (op.field === "fills") {
            const target = node as GeometryMixin;
            if (
              !Array.isArray(target.fills) ||
              target.fills.length !== 1 ||
              target.fills[0].type !== "SOLID"
            )
              throw new BridgeError("SINGLE_SOLID_FILL_REQUIRED");
            target.fills = [
              this.api.variables.setBoundVariableForPaint(
                target.fills[0],
                "color",
                variable
              ),
            ];
          } else
            (node as SceneNode).setBoundVariable(
              op.field as VariableBindableNodeField,
              variable
            );
        } else if (op.type === "set_text") {
          if (node.type !== "TEXT") throw new BridgeError("NOT_TEXT");
          if (op.font) node.fontName = op.font;
          node.characters = op.characters;
        } else if (isPrototypeOperation(op))
          await writePrototypeOperation(node, op);
        else patchNode(node, op.patch);
        result.steps.push({ index, nodeId: changed.id });
        baselines.set(id, snapshot(node).fingerprint);
      }
      result.status = "complete";
    } catch (error) {
      result.status = started ? "partial" : "rejected_before_write";
      result.error =
        error instanceof BridgeError ? error.code : "FIGMA_OPERATION_FAILED";
    } finally {
      if (started) this.api.commitUndo();
    }
    return result;
  }
}
