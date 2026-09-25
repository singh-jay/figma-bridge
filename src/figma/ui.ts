import {
  proof,
  tools,
  SUPPORTED_OPERATIONS,
  VERSION,
  PORT,
  MAX_MESSAGE,
  commandSchema,
  replySchema,
  parse,
} from "../protocol/index";
import { PROTOTYPE_FEATURES } from "../protocol/prototype";
const awaiting = new Set<string>();
const status = document.querySelector<HTMLElement>("#status")!;
const activity = document.querySelector<HTMLElement>("#activity")!;
const tokenInput = document.querySelector<HTMLInputElement>("#token")!;
const connect = document.querySelector<HTMLButtonElement>("#connect")!;
const stop = document.querySelector<HTMLButtonElement>("#stop")!;
let socket: WebSocket | undefined,
  token = "",
  nonce = "",
  name = "",
  connected = false,
  stopped = true,
  retry: ReturnType<typeof setTimeout> | undefined;
const note = (message: string) => {
  status.textContent = message;
};
const post = (value: unknown) =>
  parent.postMessage({ pluginMessage: value }, "*");
const verify = (secret: string, challenge: string, value: string) =>
  proof(secret, challenge) === value;
function open() {
  if (stopped) return;
  connected = false;
  nonce = Array.from(crypto.getRandomValues(new Uint8Array(24)), (b) =>
    b.toString(16).padStart(2, "0")
  ).join("");
  note("Connecting…");
  const port = Number("__FIGMA_BRIDGE_PORT__") || PORT;
  const ws = new WebSocket(`ws://localhost:${port}/plugin`);
  socket = ws;
  ws.onopen = () => {
    if (socket !== ws) return;
    ws.send(
      JSON.stringify({
        type: "hello",
        version: VERSION,
        token,
        nonce,
        documentName: name,
        capabilities: Object.keys(tools),
        operations: SUPPORTED_OPERATIONS,
        prototypeFeatures: PROTOTYPE_FEATURES,
      })
    );
  };
  ws.onmessage = async (event) => {
    if (socket !== ws) return;
    try {
      if (typeof event.data !== "string" || event.data.length > MAX_MESSAGE)
        throw new Error();
      const data = JSON.parse(event.data);
      if (data.type === "ready") {
        if (
          data.version !== VERSION ||
          typeof data.token !== "string" ||
          !(await verify(token, nonce, data.proof))
        )
          throw new Error();
        token = data.token;
        connected = true;
        tokenInput.value = "";
        note(`Connected · ${name}`);
        activity.textContent = `Session ${data.sessionId}`;
        return;
      }
      if (!connected) throw new Error();
      if (data.type === "ping") {
        ws.send('{"type":"pong"}');
        return;
      }
      const command = parse(commandSchema, data);
      if (awaiting.size >= 32) throw new Error();
      awaiting.add(command.requestId);
      activity.textContent = `Working: ${command.method}`;
      post(command);
    } catch {
      stopped = true;
      note("Connection rejected. Generate a new pairing token.");
      ws.close();
    }
  };
  ws.onclose = (event) => {
    if (socket !== ws) return;
    if (event.code === 1008) {
      stopped = true;
      note(
        event.reason || "Connection rejected. Refresh plugin and pair again."
      );
    }
    connected = false;
    if (stopped) return;
    note("Disconnected · reconnecting…");
    retry = setTimeout(open, 2000);
  };
  ws.onerror = () =>
    note("Cannot reach the bridge. Check that the local service is running.");
}
window.onmessage = (event) => {
  // Figma desktop relays sandbox messages through its host wrapper; event.source can be null.
  const data = event.data?.pluginMessage;
  if (!data) return;
  if (data.type === "metadata") {
    name = data.documentName;
    return;
  }
  if (data.type === "notice") {
    note(data.message);
    return;
  }
  if (data.type === "result" && !awaiting.has(data.requestId)) return;
  if (data.type === "result") {
    try {
      parse(replySchema, data);
    } catch {
      return;
    }
    awaiting.delete(data.requestId);
  }
  if (
    data.type === "result" &&
    connected &&
    socket?.readyState === WebSocket.OPEN
  ) {
    const message = JSON.stringify(data);
    if (message.length > MAX_MESSAGE) {
      socket.send(
        JSON.stringify({
          type: "result",
          version: VERSION,
          requestId: data.requestId,
          ok: false,
          error: "RESULT_TOO_LARGE",
        })
      );
    } else socket.send(message);
    activity.textContent = data.ok
      ? `Finished · ${data.result?.status ?? "read"}`
      : `Error · ${data.error}`;
  }
};
connect.onclick = () => {
  const value = tokenInput.value.trim();
  if (!/^[a-f0-9]{64}$/.test(value)) {
    note("Paste the pairing token from the local bridge.");
    return;
  }
  stopped = true;
  clearTimeout(retry);
  socket?.close();
  token = value;
  stopped = false;
  open();
};
stop.onclick = () => {
  stopped = true;
  clearTimeout(retry);
  socket?.close();
  note(
    "Disconnected. A running operation may still finish; inspect its receipt before retrying."
  );
};
document.querySelector<HTMLButtonElement>("#close")!.onclick = () => {
  stopped = true;
  socket?.close();
  post({ type: "close" });
};
post({ type: "metadata" });
