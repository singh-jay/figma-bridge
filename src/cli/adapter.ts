import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  CallToolResultSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { credential } from "../bridge/state";
import { projectContext } from "../project/config";
import { MAX_RESULT } from "../protocol/index";

export async function upstreamClient(stateDirectory: string, port: number) {
  const client = new Client({ name: "figma-bridge-client", version: "0.1.0" });
  await client.connect(
    new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${port}/mcp`), {
      requestInit: {
        headers: { Authorization: `Bearer ${credential(stateDirectory)}` },
      },
    })
  );
  if (client.getServerVersion()?.name !== "figma-bridge") {
    await client.close();
    throw new Error("INCOMPATIBLE_SERVICE: expected Figma Bridge");
  }
  return client;
}
export async function callWithContext(
  client: Client,
  project: string,
  name: string,
  args: Record<string, unknown>
) {
  try {
    const repository =
      name === "figma_bridge_design_context"
        ? projectContext(
            project,
            typeof args.target === "string" ? args.target : undefined
          )
        : undefined;
    const result = CallToolResultSchema.parse(
      await client.callTool({ name, arguments: args }, CallToolResultSchema, {
        timeout: 120_000,
      })
    );
    if (result.isError || !repository) return result;
    const context = { ...result.structuredContent, repository };
    const text = JSON.stringify(context);
    if (Buffer.byteLength(text) > MAX_RESULT)
      throw new Error("RESULT_TOO_LARGE");
    return {
      ...result,
      structuredContent: context,
      content: [{ type: "text" as const, text }],
    };
  } catch (error) {
    return {
      isError: true,
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            error: error instanceof Error ? error.message : "BRIDGE_ERROR",
          }),
        },
      ],
    };
  }
}
export async function runMcp(
  project: string,
  stateDirectory: string,
  port: number
) {
  const upstream = await upstreamClient(stateDirectory, port);
  const server = new Server(
    { name: "figma-bridge", version: "0.1.0" },
    {
      capabilities: { tools: {} },
      instructions: `${upstream.getInstructions() ?? ""} Project context is scoped to this MCP adapter. Read design_context for the requested target; use its project's framework and conventions. Project configuration never selects a Figma session.`,
    }
  );
  server.setRequestHandler(ListToolsRequestSchema, () => upstream.listTools());
  server.setRequestHandler(CallToolRequestSchema, (request) =>
    callWithContext(
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
