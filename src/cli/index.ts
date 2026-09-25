#!/usr/bin/env node
import {
  mkdirSync,
  existsSync,
  readFileSync,
  writeFileSync,
  cpSync,
  realpathSync,
} from "node:fs";
import { homedir } from "node:os";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import { startBridge } from "../bridge/server";
import { credential } from "../bridge/state";
import { PORT, VERSION, tools } from "../protocol/index";
import { runMcp, upstreamClient, callWithContext } from "./adapter";

const packageRoot = fileURLToPath(new URL("../../", import.meta.url));
const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    project: { type: "string" },
    "state-dir": { type: "string" },
    port: { type: "string" },
    "skill-dir": { type: "string" },
    args: { type: "string" },
    force: { type: "boolean" },
    help: { type: "boolean", short: "h" },
  },
});
const project = realpathSync(resolve(values.project ?? process.cwd()));
const defaultState =
  process.platform === "darwin"
    ? join(homedir(), "Library/Application Support/Figma Bridge")
    : process.platform === "win32"
      ? join(process.env.LOCALAPPDATA ?? homedir(), "Figma Bridge")
      : join(
          process.env.XDG_STATE_HOME ?? join(homedir(), ".local/state"),
          "figma-bridge"
        );
const state = resolve(values["state-dir"] ?? defaultState);
const port = Number(values.port ?? PORT);
const action = values.help ? "help" : (positionals[0] ?? "help");
const help = `Figma Bridge — local Figma tools for coding agents

  figma-bridge init [--project PATH]       Write starter profile, plugin, MCP snippet
  figma-bridge start                      Run the shared local service
  figma-bridge pair                       Generate a five-minute pairing code
  figma-bridge doctor                     Check authenticated service health
  figma-bridge mcp --project PATH         MCP stdio adapter for a project
  figma-bridge inspect TOOL --args JSON   Call a read-only tool (explicit session IDs)
  figma-bridge verify                    Check MCP tools, instructions and sessions
  figma-bridge install-skill              Install the generic figma-bridge skill

Common: --state-dir PATH, --port NUMBER (default 3846).
init --force refreshes generated plugin assets. A custom port requires init with
the same port and importing that generated manifest. install-skill accepts
--skill-dir PATH and --force. Configuration is never overwritten by init.
`;
async function service(path: string, method = "GET") {
  const response = await fetch(`http://127.0.0.1:${port}/${path}`, {
    method,
    headers: { Authorization: `Bearer ${credential(state)}` },
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error(`BRIDGE_HTTP_${response.status}`);
  return response.json() as Promise<Record<string, unknown>>;
}
try {
  if (!Number.isInteger(port) || port < 1024 || port > 65535)
    throw new Error("INVALID_PORT");
  if (action === "start") {
    const bridge = await startBridge({
      token: credential(state, true),
      stateDirectory: state,
      port,
    });
    console.error(
      `Figma Bridge listening at http://127.0.0.1:${bridge.port}/mcp. Run figma-bridge pair.`
    );
    let stopping = false;
    const stop = async () => {
      if (stopping) return;
      stopping = true;
      await bridge.stop();
      process.exit(0);
    };
    process.on("SIGINT", stop);
    process.on("SIGTERM", stop);
  } else if (action === "mcp") {
    await runMcp(project, state, port);
  } else if (action === "pair" || action === "doctor") {
    const health = await service("health");
    if (health.name !== "figma-bridge" || health.version !== VERSION)
      throw new Error(
        "INCOMPATIBLE_SERVICE: stop the previous bridge before starting this version"
      );
    console.log(
      action === "pair"
        ? (await service("pair", "POST")).token
        : JSON.stringify(health, null, 2)
    );
  } else if (action === "init") {
    const configPath = join(project, "figma-bridge.config.json");
    if (!existsSync(configPath))
      writeFileSync(
        configPath,
        JSON.stringify({ version: 1, targets: {} }, null, 2) + "\n",
        { flag: "wx" }
      );
    const local = join(project, ".figma-bridge");
    const plugin = join(local, "plugin");
    if (existsSync(plugin) && !values.force)
      throw new Error("PLUGIN_ALREADY_EXISTS: use init --force to refresh it");
    // Generated assets only; never recurse through a user-supplied symlink.
    if (existsSync(local) && realpathSync(local) !== local)
      throw new Error("UNSAFE_PLUGIN_DIRECTORY");
    if (existsSync(plugin) && realpathSync(plugin) !== plugin)
      throw new Error("UNSAFE_PLUGIN_DIRECTORY");
    mkdirSync(plugin, { recursive: true });
    for (const name of ["code.js", "manifest.json"]) {
      const output = join(plugin, name);
      if (existsSync(output) && realpathSync(output) !== output)
        throw new Error("UNSAFE_PLUGIN_FILE");
      const input = readFileSync(join(packageRoot, "plugin", name), "utf8");
      writeFileSync(
        output,
        name === "code.js"
          ? input.replaceAll("__FIGMA_BRIDGE_PORT__", String(port))
          : input.replaceAll(":3846", `:${port}`)
      );
    }
    const args = [
      join(packageRoot, "dist/cli/index.js"),
      "mcp",
      "--project",
      project,
      "--state-dir",
      state,
      "--port",
      String(port),
    ];
    const snippet = {
      mcpServers: { figma_bridge: { command: process.execPath, args } },
    };
    writeFileSync(
      join(local, "mcp.json"),
      JSON.stringify(snippet, null, 2) + "\n"
    );
    writeFileSync(
      join(local, "codex.toml"),
      `[mcp_servers.figma_bridge]\ncommand = ${JSON.stringify(process.execPath)}\nargs = ${JSON.stringify(args)}\nstartup_timeout_sec = 20\ntool_timeout_sec = 120\n`
    );
    console.log(
      `Import ${join(plugin, "manifest.json")} in Figma desktop.\nMerge ${join(local, "mcp.json")} or ${join(local, "codex.toml")} into your MCP client configuration.\nAdd .figma-bridge/ to your project's .gitignore.\nEdit ${configPath} for your framework, component, token and guidance paths.\nThen run figma-bridge start and figma-bridge pair.`
    );
  } else if (action === "install-skill") {
    const root = resolve(
      values["skill-dir"] ??
        join(process.env.CODEX_HOME ?? join(homedir(), ".codex"), "skills")
    );
    const target = join(root, "figma-bridge");
    if (existsSync(target) && !values.force)
      throw new Error("SKILL_ALREADY_EXISTS: use --force to replace it");
    if (existsSync(target) && realpathSync(target) !== target)
      throw new Error("UNSAFE_SKILL_DIRECTORY");
    cpSync(join(packageRoot, "skills/figma-bridge"), target, {
      recursive: true,
      force: Boolean(values.force),
      errorOnExist: !values.force,
    });
    console.log(`Installed ${join(target, "SKILL.md")}`);
  } else if (action === "inspect" || action === "verify") {
    const client = await upstreamClient(state, port);
    try {
      if (action === "verify") {
        if (!client.getInstructions()?.trim())
          throw new Error("MISSING_MCP_INSTRUCTIONS");
        const listed = await client.listTools();
        const names = listed.tools.map((tool) => tool.name);
        if (
          !Object.keys(tools).every((name) =>
            names.includes(`figma_bridge_${name}`)
          )
        )
          throw new Error("MISSING_MCP_TOOLS");
        const result = await client.callTool({
          name: "figma_bridge_sessions",
          arguments: {},
        });
        if (result.isError) throw new Error("SESSIONS_FAILED");
        console.log(
          JSON.stringify({
            instructions: true,
            tools: names,
            sessions: result.structuredContent,
          })
        );
      } else {
        const name = positionals[1]?.replace(/^figma_bridge_/, "");
        if (
          !name ||
          !Object.hasOwn(tools, name) ||
          !tools[name as keyof typeof tools].readOnly
        )
          throw new Error("INSPECT_REQUIRES_READ_ONLY_TOOL");
        const result = await callWithContext(
          client,
          project,
          `figma_bridge_${name}`,
          JSON.parse(values.args ?? "{}")
        );
        console.log(JSON.stringify(result.structuredContent ?? result));
        if (result.isError) process.exitCode = 1;
      }
    } finally {
      await client.close();
    }
  } else if (action === "help") console.log(help);
  else throw new Error(`Unknown command: ${action}\n${help}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : "FIGMA_BRIDGE_FAILED");
  process.exitCode = 1;
}
