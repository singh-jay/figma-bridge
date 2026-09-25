// src/protocol/index.ts
import { hmac } from "@noble/hashes/hmac.js";
import { sha256 } from "@noble/hashes/sha2.js";
import * as v from "valibot";
var VERSION = 1;
var PORT = 3846;
var MAX_MESSAGE = 512 * 1024;
var MAX_RESULT = 256 * 1024;
var MAX_OPERATIONS = 500;
var id = v.pipe(v.string(), v.minLength(1), v.maxLength(200));
var finite2 = v.pipe(v.number(), v.finite());
var size = v.pipe(finite2, v.minValue(0), v.maxValue(1e5));
var text = v.pipe(v.string(), v.maxLength(16384));
var fontSchema = v.strictObject({ family: id, style: id });
var color = v.strictObject({
  r: v.pipe(finite2, v.minValue(0), v.maxValue(1)),
  g: v.pipe(finite2, v.minValue(0), v.maxValue(1)),
  b: v.pipe(finite2, v.minValue(0), v.maxValue(1))
});
var patchSchema = v.strictObject({
  name: v.optional(v.pipe(v.string(), v.maxLength(512))),
  x: v.optional(finite2),
  y: v.optional(finite2),
  width: v.optional(size),
  height: v.optional(size),
  visible: v.optional(v.boolean()),
  opacity: v.optional(v.pipe(finite2, v.minValue(0), v.maxValue(1))),
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
          opacity: v.optional(v.pipe(finite2, v.minValue(0), v.maxValue(1)))
        })
      ),
      v.maxLength(8)
    )
  )
});
var guarded = { nodeId: id, expectedFingerprint: id };
var operationSchema = v.variant("type", [
  v.strictObject({
    type: v.literal("create"),
    key: v.pipe(v.string(), v.regex(/^[A-Za-z][A-Za-z0-9_-]{0,63}$/)),
    parentId: id,
    expectedFingerprint: id,
    kind: v.picklist(["FRAME", "TEXT", "RECTANGLE", "INSTANCE"]),
    componentId: v.optional(id),
    patch: v.optional(patchSchema),
    characters: v.optional(text),
    font: v.optional(fontSchema)
  }),
  v.strictObject({ type: v.literal("update"), ...guarded, patch: patchSchema }),
  v.strictObject({
    type: v.literal("instance_properties"),
    ...guarded,
    properties: v.record(id, v.union([v.string(), v.boolean()]))
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
      "fills"
    ]),
    variableId: id
  }),
  v.strictObject({
    type: v.literal("move"),
    ...guarded,
    parentId: id,
    parentFingerprint: id,
    index: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(1e4))
  }),
  v.strictObject({
    type: v.literal("set_text"),
    ...guarded,
    characters: text,
    font: v.optional(fontSchema)
  })
]);
var tools = {
  sessions: {
    description: "List connected local Figma plugin sessions. Always target an explicit session; file names and foreground tabs are not routing authority.",
    schema: v.strictObject({}),
    readOnly: true
  },
  selection: {
    description: "Read the current page and selected node IDs in an explicit plugin session.",
    schema: v.strictObject({ sessionId: id }),
    readOnly: true
  },
  read_nodes: {
    description: "Read bounded design data and mutation fingerprints for explicit nodes. Follow omitted child IDs with another scoped read. Never assume an incomplete response is a complete design.",
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
      )
    }),
    readOnly: true
  },
  read_text: {
    description: "Read a bounded text range and styled runs. Continue with nextOffset; expectedTextHash rejects a changed text snapshot.",
    schema: v.strictObject({
      sessionId: id,
      nodeId: id,
      offset: v.optional(v.pipe(v.number(), v.integer(), v.minValue(0)), 0),
      length: v.optional(
        v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(8192)),
        4096
      ),
      expectedTextHash: v.optional(id)
    }),
    readOnly: true
  },
  read_resources: {
    description: "Resolve explicit local variable/collection/style/component IDs; aliases are preserved with bounded continuation IDs. Remote resources are unavailable.",
    schema: v.strictObject({
      sessionId: id,
      variableIds: v.optional(v.pipe(v.array(id), v.maxLength(50)), []),
      styleIds: v.optional(v.pipe(v.array(id), v.maxLength(50)), []),
      componentIds: v.optional(v.pipe(v.array(id), v.maxLength(20)), [])
    }),
    readOnly: true
  },
  export: {
    description: "Export an explicit node as PNG/SVG, or original image bytes by imageHash. Saves a bounded artifact locally; no remote URLs.",
    schema: v.strictObject({
      sessionId: id,
      nodeId: id,
      format: v.picklist(["PNG", "SVG", "IMAGE"]),
      imageHash: v.optional(id),
      scale: v.optional(v.pipe(v.number(), v.minValue(0.1), v.maxValue(4)), 1)
    }),
    readOnly: true
  },
  design_context: {
    description: "Read a scoped design subtree. The project MCP adapter adds configured framework and source references for an optional target. Resolve resource IDs and export a preview separately.",
    schema: v.strictObject({
      sessionId: id,
      nodeId: id,
      target: v.optional(id)
    }),
    readOnly: true
  },
  write_scope: {
    description: "Acquire or release the sole writer lease for an explicit page/frame. Use the returned generation and leaseId for apply. A lease does not lock out human editors.",
    schema: v.strictObject({
      sessionId: id,
      rootId: id,
      action: v.picklist(["acquire", "release"])
    }),
    readOnly: false
  },
  apply: {
    description: "Preflight or apply supported operations inside a leased root. Use fresh fingerprints from read_nodes. Results can be partial or unknown; never blindly replay a lost write. Reuse operationId only with the identical payload.",
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
      )
    }),
    readOnly: false
  },
  cancel_operation: {
    description: "Request cancellation at the next safe operation boundary. Inspect operation_status afterward; native calls may finish first.",
    schema: v.strictObject({ sessionId: id, operationId: id }),
    readOnly: false
  },
  operation_status: {
    description: "Read a write receipt without replaying the write. Unknown means inspect the canvas before any new operation.",
    schema: v.strictObject({ sessionId: id, operationId: id }),
    readOnly: true
  }
};
var commandSchema = v.strictObject({
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
    "read_text"
  ]),
  params: v.record(v.string(), v.unknown())
});
var replySchema = v.strictObject({
  type: v.literal("result"),
  version: v.literal(VERSION),
  requestId: id,
  ok: v.boolean(),
  result: v.optional(v.unknown()),
  error: v.optional(v.string())
});
var helloSchema = v.strictObject({
  type: v.literal("hello"),
  version: v.literal(VERSION),
  token: v.pipe(v.string(), v.length(64)),
  nonce: id,
  documentName: v.pipe(v.string(), v.maxLength(512))
});
function canonical(value) {
  if (value === void 0) return "null";
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object")
    return `{${Object.entries(value).filter(([, val]) => val !== void 0).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, val]) => `${JSON.stringify(key)}:${canonical(val)}`).join(",")}}`;
  return JSON.stringify(value);
}
function utf8(value) {
  const bytes = [];
  for (const char of value) {
    let n = char.codePointAt(0);
    if (n >= 55296 && n <= 57343) n = 65533;
    if (n < 128) bytes.push(n);
    else if (n < 2048) bytes.push(192 | n >> 6, 128 | n & 63);
    else if (n < 65536)
      bytes.push(224 | n >> 12, 128 | n >> 6 & 63, 128 | n & 63);
    else
      bytes.push(
        240 | n >> 18,
        128 | n >> 12 & 63,
        128 | n >> 6 & 63,
        128 | n & 63
      );
  }
  return new Uint8Array(bytes);
}
var fingerprint = (value) => Array.from(
  sha256(utf8(canonical(value))),
  (b) => b.toString(16).padStart(2, "0")
).join("");
var BridgeError = class extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
};
var parse = (schema, input) => {
  const r = v.safeParse(schema, input);
  if (!r.success) throw new BridgeError("INVALID_ARGUMENTS");
  return r.output;
};
var proof = (secret, nonce) => Array.from(
  hmac(sha256, utf8(secret), utf8(nonce)),
  (b) => b.toString(16).padStart(2, "0")
).join("");
var bytesHash = (bytes) => Array.from(sha256(bytes), (b) => b.toString(16).padStart(2, "0")).join("");
export {
  BridgeError,
  MAX_MESSAGE,
  MAX_OPERATIONS,
  MAX_RESULT,
  PORT,
  VERSION,
  bytesHash,
  canonical,
  commandSchema,
  fingerprint,
  fontSchema,
  helloSchema,
  id,
  operationSchema,
  parse,
  patchSchema,
  proof,
  replySchema,
  tools,
  utf8
};
