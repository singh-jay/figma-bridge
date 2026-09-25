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
import * as v2 from "valibot";
var VERSION = 1;
var MAX_MESSAGE = 512 * 1024;
var MAX_RESULT = 256 * 1024;
var id = v2.pipe(v2.string(), v2.minLength(1), v2.maxLength(200));
var finite2 = v2.pipe(v2.number(), v2.finite());
var size = v2.pipe(finite2, v2.minValue(0), v2.maxValue(1e5));
var text = v2.pipe(v2.string(), v2.maxLength(16384));
var fontSchema = v2.strictObject({ family: id, style: id });
var color = v2.strictObject({
  r: v2.pipe(finite2, v2.minValue(0), v2.maxValue(1)),
  g: v2.pipe(finite2, v2.minValue(0), v2.maxValue(1)),
  b: v2.pipe(finite2, v2.minValue(0), v2.maxValue(1))
});
var patchSchema = v2.strictObject({
  name: v2.optional(v2.pipe(v2.string(), v2.maxLength(512))),
  x: v2.optional(finite2),
  y: v2.optional(finite2),
  width: v2.optional(size),
  height: v2.optional(size),
  visible: v2.optional(v2.boolean()),
  opacity: v2.optional(v2.pipe(finite2, v2.minValue(0), v2.maxValue(1))),
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
          opacity: v2.optional(v2.pipe(finite2, v2.minValue(0), v2.maxValue(1)))
        })
      ),
      v2.maxLength(8)
    )
  )
});
var guarded = { nodeId: id, expectedFingerprint: id };
var operationSchema = v2.variant("type", [
  v2.strictObject({
    type: v2.literal("create"),
    key: v2.pipe(v2.string(), v2.regex(/^[A-Za-z][A-Za-z0-9_-]{0,63}$/)),
    parentId: id,
    expectedFingerprint: id,
    kind: v2.picklist(["FRAME", "TEXT", "RECTANGLE", "INSTANCE"]),
    componentId: v2.optional(id),
    patch: v2.optional(patchSchema),
    characters: v2.optional(text),
    font: v2.optional(fontSchema)
  }),
  v2.strictObject({ type: v2.literal("update"), ...guarded, patch: patchSchema }),
  v2.strictObject({
    type: v2.literal("instance_properties"),
    ...guarded,
    properties: v2.record(id, v2.union([v2.string(), v2.boolean()]))
  }),
  v2.strictObject({
    type: v2.literal("bind_variable"),
    ...guarded,
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
    variableId: id
  }),
  v2.strictObject({
    type: v2.literal("move"),
    ...guarded,
    parentId: id,
    parentFingerprint: id,
    index: v2.pipe(v2.number(), v2.integer(), v2.minValue(0), v2.maxValue(1e4))
  }),
  v2.strictObject({
    type: v2.literal("set_text"),
    ...guarded,
    characters: text,
    font: v2.optional(fontSchema)
  })
]);
var tools = {
  sessions: {
    description: "List connected local Figma plugin sessions. Always target an explicit session; file names and foreground tabs are not routing authority.",
    schema: v2.strictObject({}),
    readOnly: true
  },
  selection: {
    description: "Read the current page and selected node IDs in an explicit plugin session.",
    schema: v2.strictObject({ sessionId: id }),
    readOnly: true
  },
  read_nodes: {
    description: "Read bounded design data and mutation fingerprints for explicit nodes. Follow omitted child IDs with another scoped read. Never assume an incomplete response is a complete design.",
    schema: v2.strictObject({
      sessionId: id,
      nodeIds: v2.pipe(v2.array(id), v2.minLength(1), v2.maxLength(24)),
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
      sessionId: id,
      nodeId: id,
      offset: v2.optional(v2.pipe(v2.number(), v2.integer(), v2.minValue(0)), 0),
      length: v2.optional(
        v2.pipe(v2.number(), v2.integer(), v2.minValue(1), v2.maxValue(8192)),
        4096
      ),
      expectedTextHash: v2.optional(id)
    }),
    readOnly: true
  },
  read_resources: {
    description: "Resolve explicit local variable/collection/style/component IDs; aliases are preserved with bounded continuation IDs. Remote resources are unavailable.",
    schema: v2.strictObject({
      sessionId: id,
      variableIds: v2.optional(v2.pipe(v2.array(id), v2.maxLength(50)), []),
      styleIds: v2.optional(v2.pipe(v2.array(id), v2.maxLength(50)), []),
      componentIds: v2.optional(v2.pipe(v2.array(id), v2.maxLength(20)), [])
    }),
    readOnly: true
  },
  export: {
    description: "Export an explicit node as PNG/SVG, or original image bytes by imageHash. Saves a bounded artifact locally; no remote URLs.",
    schema: v2.strictObject({
      sessionId: id,
      nodeId: id,
      format: v2.picklist(["PNG", "SVG", "IMAGE"]),
      imageHash: v2.optional(id),
      scale: v2.optional(v2.pipe(v2.number(), v2.minValue(0.1), v2.maxValue(4)), 1)
    }),
    readOnly: true
  },
  design_context: {
    description: "Read a scoped design subtree. The project MCP adapter adds configured framework and source references for an optional target. Resolve resource IDs and export a preview separately.",
    schema: v2.strictObject({
      sessionId: id,
      nodeId: id,
      target: v2.optional(id)
    }),
    readOnly: true
  },
  write_scope: {
    description: "Acquire or release the sole writer lease for an explicit page/frame. Use the returned generation and leaseId for apply. A lease does not lock out human editors.",
    schema: v2.strictObject({
      sessionId: id,
      rootId: id,
      action: v2.picklist(["acquire", "release"])
    }),
    readOnly: false
  },
  apply: {
    description: "Preflight or apply supported operations inside a leased root. Use fresh fingerprints from read_nodes. Results can be partial or unknown; never blindly replay a lost write. Reuse operationId only with the identical payload.",
    schema: v2.strictObject({
      sessionId: id,
      generation: id,
      leaseId: id,
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
    schema: v2.strictObject({ sessionId: id, operationId: id }),
    readOnly: false
  },
  operation_status: {
    description: "Read a write receipt without replaying the write. Unknown means inspect the canvas before any new operation.",
    schema: v2.strictObject({ sessionId: id, operationId: id }),
    readOnly: true
  }
};
var commandSchema = v2.strictObject({
  type: v2.literal("command"),
  version: v2.literal(VERSION),
  requestId: id,
  method: v2.picklist([
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
  requestId: id,
  ok: v2.boolean(),
  result: v2.optional(v2.unknown()),
  error: v2.optional(v2.string())
});
var helloSchema = v2.strictObject({
  type: v2.literal("hello"),
  version: v2.literal(VERSION),
  token: v2.pipe(v2.string(), v2.length(64)),
  nonce: id,
  documentName: v2.pipe(v2.string(), v2.maxLength(512))
});

// src/cli/adapter.ts
async function upstreamClient(stateDirectory, port) {
  const client = new Client({ name: "figma-bridge-client", version: "0.1.0" });
  await client.connect(
    new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${port}/mcp`), {
      requestInit: {
        headers: { Authorization: `Bearer ${credential(stateDirectory)}` }
      }
    })
  );
  if (client.getServerVersion()?.name !== "figma-bridge") {
    await client.close();
    throw new Error("INCOMPATIBLE_SERVICE: expected Figma Bridge");
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
    { name: "figma-bridge", version: "0.1.0" },
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
