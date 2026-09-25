import { randomBytes } from "node:crypto";
import {
  chmodSync,
  existsSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  closeSync,
  writeFileSync,
  realpathSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
export const secret = () => randomBytes(32).toString("hex");
export function privateDirectory(directory: string) {
  const target = resolve(directory);
  const parent = dirname(target);
  if (!existsSync(parent)) privateDirectory(parent);
  if (existsSync(target)) {
    if (lstatSync(target).isSymbolicLink() || !lstatSync(target).isDirectory())
      throw new Error("UNSAFE_STATE_DIRECTORY");
  } else mkdirSync(target, { mode: 0o700 });
  if (realpathSync(target) !== target)
    throw new Error("SYMLINKED_STATE_DIRECTORY");
  chmodSync(target, 0o700);
  return target;
}
export function credential(directory: string, create = false) {
  if (create) privateDirectory(directory);
  const file = join(directory, "credential");
  if (!existsSync(file) && create) {
    const fd = openSync(file, "wx", 0o600);
    try {
      writeFileSync(fd, secret());
    } finally {
      closeSync(fd);
    }
  }
  if (!existsSync(file))
    throw new Error("BRIDGE_NOT_INITIALIZED: start the bridge first");
  if (
    realpathSync(directory) !== resolve(directory) ||
    lstatSync(file).isSymbolicLink() ||
    !lstatSync(file).isFile()
  )
    throw new Error("UNSAFE_CREDENTIAL_FILE");
  if ((lstatSync(file).mode & 0o077) !== 0)
    throw new Error("CREDENTIAL_PERMISSIONS_MUST_BE_0600");
  const token = readFileSync(file, "utf8").trim();
  if (!/^[a-f0-9]{64}$/.test(token)) throw new Error("INVALID_CREDENTIAL_FILE");
  return token;
}
