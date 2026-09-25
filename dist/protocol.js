// src/protocol/index.ts
import { hmac } from "@noble/hashes/hmac.js";
import { sha256 } from "@noble/hashes/sha2.js";
import * as v2 from "valibot";

// src/protocol/prototype.ts
import * as v from "valibot";
var id = v.pipe(v.string(), v.minLength(1), v.maxLength(200));
var realId = v.pipe(id, v.regex(/^[^$]/, "Use confirmed node IDs"));
var index = v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(999));
var guarded = { nodeId: realId, expectedFingerprint: id };
var transition = v.nullable(
  v.strictObject({
    type: v.literal("DISSOLVE"),
    duration: v.pipe(v.number(), v.finite(), v.minValue(0), v.maxValue(10)),
    easing: v.strictObject({
      type: v.picklist(["LINEAR", "EASE_IN", "EASE_OUT", "EASE_IN_AND_OUT"])
    })
  })
);
var prototypeActionSchema = v.variant("type", [
  v.strictObject({ type: v.literal("BACK") }),
  v.strictObject({ type: v.literal("CLOSE") }),
  v.strictObject({
    type: v.literal("NODE"),
    destinationId: realId,
    navigation: v.picklist(["NAVIGATE", "OVERLAY"]),
    transition,
    resetScrollPosition: v.optional(v.boolean(), true),
    resetVideoPosition: v.optional(v.boolean(), false)
  })
]);
var reactionSchema = v.strictObject({
  trigger: v.strictObject({ type: v.literal("ON_CLICK") }),
  actions: v.pipe(v.array(prototypeActionSchema), v.length(1))
});
var prototypeOperations = [
  v.strictObject({
    type: v.literal("upsert_reaction"),
    ...guarded,
    index: v.optional(index),
    reaction: reactionSchema
  }),
  v.strictObject({ type: v.literal("remove_reaction"), ...guarded, index }),
  v.strictObject({
    type: v.literal("upsert_flow_start"),
    ...guarded,
    startNodeId: realId,
    name: v.pipe(v.string(), v.minLength(1), v.maxLength(200))
  }),
  v.strictObject({
    type: v.literal("remove_flow_start"),
    ...guarded,
    startNodeId: realId
  }),
  v.strictObject({
    type: v.literal("update_prototype_settings"),
    ...guarded,
    patch: v.strictObject({
      overflowDirection: v.picklist(["NONE", "HORIZONTAL", "VERTICAL", "BOTH"])
    })
  })
];
var prototypeOperationSchema = v.variant("type", prototypeOperations);
var scenarioSchema = v.strictObject({
  startNodeId: realId,
  expectedScreenIds: v.optional(v.pipe(v.array(realId), v.maxLength(100)), []),
  requireExitNodeIds: v.optional(v.pipe(v.array(realId), v.maxLength(100)), [])
});
var prototypeReadEntries = {
  scenario: v.optional(scenarioSchema),
  sessionId: id,
  pageId: realId,
  nodeIds: v.pipe(v.array(realId), v.minLength(1), v.maxLength(24)),
  traverseDestinations: v.optional(v.boolean(), false),
  maxNodes: v.optional(
    v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(500)),
    100
  ),
  maxEdges: v.optional(
    v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(1e3)),
    200
  )
};
var prototypeReadSchema = v.strictObject(prototypeReadEntries);
var prototypePlaybackSchema = v.strictObject({
  ...prototypeReadEntries,
  startNodeId: realId,
  // A supplied URL is a routing hint, never proof of document identity.
  prototypeUrl: v.optional(
    v.pipe(
      v.string(),
      v.maxLength(2048),
      v.regex(
        /^https:\/\/(?:www\.)?figma\.com\/proto\/[A-Za-z0-9]+(?:\/[^\s?#]*)?(?:\?[^\s#]*)?(?:#[^\s]*)?$/
      )
    )
  )
});
var PROTOTYPE_OPERATIONS = prototypeOperations.map(
  (schema) => schema.entries.type.literal
);

// src/protocol/index.ts
var VERSION = 2;
var PACKAGE_VERSION = "0.2.0";
var PORT = 3846;
var MAX_MESSAGE = 512 * 1024;
var MAX_RESULT = 256 * 1024;
var MAX_OPERATIONS = 500;
var id2 = v2.pipe(v2.string(), v2.minLength(1), v2.maxLength(200));
var finite3 = v2.pipe(v2.number(), v2.finite());
var size = v2.pipe(finite3, v2.minValue(0), v2.maxValue(1e5));
var text = v2.pipe(v2.string(), v2.maxLength(16384));
var fontSchema = v2.strictObject({ family: id2, style: id2 });
var color = v2.strictObject({
  r: v2.pipe(finite3, v2.minValue(0), v2.maxValue(1)),
  g: v2.pipe(finite3, v2.minValue(0), v2.maxValue(1)),
  b: v2.pipe(finite3, v2.minValue(0), v2.maxValue(1))
});
var patchSchema = v2.strictObject({
  name: v2.optional(v2.pipe(v2.string(), v2.maxLength(512))),
  x: v2.optional(finite3),
  y: v2.optional(finite3),
  width: v2.optional(size),
  height: v2.optional(size),
  visible: v2.optional(v2.boolean()),
  opacity: v2.optional(v2.pipe(finite3, v2.minValue(0), v2.maxValue(1))),
  cornerRadius: v2.optional(size),
  clipsContent: v2.optional(v2.boolean()),
  layoutMode: v2.optional(v2.picklist(["NONE", "HORIZONTAL", "VERTICAL"])),
  layoutSizingHorizontal: v2.optional(v2.picklist(["FIXED", "HUG", "FILL"])),
  layoutSizingVertical: v2.optional(v2.picklist(["FIXED", "HUG", "FILL"])),
  primaryAxisAlignItems: v2.optional(
    v2.picklist(["MIN", "MAX", "CENTER", "SPACE_BETWEEN"])
  ),
  counterAxisAlignItems: v2.optional(
    v2.picklist(["MIN", "MAX", "CENTER", "BASELINE"])
  ),
  paddingTop: v2.optional(size),
  paddingBottom: v2.optional(size),
  paddingLeft: v2.optional(size),
  paddingRight: v2.optional(size),
  itemSpacing: v2.optional(size),
  fontSize: v2.optional(v2.pipe(size, v2.minValue(1))),
  fills: v2.optional(
    v2.pipe(
      v2.array(
        v2.strictObject({
          type: v2.literal("SOLID"),
          color,
          opacity: v2.optional(v2.pipe(finite3, v2.minValue(0), v2.maxValue(1)))
        })
      ),
      v2.maxLength(8)
    )
  )
});
var guarded2 = { nodeId: id2, expectedFingerprint: id2 };
var operationSchema = v2.variant("type", [
  ...prototypeOperations,
  v2.strictObject({
    type: v2.literal("create"),
    key: v2.pipe(v2.string(), v2.regex(/^[A-Za-z][A-Za-z0-9_-]{0,63}$/)),
    parentId: id2,
    expectedFingerprint: id2,
    kind: v2.picklist(["FRAME", "TEXT", "RECTANGLE", "INSTANCE"]),
    componentId: v2.optional(id2),
    patch: v2.optional(patchSchema),
    characters: v2.optional(text),
    font: v2.optional(fontSchema)
  }),
  v2.strictObject({ type: v2.literal("update"), ...guarded2, patch: patchSchema }),
  v2.strictObject({
    type: v2.literal("instance_properties"),
    ...guarded2,
    properties: v2.record(id2, v2.union([v2.string(), v2.boolean()]))
  }),
  v2.strictObject({
    type: v2.literal("bind_variable"),
    ...guarded2,
    field: v2.picklist([
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
    variableId: id2
  }),
  v2.strictObject({
    type: v2.literal("move"),
    ...guarded2,
    parentId: id2,
    parentFingerprint: id2,
    index: v2.pipe(v2.number(), v2.integer(), v2.minValue(0), v2.maxValue(1e4))
  }),
  v2.strictObject({
    type: v2.literal("set_text"),
    ...guarded2,
    characters: text,
    font: v2.optional(fontSchema)
  })
]);
var SUPPORTED_OPERATIONS = operationSchema.options.map(
  (schema) => schema.entries.type.literal
);
var tools = {
  read_prototype: {
    description: "Read an explicit page and bounded node/flow graph, including reactions, starts, fingerprints and incomplete/unsupported paths.",
    schema: prototypeReadSchema,
    readOnly: true
  },
  validate_prototype: {
    description: "Statically validate a scoped prototype graph. Valid structure is not proof of playback.",
    schema: prototypeReadSchema,
    readOnly: true
  },
  prepare_prototype_playback: {
    description: "Prepare a prototype flow and candidate interaction checks for the agent browser/desktop controller. Does not open or play Figma; supplied URLs require document confirmation.",
    schema: prototypePlaybackSchema,
    readOnly: true
  },
  sessions: {
    description: "List connected local Figma plugin sessions. Always target an explicit session; file names and foreground tabs are not routing authority.",
    schema: v2.strictObject({}),
    readOnly: true
  },
  selection: {
    description: "Read the current page and selected node IDs in an explicit plugin session.",
    schema: v2.strictObject({ sessionId: id2 }),
    readOnly: true
  },
  read_nodes: {
    description: "Read bounded design data and mutation fingerprints for explicit nodes. Follow omitted child IDs with another scoped read. Never assume an incomplete response is a complete design.",
    schema: v2.strictObject({
      sessionId: id2,
      nodeIds: v2.pipe(v2.array(id2), v2.minLength(1), v2.maxLength(24)),
      depth: v2.optional(
        v2.pipe(v2.number(), v2.integer(), v2.minValue(0), v2.maxValue(8)),
        2
      ),
      maxNodes: v2.optional(
        v2.pipe(v2.number(), v2.integer(), v2.minValue(1), v2.maxValue(500)),
        100
      )
    }),
    readOnly: true
  },
  read_text: {
    description: "Read a bounded text range and styled runs. Continue with nextOffset; expectedTextHash rejects a changed text snapshot.",
    schema: v2.strictObject({
      sessionId: id2,
      nodeId: id2,
      offset: v2.optional(v2.pipe(v2.number(), v2.integer(), v2.minValue(0)), 0),
      length: v2.optional(
        v2.pipe(v2.number(), v2.integer(), v2.minValue(1), v2.maxValue(8192)),
        4096
      ),
      expectedTextHash: v2.optional(id2)
    }),
    readOnly: true
  },
  read_resources: {
    description: "Resolve explicit local variable/collection/style/component IDs; aliases are preserved with bounded continuation IDs. Remote resources are unavailable.",
    schema: v2.strictObject({
      sessionId: id2,
      variableIds: v2.optional(v2.pipe(v2.array(id2), v2.maxLength(50)), []),
      styleIds: v2.optional(v2.pipe(v2.array(id2), v2.maxLength(50)), []),
      componentIds: v2.optional(v2.pipe(v2.array(id2), v2.maxLength(20)), [])
    }),
    readOnly: true
  },
  export: {
    description: "Export an explicit node as PNG/SVG, or original image bytes by imageHash. Saves a bounded artifact locally; no remote URLs.",
    schema: v2.strictObject({
      sessionId: id2,
      nodeId: id2,
      format: v2.picklist(["PNG", "SVG", "IMAGE"]),
      imageHash: v2.optional(id2),
      scale: v2.optional(v2.pipe(v2.number(), v2.minValue(0.1), v2.maxValue(4)), 1)
    }),
    readOnly: true
  },
  design_context: {
    description: "Read a scoped design subtree. The project MCP adapter adds configured framework and source references for an optional target. Resolve resource IDs and export a preview separately.",
    schema: v2.strictObject({
      sessionId: id2,
      nodeId: id2,
      target: v2.optional(id2)
    }),
    readOnly: true
  },
  write_scope: {
    description: "Acquire or release the sole writer lease for an explicit page/frame. Use the returned generation and leaseId for apply. A lease does not lock out human editors.",
    schema: v2.strictObject({
      sessionId: id2,
      rootId: id2,
      action: v2.picklist(["acquire", "release"])
    }),
    readOnly: false
  },
  apply: {
    description: "Preflight or apply supported operations inside a leased root. Use fresh fingerprints from read_nodes. Results can be partial or unknown; never blindly replay a lost write. Reuse operationId only with the identical payload.",
    schema: v2.strictObject({
      sessionId: id2,
      generation: id2,
      leaseId: id2,
      operationId: v2.pipe(v2.string(), v2.uuid()),
      dryRun: v2.optional(v2.boolean(), false),
      operations: v2.pipe(
        v2.array(operationSchema),
        v2.minLength(1),
        v2.maxLength(50)
      )
    }),
    readOnly: false
  },
  cancel_operation: {
    description: "Request cancellation at the next safe operation boundary. Inspect operation_status afterward; native calls may finish first.",
    schema: v2.strictObject({ sessionId: id2, operationId: id2 }),
    readOnly: false
  },
  operation_status: {
    description: "Read a write receipt without replaying the write. Unknown means inspect the canvas before any new operation.",
    schema: v2.strictObject({ sessionId: id2, operationId: id2 }),
    readOnly: true
  }
};
var commandSchema = v2.strictObject({
  type: v2.literal("command"),
  version: v2.literal(VERSION),
  requestId: id2,
  method: v2.picklist([
    "read_prototype",
    "validate_prototype",
    "prepare_prototype_playback",
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
  params: v2.record(v2.string(), v2.unknown())
});
var replySchema = v2.strictObject({
  type: v2.literal("result"),
  version: v2.literal(VERSION),
  requestId: id2,
  ok: v2.boolean(),
  result: v2.optional(v2.unknown()),
  error: v2.optional(v2.string())
});
var helloSchema = v2.strictObject({
  type: v2.literal("hello"),
  version: v2.literal(VERSION),
  token: v2.pipe(v2.string(), v2.length(64)),
  nonce: id2,
  documentName: v2.pipe(v2.string(), v2.maxLength(512)),
  capabilities: v2.pipe(
    v2.array(v2.picklist(Object.keys(tools))),
    v2.maxLength(32)
  ),
  operations: v2.pipe(v2.array(v2.string()), v2.maxLength(32))
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
  const r = v2.safeParse(schema, input);
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
  PACKAGE_VERSION,
  PORT,
  SUPPORTED_OPERATIONS,
  VERSION,
  bytesHash,
  canonical,
  commandSchema,
  fingerprint,
  fontSchema,
  helloSchema,
  id2 as id,
  operationSchema,
  parse,
  patchSchema,
  proof,
  replySchema,
  tools,
  utf8
};
