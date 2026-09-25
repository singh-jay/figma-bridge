// src/cli/adapter.ts
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  CallToolResultSchema
} from "@modelcontextprotocol/sdk/types.js";

// src/bridge/state.ts
import { randomBytes } from "node:crypto";
import {
  chmodSync,
  existsSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  closeSync,
  writeFileSync,
  realpathSync
} from "node:fs";
import { dirname, join, resolve } from "node:path";
var secret = () => randomBytes(32).toString("hex");
function privateDirectory(directory) {
  const target = resolve(directory);
  const parent = dirname(target);
  if (!existsSync(parent)) privateDirectory(parent);
  if (existsSync(target)) {
    if (lstatSync(target).isSymbolicLink() || !lstatSync(target).isDirectory())
      throw new Error("UNSAFE_STATE_DIRECTORY");
  } else mkdirSync(target, { mode: 448 });
  if (realpathSync(target) !== target)
    throw new Error("SYMLINKED_STATE_DIRECTORY");
  chmodSync(target, 448);
  return target;
}
function credential(directory, create = false) {
  if (create) privateDirectory(directory);
  const file = join(directory, "credential");
  if (!existsSync(file) && create) {
    const fd = openSync(file, "wx", 384);
    try {
      writeFileSync(fd, secret());
    } finally {
      closeSync(fd);
    }
  }
  if (!existsSync(file))
    throw new Error("BRIDGE_NOT_INITIALIZED: start the bridge first");
  if (realpathSync(directory) !== resolve(directory) || lstatSync(file).isSymbolicLink() || !lstatSync(file).isFile())
    throw new Error("UNSAFE_CREDENTIAL_FILE");
  if ((lstatSync(file).mode & 63) !== 0)
    throw new Error("CREDENTIAL_PERMISSIONS_MUST_BE_0600");
  const token = readFileSync(file, "utf8").trim();
  if (!/^[a-f0-9]{64}$/.test(token)) throw new Error("INVALID_CREDENTIAL_FILE");
  return token;
}

// src/project/config.ts
import { existsSync as existsSync2, readFileSync as readFileSync2, realpathSync as realpathSync2, statSync } from "node:fs";
import { isAbsolute, relative, resolve as resolve2, dirname as dirname2 } from "node:path";
import * as v from "valibot";
var label = v.pipe(v.string(), v.minLength(1), v.maxLength(512));
var paths = v.optional(v.pipe(v.array(label), v.maxLength(32)), []);
var projectSchema = v.strictObject({
  version: v.literal(1),
  targets: v.record(
    label,
    v.strictObject({
      root: v.optional(label, "."),
      framework: v.optional(label),
      language: v.optional(label),
      styling: v.optional(label),
      components: paths,
      tokens: paths,
      guidance: paths
    })
  )
});
function contained(root, path) {
  const rel = relative(root, path);
  return rel !== ".." && !rel.startsWith(".." + (process.platform === "win32" ? "\\" : "/")) && !isAbsolute(rel);
}
function sourcePath(root, value) {
  if (isAbsolute(value)) throw new Error("PROJECT_PATH_MUST_BE_RELATIVE");
  const path = resolve2(root, value);
  if (!contained(root, path)) throw new Error("PROJECT_PATH_OUTSIDE_ROOT");
  let existing = path;
  while (!existsSync2(existing) && dirname2(existing) !== existing)
    existing = dirname2(existing);
  if (!contained(root, realpathSync2(existing)))
    throw new Error("PROJECT_SYMLINK_OUTSIDE_ROOT");
  return path;
}
function projectContext(project, target) {
  const root = realpathSync2(project);
  if (!statSync(root).isDirectory()) throw new Error("PROJECT_NOT_DIRECTORY");
  const file = resolve2(root, "figma-bridge.config.json");
  if (!existsSync2(file))
    return {
      configured: false,
      root,
      availableTargets: [],
      missingMappings: [
        "No figma-bridge.config.json; inspect this project's existing code and guidance."
      ]
    };
  sourcePath(root, "figma-bridge.config.json");
  if (statSync(file).size > 65536) throw new Error("PROJECT_CONFIG_TOO_LARGE");
  const config = v.parse(projectSchema, JSON.parse(readFileSync2(file, "utf8")));
  const availableTargets = Object.keys(config.targets);
  if (availableTargets.length > 32) throw new Error("TOO_MANY_PROJECT_TARGETS");
  const selected = target ?? (availableTargets.length === 1 ? availableTargets[0] : void 0);
  if (!selected)
    return {
      configured: true,
      root,
      availableTargets,
      missingMappings: [
        "Choose an explicit project target; it does not select a Figma document."
      ]
    };
  if (!Object.hasOwn(config.targets, selected))
    throw new Error("PROJECT_TARGET_NOT_FOUND");
  const profile = config.targets[selected];
  const targetRoot = sourcePath(root, profile.root);
  const sources = ["components", "tokens", "guidance"].flatMap(
    (kind) => profile[kind].map((value) => {
      if (isAbsolute(value)) throw new Error("PROJECT_PATH_MUST_BE_RELATIVE");
      const path = sourcePath(
        root,
        relative(root, resolve2(targetRoot, value))
      );
      return { kind, path, verifiedExists: existsSync2(path) };
    })
  );
  return {
    configured: true,
    root,
    target: selected,
    availableTargets,
    framework: profile.framework ?? null,
    language: profile.language ?? null,
    styling: profile.styling ?? null,
    targetRoot,
    sources,
    missingMappings: [
      "Source existence does not establish a Figma node-to-code identity. Inspect source exports and explicit project contracts before mapping components or tokens."
    ]
  };
}

