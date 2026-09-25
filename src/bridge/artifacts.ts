import { createHash } from "node:crypto";
import { openSync, closeSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { privateDirectory } from "./state";
export function saveArtifact(
  directory: string,
  bytes: Uint8Array,
  mime: string,
  expectedHash: string
) {
  if (bytes.length > 10 * 1024 * 1024) throw new Error("EXPORT_TOO_LARGE");
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  if (sha256 !== expectedHash) throw new Error("EXPORT_HASH_MISMATCH");
  const root = privateDirectory(directory),
    ext =
      mime === "image/png" ? "png" : mime === "image/svg+xml" ? "svg" : "bin";
  const path = join(root, `${crypto.randomUUID()}.${ext}`),
    fd = openSync(path, "wx", 0o600);
  try {
    writeFileSync(fd, bytes);
  } finally {
    closeSync(fd);
  }
  return { path, mime, bytes: bytes.length, sha256 };
}
