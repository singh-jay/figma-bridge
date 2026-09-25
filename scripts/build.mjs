import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, chmodSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { build } from "esbuild";
const root = fileURLToPath(new URL("../", import.meta.url));
process.chdir(root);
const ui = await build({
  entryPoints: ["src/figma/ui.ts"],
  bundle: true,
  platform: "browser",
  format: "iife",
  write: false,
});
const html = readFileSync("src/figma/panel.html", "utf8").replace(
  "/* BRIDGE_SCRIPT */",
  () => ui.outputFiles[0].text.replaceAll("</script", "<\\/script")
);
const plugin = {
  name: "panel",
  setup(b) {
    b.onLoad({ filter: /panel\.html$/ }, () => ({
      contents: html,
      loader: "text",
    }));
  },
};
await build({
  entryPoints: ["src/figma/main.ts"],
  outfile: "plugin/code.js",
  bundle: true,
  platform: "browser",
  format: "iife",
  target: "es2020",
  plugins: [plugin],
});
await build({
  entryPoints: {
    "cli/index": "src/cli/index.ts",
    "bridge/server": "src/bridge/server.ts",
    "cli/adapter": "src/cli/adapter.ts",
    "project/config": "src/project/config.ts",
    protocol: "src/protocol/index.ts",
  },
  outdir: "dist",
  bundle: true,
  packages: "external",
  platform: "node",
  format: "esm",
  target: "node22",
});
await build({
  entryPoints: {
    figma: "src/figma/index.ts",
    serialize: "src/figma/serialize.ts",
  },
  outdir: "dist",
  bundle: true,
  platform: "browser",
  format: "esm",
  target: "es2020",
  plugins: [plugin],
});
execFileSync(
  process.execPath,
  [resolve("node_modules/typescript/bin/tsc"), "-p", "tsconfig.json"],
  { stdio: "inherit" }
);
chmodSync("dist/cli/index.js", 0o755);
const { toJsonSchema } = await import("@valibot/to-json-schema");
const { projectSchema } = await import("../dist/project/config.js");
mkdirSync("schema", { recursive: true });
writeFileSync(
  "schema/project.schema.json",
  JSON.stringify(toJsonSchema(projectSchema), null, 2) + "\n"
);
console.log(
  "Built Node CLI, reusable modules, standalone Figma plugin and project schema."
);
