import { hmac } from "@noble/hashes/hmac.js";
import { sha256 } from "@noble/hashes/sha2.js";
import * as v from "valibot";

export const VERSION = 1;
export const PORT = 3846;
export const MAX_MESSAGE = 512 * 1024;
export const MAX_RESULT = 256 * 1024;
export const MAX_OPERATIONS = 500;
export const id = v.pipe(v.string(), v.minLength(1), v.maxLength(200));
const finite = v.pipe(v.number(), v.finite());
const size = v.pipe(finite, v.minValue(0), v.maxValue(100_000));
const text = v.pipe(v.string(), v.maxLength(16_384));
export const fontSchema = v.strictObject({ family: id, style: id });
const color = v.strictObject({
  r: v.pipe(finite, v.minValue(0), v.maxValue(1)),
  g: v.pipe(finite, v.minValue(0), v.maxValue(1)),
  b: v.pipe(finite, v.minValue(0), v.maxValue(1)),
});
export const patchSchema = v.strictObject({
  name: v.optional(v.pipe(v.string(), v.maxLength(512))),
  x: v.optional(finite),
  y: v.optional(finite),
  width: v.optional(size),
  height: v.optional(size),
  visible: v.optional(v.boolean()),
  opacity: v.optional(v.pipe(finite, v.minValue(0), v.maxValue(1))),
  cornerRadius: v.optional(size),
  clipsContent: v.optional(v.boolean()),
  layoutMode: v.optional(v.picklist(["NONE", "HORIZONTAL", "VERTICAL"])),
  layoutSizingHorizontal: v.optional(v.picklist(["FIXED", "HUG", "FILL"])),
  layoutSizingVertical: v.optional(v.picklist(["FIXED", "HUG", "FILL"])),
  primaryAxisAlignItems: v.optional(
    v.picklist(["MIN", "MAX", "CENTER", "SPACE_BETWEEN"])
  ),
  counterAxisAlignItems: v.optional(
    v.picklist(["MIN", "MAX", "CENTER", "BASELINE"])
  ),
  paddingTop: v.optional(size),
  paddingBottom: v.optional(size),
  paddingLeft: v.optional(size),
  paddingRight: v.optional(size),
  itemSpacing: v.optional(size),
  fontSize: v.optional(v.pipe(size, v.minValue(1))),
  fills: v.optional(
    v.pipe(
      v.array(
        v.strictObject({
          type: v.literal("SOLID"),
          color,
          opacity: v.optional(v.pipe(finite, v.minValue(0), v.maxValue(1))),
        })
      ),
      v.maxLength(8)
    )
  ),
});
const guarded = { nodeId: id, expectedFingerprint: id };
export const operationSchema = v.variant("type", [
  v.strictObject({
    type: v.literal("create"),
    key: v.pipe(v.string(), v.regex(/^[A-Za-z][A-Za-z0-9_-]{0,63}$/)),
    parentId: id,
    expectedFingerprint: id,
    kind: v.picklist(["FRAME", "TEXT", "RECTANGLE", "INSTANCE"]),
    componentId: v.optional(id),
    patch: v.optional(patchSchema),
    characters: v.optional(text),
    font: v.optional(fontSchema),
  }),
  v.strictObject({ type: v.literal("update"), ...guarded, patch: patchSchema }),
  v.strictObject({
    type: v.literal("instance_properties"),
    ...guarded,
    properties: v.record(id, v.union([v.string(), v.boolean()])),
  }),
  v.strictObject({
    type: v.literal("bind_variable"),
    ...guarded,
    field: v.picklist([
      "width",
      "height",
      "itemSpacing",
      "paddingTop",
      "paddingBottom",
      "paddingLeft",
      "paddingRight",
      "opacity",
      "cornerRadius",
      "fontSize",
      "fills",
    ]),
    variableId: id,
  }),
  v.strictObject({
    type: v.literal("move"),
    ...guarded,
    parentId: id,
    parentFingerprint: id,
    index: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(10000)),
  }),
  v.strictObject({
    type: v.literal("set_text"),
    ...guarded,
    characters: text,
    font: v.optional(fontSchema),
  }),
]);
export type Operation = v.InferOutput<typeof operationSchema>;
export const tools = {
  sessions: {
    description:
      "List connected local Figma plugin sessions. Always target an explicit session; file names and foreground tabs are not routing authority.",
    schema: v.strictObject({}),
    readOnly: true,
  },
  selection: {
    description:
      "Read the current page and selected node IDs in an explicit plugin session.",
    schema: v.strictObject({ sessionId: id }),
    readOnly: true,
  },
  read_nodes: {
    description:
      "Read bounded design data and mutation fingerprints for explicit nodes. Follow omitted child IDs with another scoped read. Never assume an incomplete response is a complete design.",
    schema: v.strictObject({
      sessionId: id,
      nodeIds: v.pipe(v.array(id), v.minLength(1), v.maxLength(24)),
      depth: v.optional(
        v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(8)),
        2
      ),
      maxNodes: v.optional(
        v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(500)),
        100
      ),
    }),
    readOnly: true,
  },
  read_text: {
    description:
      "Read a bounded text range and styled runs. Continue with nextOffset; expectedTextHash rejects a changed text snapshot.",
    schema: v.strictObject({
      sessionId: id,
      nodeId: id,
      offset: v.optional(v.pipe(v.number(), v.integer(), v.minValue(0)), 0),
      length: v.optional(
        v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(8192)),
        4096
      ),
      expectedTextHash: v.optional(id),
    }),
    readOnly: true,
  },
  read_resources: {
    description:
      "Resolve explicit local variable/collection/style/component IDs; aliases are preserved with bounded continuation IDs. Remote resources are unavailable.",
    schema: v.strictObject({
      sessionId: id,
      variableIds: v.optional(v.pipe(v.array(id), v.maxLength(50)), []),
      styleIds: v.optional(v.pipe(v.array(id), v.maxLength(50)), []),
      componentIds: v.optional(v.pipe(v.array(id), v.maxLength(20)), []),
    }),
    readOnly: true,
  },
  export: {
    description:
      "Export an explicit node as PNG/SVG, or original image bytes by imageHash. Saves a bounded artifact locally; no remote URLs.",
    schema: v.strictObject({
      sessionId: id,
      nodeId: id,
      format: v.picklist(["PNG", "SVG", "IMAGE"]),
      imageHash: v.optional(id),
      scale: v.optional(v.pipe(v.number(), v.minValue(0.1), v.maxValue(4)), 1),
    }),
    readOnly: true,
  },
  design_context: {
    description:
      "Read a scoped design subtree. The project MCP adapter adds configured framework and source references for an optional target. Resolve resource IDs and export a preview separately.",
    schema: v.strictObject({
      sessionId: id,
      nodeId: id,
      target: v.optional(id),
    }),
    readOnly: true,
  },
  write_scope: {
    description:
      "Acquire or release the sole writer lease for an explicit page/frame. Use the returned generation and leaseId for apply. A lease does not lock out human editors.",
    schema: v.strictObject({
      sessionId: id,
      rootId: id,
      action: v.picklist(["acquire", "release"]),
    }),
    readOnly: false,
  },
  apply: {
    description:
      "Preflight or apply supported operations inside a leased root. Use fresh fingerprints from read_nodes. Results can be partial or unknown; never blindly replay a lost write. Reuse operationId only with the identical payload.",
    schema: v.strictObject({
      sessionId: id,
      generation: id,
      leaseId: id,
      operationId: v.pipe(v.string(), v.uuid()),
      dryRun: v.optional(v.boolean(), false),
      operations: v.pipe(
        v.array(operationSchema),
        v.minLength(1),
        v.maxLength(50)
      ),
    }),
    readOnly: false,
  },
  cancel_operation: {
    description:
      "Request cancellation at the next safe operation boundary. Inspect operation_status afterward; native calls may finish first.",
    schema: v.strictObject({ sessionId: id, operationId: id }),
    readOnly: false,
  },
  operation_status: {
    description:
      "Read a write receipt without replaying the write. Unknown means inspect the canvas before any new operation.",
    schema: v.strictObject({ sessionId: id, operationId: id }),
    readOnly: true,
  },
} as const;
export type ToolName = keyof typeof tools;
export const commandSchema = v.strictObject({
  type: v.literal("command"),
  version: v.literal(VERSION),
  requestId: id,
  method: v.picklist([
    "selection",
    "read_nodes",
    "scope",
    "apply",
    "operation_status",
    "read_resources",
    "export_begin",
    "export_chunk",
    "export_release",
    "cancel_operation",
    "read_text",
  ]),
  params: v.record(v.string(), v.unknown()),
});
export type Command = v.InferOutput<typeof commandSchema>;
export const replySchema = v.strictObject({
  type: v.literal("result"),
  version: v.literal(VERSION),
  requestId: id,
  ok: v.boolean(),
  result: v.optional(v.unknown()),
  error: v.optional(v.string()),
});
export const helloSchema = v.strictObject({
  type: v.literal("hello"),
  version: v.literal(VERSION),
  token: v.pipe(v.string(), v.length(64)),
  nonce: id,
  documentName: v.pipe(v.string(), v.maxLength(512)),
});
export function canonical(value: unknown): string {
  if (value === undefined) return "null";
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object")
    return `{${Object.entries(value)
      .filter(([, val]) => val !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([key, val]) => `${JSON.stringify(key)}:${canonical(val)}`)
      .join(",")}}`;
  return JSON.stringify(value);
}
// The Figma sandbox does not provide TextEncoder. Encode Unicode without browser globals.
export function utf8(value: string): Uint8Array {
  const bytes: number[] = [];
  for (const char of value) {
    let n = char.codePointAt(0)!;
    if (n >= 0xd800 && n <= 0xdfff) n = 0xfffd;
    if (n < 128) bytes.push(n);
    else if (n < 2048) bytes.push(192 | (n >> 6), 128 | (n & 63));
    else if (n < 65536)
      bytes.push(224 | (n >> 12), 128 | ((n >> 6) & 63), 128 | (n & 63));
    else
      bytes.push(
        240 | (n >> 18),
        128 | ((n >> 12) & 63),
        128 | ((n >> 6) & 63),
        128 | (n & 63)
      );
  }
  return new Uint8Array(bytes);
}
export const fingerprint = (value: unknown) =>
  Array.from(sha256(utf8(canonical(value))), (b) =>
    b.toString(16).padStart(2, "0")
  ).join("");
export class BridgeError extends Error {
  constructor(public readonly code: string) {
    super(code);
  }
}
export const parse = <
  T extends v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>,
>(
  schema: T,
  input: unknown
): v.InferOutput<T> => {
  const r = v.safeParse(schema, input);
  if (!r.success) throw new BridgeError("INVALID_ARGUMENTS");
  return r.output;
};

export const proof = (secret: string, nonce: string) =>
  Array.from(hmac(sha256, utf8(secret), utf8(nonce)), (b) =>
    b.toString(16).padStart(2, "0")
  ).join("");

export const bytesHash = (bytes: Uint8Array) =>
  Array.from(sha256(bytes), (b) => b.toString(16).padStart(2, "0")).join("");
