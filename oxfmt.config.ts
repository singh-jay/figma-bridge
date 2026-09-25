import { defineConfig } from "oxfmt";
import preset from "ultracite/oxfmt";
export default defineConfig({
  ...preset,
  ignorePatterns: [
    "node_modules/**",
    "dist/**",
    "plugin/code.js",
    "schema/**",
    "package-lock.json",
  ],
});
