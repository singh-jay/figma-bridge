import { runBridge } from "./runtime";
void runBridge()
  .then(() => figma.closePlugin())
  .catch((error) => figma.closePlugin(String(error)));
