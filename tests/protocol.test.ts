import { test, expect } from "bun:test";
import { createHash, createHmac } from "node:crypto";

import {
  utf8,
  proof,
  bytesHash,
  canonical,
  parse,
  tools,
} from "../src/protocol/index";
test("sandbox hashes match native Unicode encoding and HMAC", () => {
  const text = "مرحبا 🌍 \ud800";
  expect(bytesHash(utf8(text))).toBe(
    createHash("sha256").update(text).digest("hex")
  );
  expect(proof("secret", "nonce")).toBe(
    createHmac("sha256", "secret").update("nonce").digest("hex")
  );
  expect(canonical({ z: 1, a: 2 })).toBe(canonical({ a: 2, z: 1 }));
});
test("operations are strict, bounded and cannot carry executable code", () => {
  expect(() =>
    parse(tools.apply.schema, {
      sessionId: "s",
      generation: "g",
      leaseId: "l",
      operationId: crypto.randomUUID(),
      operations: [{ type: "eval", code: "figma.root.remove()" }],
    })
  ).toThrow();
  expect(() =>
    parse(tools.read_nodes.schema, {
      sessionId: "s",
      nodeIds: ["x"],
      maxNodes: 100000,
    })
  ).toThrow();
});
