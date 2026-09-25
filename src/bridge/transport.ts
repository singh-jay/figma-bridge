import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import { Readable } from "node:stream";

import { WebSocket, WebSocketServer } from "ws";

import { MAX_MESSAGE } from "../protocol/index";

export type BridgeSocket = {
  data: { peerId?: string; timer?: ReturnType<typeof setTimeout> };
  send(text: string): number;
  close(code?: number, reason?: string): void;
};
type Runtime = {
  port: number;
  upgrade(request: Request, options: { data: BridgeSocket["data"] }): boolean;
};
type Options = {
  port: number;
  fetch(request: Request, runtime: Runtime): Promise<Response | undefined>;
  websocket: {
    open(socket: BridgeSocket): void;
    message(socket: BridgeSocket, message: string | Uint8Array): void;
    close(socket: BridgeSocket): void;
  };
};

/** Node transport only; document routing and MCP state live in server.ts. */
export async function createTransport(options: Options) {
  const sockets = new WebSocketServer({
    noServer: true,
    maxPayload: MAX_MESSAGE,
    perMessageDeflate: false,
  });
  let port = 0;
  const request = async (incoming: IncomingMessage) => {
    const headers = new Headers();
    for (let i = 0; i < incoming.rawHeaders.length; i += 2) {
      headers.append(incoming.rawHeaders[i], incoming.rawHeaders[i + 1]);
    }
    const chunks: Buffer[] = [];
    let size = 0;
    for await (const chunk of incoming) {
      const bytes = Buffer.from(chunk);
      size += bytes.length;
      if (size > MAX_MESSAGE) throw new Error("REQUEST_TOO_LARGE");
      chunks.push(bytes);
    }
    return new Request(
      new URL(incoming.url ?? "/", `http://127.0.0.1:${port}`),
      {
        method: incoming.method,
        headers,
        ...(incoming.method === "GET" || incoming.method === "HEAD"
          ? {}
          : { body: Buffer.concat(chunks) }),
      }
    );
  };
  const send = (response: Response, outgoing: ServerResponse) => {
    outgoing.writeHead(response.status, Object.fromEntries(response.headers));
    if (!response.body) return outgoing.end();
    const body = Readable.fromWeb(
      response.body as Parameters<typeof Readable.fromWeb>[0]
    );
    outgoing.on("close", () => body.destroy());
    body.on("error", () => outgoing.destroy());
    body.pipe(outgoing);
  };
  const http = createServer(async (incoming, outgoing) => {
    try {
      const response = await options.fetch(await request(incoming), {
        port,
        upgrade: () => false,
      });
      send(
        response ??
          Response.json({ error: "UPGRADE_REQUIRED" }, { status: 400 }),
        outgoing
      );
    } catch (error) {
      if (!outgoing.headersSent) {
        const tooLarge =
          error instanceof Error && error.message === "REQUEST_TOO_LARGE";
        send(
          Response.json(
            { error: tooLarge ? "REQUEST_TOO_LARGE" : "REQUEST_FAILED" },
            { status: tooLarge ? 413 : 400 }
          ),
          outgoing
        );
      } else outgoing.destroy();
    }
  });
  http.requestTimeout = 120_000;
  http.on("upgrade", async (incoming, rawSocket, head) => {
    let upgraded = false;
    try {
      const headers = new Headers();
      for (let i = 0; i < incoming.rawHeaders.length; i += 2)
        headers.append(incoming.rawHeaders[i], incoming.rawHeaders[i + 1]);
      const req = new Request(
        new URL(incoming.url ?? "/", `http://127.0.0.1:${port}`),
        { headers }
      );
      const response = await options.fetch(req, {
        port,
        upgrade(_req, { data }) {
          sockets.handleUpgrade(incoming, rawSocket, head, (ws) => {
            upgraded = true;
            const wrapped: BridgeSocket = {
              data,
              send(text) {
                if (
                  ws.readyState !== WebSocket.OPEN ||
                  ws.bufferedAmount > MAX_MESSAGE * 2
                ) {
                  ws.close(1013, "Backpressure");
                  return 0;
                }
                ws.send(text, (error) => {
                  if (error) ws.terminate();
                });
                return Buffer.byteLength(text);
              },
              close(code, reason) {
                ws.close(code, reason);
              },
            };
            ws.on("message", (bytes, binary) =>
              options.websocket.message(
                wrapped,
                binary ? new Uint8Array(bytes as Buffer) : bytes.toString()
              )
            );
            ws.on("close", () => options.websocket.close(wrapped));
            ws.on("error", () => ws.terminate());
            options.websocket.open(wrapped);
          });
          return upgraded;
        },
      });
      if (!upgraded) {
        const status = response?.status ?? 400;
        rawSocket.end(
          `HTTP/1.1 ${status} Rejected\r\nConnection: close\r\nContent-Length: 0\r\n\r\n`
        );
      }
    } catch {
      if (!upgraded) rawSocket.destroy();
    }
  });
  await new Promise<void>((resolve, reject) => {
    http.once("error", reject);
    http.listen(options.port, "127.0.0.1", () => {
      const address = http.address();
      if (!address || typeof address === "string")
        return reject(new Error("LISTEN_FAILED"));
      port = address.port;
      http.removeListener("error", reject);
      resolve();
    });
  });
  return {
    port,
    async stop() {
      for (const ws of sockets.clients) ws.terminate();
      await new Promise<void>((resolve) => sockets.close(() => resolve()));
      const closed = new Promise<void>((resolve, reject) =>
        http.close((error) =>
          error &&
          (error as NodeJS.ErrnoException).code !== "ERR_SERVER_NOT_RUNNING"
            ? reject(error)
            : resolve()
        )
      );
      http.closeAllConnections();
      await closed;
    },
  };
}
