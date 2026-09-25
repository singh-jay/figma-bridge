import { afterEach, expect, test } from "bun:test";
import {
  mkdtempSync,
  mkdirSync,
  realpathSync,
  writeFileSync,
  rmSync,
  symlinkSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { projectContext } from "../src/project/config";
const dirs: string[] = [];
afterEach(() => {
  for (const p of dirs.splice(0)) rmSync(p, { recursive: true, force: true });
});
function workspace(targets?: unknown) {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), "figma-project-")));
  dirs.push(dir);
  if (targets)
    writeFileSync(
      join(dir, "figma-bridge.config.json"),
      JSON.stringify({ version: 1, targets })
    );
  return dir;
}
test("missing configuration is explicit; different frameworks resolve independently", () => {
  expect(projectContext(workspace()).configured).toBe(false);
  const a = workspace({
    web: { framework: "vue", components: ["src/components"] },
  });
  const b = workspace({ mobile: { framework: "swiftui", components: [] } });
  mkdirSync(join(a, "src/components"), { recursive: true });
  expect(projectContext(a)).toMatchObject({
    framework: "vue",
    target: "web",
    sources: [{ verifiedExists: true }],
  });
  expect(projectContext(b)).toMatchObject({
    framework: "swiftui",
    target: "mobile",
  });
});
test("ambiguous targets require selection and nonexistent references stay unavailable", () => {
  const root = workspace({ a: { tokens: ["missing.css"] }, b: {} });
  expect(projectContext(root)).toMatchObject({ availableTargets: ["a", "b"] });
  expect(projectContext(root, "a")).toMatchObject({
    sources: [{ verifiedExists: false }],
  });
  expect(() => projectContext(root, "not-a-target")).toThrow(
    "PROJECT_TARGET_NOT_FOUND"
  );
});
test("config cannot expose sources outside the project through paths or symlinks", () => {
  expect(() =>
    projectContext(workspace({ web: { components: ["../secret"] } }))
  ).toThrow("PROJECT_PATH_OUTSIDE_ROOT");
  const outside = workspace();
  const root = workspace({ web: { components: ["escape/missing"] } });
  symlinkSync(outside, join(root, "escape"));
  expect(() => projectContext(root)).toThrow("PROJECT_SYMLINK_OUTSIDE_ROOT");
});
