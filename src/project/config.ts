import { existsSync, readFileSync, realpathSync, statSync } from "node:fs";
import { isAbsolute, relative, resolve, dirname } from "node:path";

import * as v from "valibot";

const label = v.pipe(v.string(), v.minLength(1), v.maxLength(512));
const paths = v.optional(v.pipe(v.array(label), v.maxLength(32)), []);
export const projectSchema = v.strictObject({
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
      guidance: paths,
    })
  ),
});
export type ProjectConfig = v.InferOutput<typeof projectSchema>;
function contained(root: string, path: string) {
  const rel = relative(root, path);
  return (
    rel !== ".." &&
    !rel.startsWith(".." + (process.platform === "win32" ? "\\" : "/")) &&
    !isAbsolute(rel)
  );
}
function sourcePath(root: string, value: string) {
  if (isAbsolute(value)) throw new Error("PROJECT_PATH_MUST_BE_RELATIVE");
  const path = resolve(root, value);
  if (!contained(root, path)) throw new Error("PROJECT_PATH_OUTSIDE_ROOT");
  let existing = path;
  while (!existsSync(existing) && dirname(existing) !== existing)
    existing = dirname(existing);
  if (!contained(root, realpathSync(existing)))
    throw new Error("PROJECT_SYMLINK_OUTSIDE_ROOT");
  return path;
}
export function projectContext(project: string, target?: string) {
  const root = realpathSync(project);
  if (!statSync(root).isDirectory()) throw new Error("PROJECT_NOT_DIRECTORY");
  const file = resolve(root, "figma-bridge.config.json");
  if (!existsSync(file))
    return {
      configured: false,
      root,
      availableTargets: [],
      missingMappings: [
        "No figma-bridge.config.json; inspect this project's existing code and guidance.",
      ],
    };
  sourcePath(root, "figma-bridge.config.json");
  if (statSync(file).size > 65536) throw new Error("PROJECT_CONFIG_TOO_LARGE");
  const config = v.parse(projectSchema, JSON.parse(readFileSync(file, "utf8")));
  const availableTargets = Object.keys(config.targets);
  if (availableTargets.length > 32) throw new Error("TOO_MANY_PROJECT_TARGETS");
  const selected =
    target ?? (availableTargets.length === 1 ? availableTargets[0] : undefined);
  if (!selected)
    return {
      configured: true,
      root,
      availableTargets,
      missingMappings: [
        "Choose an explicit project target; it does not select a Figma document.",
      ],
    };
  if (!Object.hasOwn(config.targets, selected))
    throw new Error("PROJECT_TARGET_NOT_FOUND");
  const profile = config.targets[selected];
  const targetRoot = sourcePath(root, profile.root);
  // Resolve all references against the target while retaining the project boundary.
  const sources = (["components", "tokens", "guidance"] as const).flatMap(
    (kind) =>
      profile[kind].map((value) => {
        if (isAbsolute(value)) throw new Error("PROJECT_PATH_MUST_BE_RELATIVE");
        const path = sourcePath(
          root,
          relative(root, resolve(targetRoot, value))
        );
        return { kind, path, verifiedExists: existsSync(path) };
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
      "Source existence does not establish a Figma node-to-code identity. Inspect source exports and explicit project contracts before mapping components or tokens.",
    ],
  };
}