// src/protocol/index.ts
import { hmac } from "@noble/hashes/hmac.js";
import { sha256 } from "@noble/hashes/sha2.js";
import * as v3 from "valibot";

// src/protocol/prototype.ts
import * as v2 from "valibot";
var id = v2.pipe(v2.string(), v2.minLength(1), v2.maxLength(200));
var realId = v2.pipe(id, v2.regex(/^[^$]/, "Use confirmed node IDs"));
var index = v2.pipe(v2.number(), v2.integer(), v2.minValue(0), v2.maxValue(999));
var guarded = { nodeId: realId, expectedFingerprint: id };
var seconds = v2.pipe(v2.number(), v2.minValue(0), v2.maxValue(10));
var triggerSeconds = v2.pipe(
  v2.number(),
  v2.minValue(0),
  v2.maxValue(60),
  v2.description(
    "Seconds in the native Plugin API; 1.5 is 1500ms in the Figma editor"
  )
);
var transition = v2.nullable(
  v2.strictObject({
    type: v2.picklist(["DISSOLVE", "SMART_ANIMATE"]),
    duration: seconds,
    easing: v2.strictObject({
      type: v2.picklist([
        "LINEAR",
        "EASE_IN",
        "EASE_OUT",
        "EASE_IN_AND_OUT",
        "EASE_IN_BACK",
        "EASE_OUT_BACK",
        "EASE_IN_AND_OUT_BACK",
        "GENTLE",
        "QUICK",
        "BOUNCY",
        "SLOW"
      ])
    })
  })
);
var triggerSchema = v2.variant("type", [
  v2.strictObject({
    type: v2.picklist(["ON_CLICK", "ON_HOVER", "ON_PRESS", "ON_DRAG"])
  }),
  v2.strictObject({ type: v2.literal("AFTER_TIMEOUT"), timeout: triggerSeconds }),
  v2.strictObject({
    type: v2.picklist(["MOUSE_UP", "MOUSE_DOWN"]),
    delay: triggerSeconds
  }),
  v2.strictObject({
    type: v2.picklist(["MOUSE_ENTER", "MOUSE_LEAVE"]),
    delay: triggerSeconds,
    deprecatedVersion: v2.optional(v2.literal(false), false)
  }),
  v2.strictObject({
    type: v2.literal("ON_KEY_DOWN"),
    device: v2.literal("KEYBOARD"),
    keyCodes: v2.pipe(
      v2.array(v2.pipe(v2.number(), v2.integer(), v2.minValue(0), v2.maxValue(255))),
      v2.minLength(1),
      v2.maxLength(4),
      v2.check((keys) => new Set(keys).size === keys.length, "Duplicate keys")
    )
  })
]);
var resolved = v2.picklist(["BOOLEAN", "FLOAT", "STRING", "COLOR"]);
var channel = v2.pipe(v2.number(), v2.minValue(0), v2.maxValue(1));
function valueSchema(depth) {
  const literals = [
    v2.strictObject({
      type: v2.literal("BOOLEAN"),
      resolvedType: v2.literal("BOOLEAN"),
      value: v2.boolean()
    }),
    v2.strictObject({
      type: v2.literal("FLOAT"),
      resolvedType: v2.literal("FLOAT"),
      value: v2.pipe(v2.number(), v2.minValue(-1e12), v2.maxValue(1e12))
    }),
    v2.strictObject({
      type: v2.literal("STRING"),
      resolvedType: v2.literal("STRING"),
      value: v2.pipe(v2.string(), v2.maxLength(4096))
    }),
    v2.strictObject({
      type: v2.literal("COLOR"),
      resolvedType: v2.literal("COLOR"),
      value: v2.strictObject({
        r: channel,
        g: channel,
        b: channel,
        a: v2.optional(channel)
      })
    }),
    v2.strictObject({
      type: v2.literal("VARIABLE_ALIAS"),
      resolvedType: resolved,
      value: v2.strictObject({ type: v2.literal("VARIABLE_ALIAS"), id: realId })
    })
  ];
  if (!depth) return v2.union(literals);
  return v2.union([
    ...literals,
    v2.strictObject({
      type: v2.literal("EXPRESSION"),
      resolvedType: resolved,
      value: v2.strictObject({
        expressionFunction: v2.picklist([
          "ADDITION",
          "SUBTRACTION",
          "MULTIPLICATION",
          "DIVISION",
          "EQUALS",
          "NOT_EQUAL",
          "LESS_THAN",
          "LESS_THAN_OR_EQUAL",
          "GREATER_THAN",
          "GREATER_THAN_OR_EQUAL",
          "AND",
          "OR",
          "NEGATE",
          "NOT"
        ]),
        expressionArguments: v2.pipe(
          v2.array(valueSchema(depth - 1)),
          v2.minLength(1),
          v2.maxLength(2)
        )
      })
    })
  ]);
}
var prototypeValueSchema = valueSchema(4);
function actionSchema(depth) {
  const leaves = [
    v2.strictObject({ type: v2.picklist(["BACK", "CLOSE"]) }),
    v2.strictObject({
      type: v2.literal("NODE"),
      destinationId: realId,
      navigation: v2.picklist(["NAVIGATE", "OVERLAY", "CHANGE_TO"]),
      transition,
      resetScrollPosition: v2.optional(v2.boolean(), true),
      resetVideoPosition: v2.optional(v2.boolean(), false)
    }),
    v2.strictObject({
      type: v2.literal("SET_VARIABLE"),
      variableId: realId,
      variableValue: prototypeValueSchema
    }),
    v2.strictObject({
      type: v2.literal("SET_VARIABLE_MODE"),
      variableCollectionId: realId,
      variableModeId: realId
    })
  ];
  if (!depth) return v2.union(leaves);
  return v2.union([
    ...leaves,
    v2.strictObject({
      type: v2.literal("CONDITIONAL"),
      conditionalBlocks: v2.pipe(
        v2.array(
          v2.strictObject({
            condition: v2.optional(prototypeValueSchema),
            actions: v2.pipe(
              v2.array(actionSchema(depth - 1)),
              v2.minLength(1),
              v2.maxLength(16)
            )
          })
        ),
        v2.minLength(1),
        v2.maxLength(8),
        v2.check(
          (blocks) => blocks.every(
            (block, i) => block.condition !== void 0 || i === blocks.length - 1
          ),
          "Else must be last"
        )
      )
    })
  ]);
}
var prototypeActionSchema = actionSchema(3);
function actionCount(actions) {
  return actions.reduce(
    (count, action) => count + 1 + (action.type === "CONDITIONAL" ? action.conditionalBlocks.reduce(
      (n, b) => n + actionCount(b.actions),
      0
    ) : 0),
    0
  );
}
var reactionSchema = v2.pipe(
  v2.strictObject({
    trigger: triggerSchema,
    actions: v2.pipe(
      v2.array(prototypeActionSchema),
      v2.minLength(1),
      v2.maxLength(16)
    )
  }),
  v2.check(
    (reaction) => actionCount(reaction.actions) <= 64,
    "At most 64 actions per reaction"
  )
);
var PROTOTYPE_FEATURES = [
  "advanced_triggers",
  "smart_animate",
  "change_to",
  "multiple_actions",
  "variable_actions",
  "expressions",
  "conditionals"
];
var prototypeOperations = [
  v2.strictObject({
    type: v2.literal("upsert_reaction"),
    ...guarded,
    index: v2.optional(index),
    reaction: reactionSchema
  }),
  v2.strictObject({ type: v2.literal("remove_reaction"), ...guarded, index }),
  v2.strictObject({
    type: v2.literal("upsert_flow_start"),
    ...guarded,
    startNodeId: realId,
    name: v2.pipe(v2.string(), v2.minLength(1), v2.maxLength(200))
  }),
  v2.strictObject({
    type: v2.literal("remove_flow_start"),
    ...guarded,
    startNodeId: realId
  }),
  v2.strictObject({
    type: v2.literal("update_prototype_settings"),
    ...guarded,
    patch: v2.strictObject({
      overflowDirection: v2.picklist(["NONE", "HORIZONTAL", "VERTICAL", "BOTH"])
    })
  })
];
var prototypeOperationSchema = v2.variant("type", prototypeOperations);
var scenarioSchema = v2.strictObject({
  startNodeId: realId,
  expectedScreenIds: v2.optional(v2.pipe(v2.array(realId), v2.maxLength(100)), []),
  requireExitNodeIds: v2.optional(v2.pipe(v2.array(realId), v2.maxLength(100)), [])
});
var prototypeReadEntries = {
  scenario: v2.optional(scenarioSchema),
  sessionId: id,
  pageId: realId,
  nodeIds: v2.pipe(v2.array(realId), v2.minLength(1), v2.maxLength(24)),
  traverseDestinations: v2.optional(v2.boolean(), false),
  maxNodes: v2.optional(
    v2.pipe(v2.number(), v2.integer(), v2.minValue(1), v2.maxValue(500)),
    100
  ),
  maxEdges: v2.optional(
    v2.pipe(v2.number(), v2.integer(), v2.minValue(1), v2.maxValue(1e3)),
    200
  )
};
var prototypeReadSchema = v2.strictObject(prototypeReadEntries);
var prototypePlaybackSchema = v2.strictObject({
  ...prototypeReadEntries,
  startNodeId: realId,
  // A supplied URL is a routing hint, never proof of document identity.
  prototypeUrl: v2.optional(
    v2.pipe(
      v2.string(),
      v2.maxLength(2048),
      v2.regex(
        /^https:\/\/(?:www\.)?figma\.com\/proto\/[A-Za-z0-9]+(?:\/[^\s?#]*)?(?:\?[^\s#]*)?(?:#[^\s]*)?$/
      )
    )
  )
});
var PROTOTYPE_OPERATIONS = prototypeOperations.map(
  (schema) => schema.entries.type.literal
);

// src/protocol/index.ts
var VERSION = 3;
var PACKAGE_VERSION = "0.3.0";
var MAX_MESSAGE = 512 * 1024;
var MAX_RESULT = 256 * 1024;
var id2 = v3.pipe(v3.string(), v3.minLength(1), v3.maxLength(200));
var finite2 = v3.pipe(v3.number(), v3.finite());
var size = v3.pipe(finite2, v3.minValue(0), v3.maxValue(1e5));
var text = v3.pipe(v3.string(), v3.maxLength(16384));
var fontSchema = v3.strictObject({ family: id2, style: id2 });
var color = v3.strictObject({
  r: v3.pipe(finite2, v3.minValue(0), v3.maxValue(1)),
  g: v3.pipe(finite2, v3.minValue(0), v3.maxValue(1)),
  b: v3.pipe(finite2, v3.minValue(0), v3.maxValue(1))
});
var patchSchema = v3.strictObject({
  name: v3.optional(v3.pipe(v3.string(), v3.maxLength(512))),
  x: v3.optional(finite2),
  y: v3.optional(finite2),
  width: v3.optional(size),
  height: v3.optional(size),
  visible: v3.optional(v3.boolean()),
  opacity: v3.optional(v3.pipe(finite2, v3.minValue(0), v3.maxValue(1))),
  cornerRadius: v3.optional(size),
  clipsContent: v3.optional(v3.boolean()),
  layoutMode: v3.optional(v3.picklist(["NONE", "HORIZONTAL", "VERTICAL"])),
  layoutSizingHorizontal: v3.optional(v3.picklist(["FIXED", "HUG", "FILL"])),
  layoutSizingVertical: v3.optional(v3.picklist(["FIXED", "HUG", "FILL"])),
  primaryAxisAlignItems: v3.optional(
    v3.picklist(["MIN", "MAX", "CENTER", "SPACE_BETWEEN"])
  ),
  counterAxisAlignItems: v3.optional(
    v3.picklist(["MIN", "MAX", "CENTER", "BASELINE"])
  ),
  paddingTop: v3.optional(size),
  paddingBottom: v3.optional(size),
  paddingLeft: v3.optional(size),
  paddingRight: v3.optional(size),
  itemSpacing: v3.optional(size),
  fontSize: v3.optional(v3.pipe(size, v3.minValue(1))),
  fills: v3.optional(
    v3.pipe(
      v3.array(
        v3.strictObject({
          type: v3.literal("SOLID"),
          color,
          opacity: v3.optional(v3.pipe(finite2, v3.minValue(0), v3.maxValue(1)))
        })
      ),
      v3.maxLength(8)
    )
  )
});
var guarded2 = { nodeId: id2, expectedFingerprint: id2 };
var operationSchema = v3.variant("type", [
  ...prototypeOperations,
  v3.strictObject({
    type: v3.literal("create"),
    key: v3.pipe(v3.string(), v3.regex(/^[A-Za-z][A-Za-z0-9_-]{0,63}$/)),
    parentId: id2,
    expectedFingerprint: id2,
    kind: v3.picklist(["FRAME", "TEXT", "RECTANGLE", "INSTANCE"]),
    componentId: v3.optional(id2),
    patch: v3.optional(patchSchema),
    characters: v3.optional(text),
    font: v3.optional(fontSchema)
  }),
  v3.strictObject({ type: v3.literal("update"), ...guarded2, patch: patchSchema }),
  v3.strictObject({
    type: v3.literal("instance_properties"),
    ...guarded2,
    properties: v3.record(id2, v3.union([v3.string(), v3.boolean()]))
  }),
  v3.strictObject({
    type: v3.literal("bind_variable"),
    ...guarded2,
    field: v3.picklist([
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
  v3.strictObject({
    type: v3.literal("move"),
    ...guarded2,
    parentId: id2,
    parentFingerprint: id2,
    index: v3.pipe(v3.number(), v3.integer(), v3.minValue(0), v3.maxValue(1e4))
  }),
  v3.strictObject({
    type: v3.literal("set_text"),
    ...guarded2,
    characters: text,
    font: v3.optional(fontSchema)
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
    schema: v3.strictObject({}),
    readOnly: true
  },
  selection: {
    description: "Read the current page and selected node IDs in an explicit plugin session.",
    schema: v3.strictObject({ sessionId: id2 }),
    readOnly: true
  },
  read_nodes: {
    description: "Read bounded design data and mutation fingerprints for explicit nodes. Follow omitted child IDs with another scoped read. Never assume an incomplete response is a complete design.",
    schema: v3.strictObject({
      sessionId: id2,
      nodeIds: v3.pipe(v3.array(id2), v3.minLength(1), v3.maxLength(24)),
      depth: v3.optional(
        v3.pipe(v3.number(), v3.integer(), v3.minValue(0), v3.maxValue(8)),
        2
      ),
      maxNodes: v3.optional(
        v3.pipe(v3.number(), v3.integer(), v3.minValue(1), v3.maxValue(500)),
        100
      )
    }),
    readOnly: true
  },
  read_text: {
    description: "Read a bounded text range and styled runs. Continue with nextOffset; expectedTextHash rejects a changed text snapshot.",
    schema: v3.strictObject({
      sessionId: id2,
      nodeId: id2,
      offset: v3.optional(v3.pipe(v3.number(), v3.integer(), v3.minValue(0)), 0),
      length: v3.optional(
        v3.pipe(v3.number(), v3.integer(), v3.minValue(1), v3.maxValue(8192)),
        4096
      ),
      expectedTextHash: v3.optional(id2)
    }),
    readOnly: true
  },
  read_resources: {
    description: "Resolve explicit local variable/collection/style/component IDs; aliases are preserved with bounded continuation IDs. Remote resources are unavailable.",
    schema: v3.strictObject({
      sessionId: id2,
      variableIds: v3.optional(v3.pipe(v3.array(id2), v3.maxLength(50)), []),
      styleIds: v3.optional(v3.pipe(v3.array(id2), v3.maxLength(50)), []),
      componentIds: v3.optional(v3.pipe(v3.array(id2), v3.maxLength(20)), [])
    }),
    readOnly: true
  },
  export: {
    description: "Export an explicit node as PNG/SVG, or original image bytes by imageHash. Saves a bounded artifact locally; no remote URLs.",
    schema: v3.strictObject({
      sessionId: id2,
      nodeId: id2,
      format: v3.picklist(["PNG", "SVG", "IMAGE"]),
      imageHash: v3.optional(id2),
      scale: v3.optional(v3.pipe(v3.number(), v3.minValue(0.1), v3.maxValue(4)), 1)
    }),
    readOnly: true
  },
  design_context: {
    description: "Read a scoped design subtree. The project MCP adapter adds configured framework and source references for an optional target. Resolve resource IDs and export a preview separately.",
    schema: v3.strictObject({
      sessionId: id2,
      nodeId: id2,
      target: v3.optional(id2)
    }),
    readOnly: true
  },
  write_scope: {
    description: "Acquire or release the sole writer lease for an explicit page/frame. Use the returned generation and leaseId for apply. A lease does not lock out human editors.",
    schema: v3.strictObject({
      sessionId: id2,
      rootId: id2,
      action: v3.picklist(["acquire", "release"])
    }),
    readOnly: false
  },
  apply: {
    description: "Preflight or apply supported operations inside a leased root. Use fresh fingerprints from read_nodes. Results can be partial or unknown; never blindly replay a lost write. Reuse operationId only with the identical payload.",
    schema: v3.strictObject({
      sessionId: id2,
      generation: id2,
      leaseId: id2,
      operationId: v3.pipe(v3.string(), v3.uuid()),
      dryRun: v3.optional(v3.boolean(), false),
      operations: v3.pipe(
        v3.array(operationSchema),
        v3.minLength(1),
        v3.maxLength(50)
      )
    }),
    readOnly: false
  },
  cancel_operation: {
    description: "Request cancellation at the next safe operation boundary. Inspect operation_status afterward; native calls may finish first.",
    schema: v3.strictObject({ sessionId: id2, operationId: id2 }),
    readOnly: false
  },
  operation_status: {
    description: "Read a write receipt without replaying the write. Unknown means inspect the canvas before any new operation.",
    schema: v3.strictObject({ sessionId: id2, operationId: id2 }),
    readOnly: true
  }
};
var commandSchema = v3.strictObject({
  type: v3.literal("command"),
  version: v3.literal(VERSION),
  requestId: id2,
  method: v3.picklist([
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
  params: v3.record(v3.string(), v3.unknown())
});
var replySchema = v3.strictObject({
  type: v3.literal("result"),
  version: v3.literal(VERSION),
  requestId: id2,
  ok: v3.boolean(),
  result: v3.optional(v3.unknown()),
  error: v3.optional(v3.string())
});
var helloSchema = v3.strictObject({
  type: v3.literal("hello"),
  version: v3.literal(VERSION),
  token: v3.pipe(v3.string(), v3.length(64)),
  nonce: id2,
  documentName: v3.pipe(v3.string(), v3.maxLength(512)),
  capabilities: v3.pipe(
    v3.array(v3.picklist(Object.keys(tools))),
    v3.maxLength(32)
  ),
  operations: v3.pipe(v3.array(v3.string()), v3.maxLength(32)),
  prototypeFeatures: v3.optional(
    v3.pipe(v3.array(v3.picklist(PROTOTYPE_FEATURES)), v3.maxLength(16)),
    []
  )
});

// src/cli/adapter.ts
async function upstreamClient(stateDirectory, port) {
  const client = new Client({
    name: "figma-bridge-client",
    version: PACKAGE_VERSION
  });
  await client.connect(
    new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${port}/mcp`), {
      requestInit: {
        headers: { Authorization: `Bearer ${credential(stateDirectory)}` }
      }
    })
  );
  if (client.getServerVersion()?.name !== "figma-bridge" || client.getServerVersion()?.version !== PACKAGE_VERSION) {
    await client.close();
    throw new Error(
      "INCOMPATIBLE_SERVICE: restart the service with the installed Figma Bridge version"
    );
  }
  return client;
}
async function callWithContext(client, project, name, args) {
  try {
    const repository = name === "figma_bridge_design_context" ? projectContext(
      project,
      typeof args.target === "string" ? args.target : void 0
    ) : void 0;
    const result = CallToolResultSchema.parse(
      await client.callTool({ name, arguments: args }, CallToolResultSchema, {
        timeout: 12e4
      })
    );
    if (result.isError || !repository) return result;
    const context = { ...result.structuredContent, repository };
    const text2 = JSON.stringify(context);
    if (Buffer.byteLength(text2) > MAX_RESULT)
      throw new Error("RESULT_TOO_LARGE");
    return {
      ...result,
      structuredContent: context,
      content: [{ type: "text", text: text2 }]
    };
  } catch (error) {
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: JSON.stringify({
            error: error instanceof Error ? error.message : "BRIDGE_ERROR"
          })
        }
      ]
    };
  }
}
async function runMcp(project, stateDirectory, port) {
  const upstream = await upstreamClient(stateDirectory, port);
  const server = new Server(
    { name: "figma-bridge", version: PACKAGE_VERSION },
    {
      capabilities: { tools: {} },
      instructions: `${upstream.getInstructions() ?? ""} Project context is scoped to this MCP adapter. Read design_context for the requested target; use its project's framework and conventions. Project configuration never selects a Figma session.`
    }
  );
  server.setRequestHandler(ListToolsRequestSchema, () => upstream.listTools());
  server.setRequestHandler(
    CallToolRequestSchema,
    (request) => callWithContext(
      upstream,
      project,
      request.params.name,
      request.params.arguments ?? {}
    )
  );
  server.onclose = () => {
    void upstream.close();
  };
  await server.connect(new StdioServerTransport());
}
export {
  callWithContext,
  runMcp,
  upstreamClient
};
