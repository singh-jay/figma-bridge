import {
  BridgeError,
  MAX_MESSAGE,
  VERSION,
  parse,
  commandSchema,
} from "../protocol/index";
import { BridgeEngine } from "./engine";
import panel from "./panel.html";

export async function runBridge() {
  const engine = new BridgeEngine(figma);
  let queue = Promise.resolve();
  let queued = 0;
  figma.showUI(panel, {
    width: 360,
    height: 380,
    title: "Figma Bridge",
    themeColors: true,
  });
  await new Promise<void>((resolve) => {
    figma.ui.onmessage = (message: unknown) => {
      if (!message || typeof message !== "object") return;
      const input = message as { type?: string };
      if (input.type === "close") {
        resolve();
        return;
      }
      if (input.type === "metadata") {
        figma.ui.postMessage({
          type: "metadata",
          documentName: figma.root.name,
        });
        return;
      }
      try {
        if (JSON.stringify(message).length > MAX_MESSAGE)
          throw new BridgeError("MESSAGE_TOO_LARGE");
        const command = parse(commandSchema, message);
        if (command.method === "cancel_operation") {
          void engine.dispatch(command.method, command.params).then((result) =>
            figma.ui.postMessage({
              type: "result",
              version: VERSION,
              requestId: command.requestId,
              ok: true,
              result,
            })
          );
          return;
        }
        if (queued >= 16) throw new BridgeError("PLUGIN_BUSY");
        queued++;
        queue = queue.then(async () => {
          try {
            const result = await engine.dispatch(
              command.method,
              command.params
            );
            figma.ui.postMessage({
              type: "result",
              version: VERSION,
              requestId: command.requestId,
              ok: true,
              result,
            });
          } catch (error) {
            figma.ui.postMessage({
              type: "result",
              version: VERSION,
              requestId: command.requestId,
              ok: false,
              error: error instanceof BridgeError ? error.code : "PLUGIN_ERROR",
            });
          } finally {
            queued--;
          }
        });
      } catch {
        figma.ui.postMessage({
          type: "notice",
          message: "Rejected invalid or oversized command.",
        });
      }
    };
  });
  await queue;
}
