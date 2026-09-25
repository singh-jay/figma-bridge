import { test, expect } from "bun:test";
import { createHash } from "node:crypto";
import {
  realpathSync,
  mkdtempSync,
  symlinkSync,
  rmSync,
  readFileSync,
  statSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { saveArtifact } from "../src/bridge/artifacts";
import { credential } from "../src/bridge/state";
test("artifacts verify bytes and reject symlink paths; credentials stay private", () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "bridge-artifact-")));
  try {
    const bytes = Buffer.from("fixture"),
      hash = createHash("sha256").update(bytes).digest("hex");
    const output = saveArtifact(
      join(root, "exports"),
      bytes,
      "image/png",
      hash
    );
    expect(readFileSync(output.path)).toEqual(bytes);
    expect(() =>
      saveArtifact(join(root, "exports"), bytes, "image/png", "wrong")
    ).toThrow();
    symlinkSync(join(root, "exports"), join(root, "link"));
    expect(() =>
      saveArtifact(join(root, "link"), bytes, "image/png", hash)
    ).toThrow();
    credential(join(root, "state"), true);
    expect(statSync(join(root, "state", "credential")).mode & 0o077).toBe(0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
