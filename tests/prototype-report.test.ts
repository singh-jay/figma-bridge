import { test, expect } from "bun:test";
import {
  mkdtempSync,
  writeFileSync,
  readFileSync,
  symlinkSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  savePrototypeRun,
  evaluatePrototypeRun,
  type PrototypeReportInput,
} from "../src/cli/prototype-report";
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==",
  "base64"
);
function fixture(): PrototypeReportInput {
  return {
    prepared: {
      sessionId: "s",
      generation: "g",
      pageId: "p",
      startNodeId: "a",
      flowFingerprint: "fp",
      complete: true,
      stepsComplete: true,
      structuralStatus: "valid",
      steps: [{ sourceId: "button", reactionIndex: 0, actionIndex: 0 }],
    },
    after: { sessionId: "s", generation: "g", flowFingerprint: "fp" },
    environment: {
      controllerAvailable: true,
      authenticated: true,
      pluginConnected: true,
      documentIdentity: "confirmed",
      observedStartNodeId: "a",
      viewport: { width: 1000, height: 800 },
    },
    requiredChecks: [],
    checks: [
      {
        id: "button/0/0",
        action: "Click Continue",
        expected: "B",
        observed: "B",
        status: "passed",
        observedAt: new Date().toISOString(),
        screenshots: ["screen.png"],
      },
    ],
  };
}
test("evidence bundles persist screenshots, hashes, coverage and observations", () => {
  const root = mkdtempSync(join(tmpdir(), "prototype-report-"));
  try {
    writeFileSync(join(root, "screen.png"), png);
    const input = fixture();
    input.prepared.scenarioStatus = "requires_playback";
    const result = savePrototypeRun(root, input);
    expect(result.status).toBe("passed");
    const report = JSON.parse(readFileSync(result.path, "utf8"));
    expect(report.artifacts[0].sha256).toHaveLength(64);
    expect(
      readFileSync(join(result.path, "..", report.artifacts[0].path))
    ).toEqual(png);
    expect(report.coverage.untested).toEqual([]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
test("missing controller/login/disconnected plugin and wrong or ambiguous document produce blocked reports", () => {
  for (const [key, value, reason] of [
    ["controllerAvailable", false, "CONTROLLER_UNAVAILABLE"],
    ["authenticated", false, "LOGIN_REQUIRED"],
    ["pluginConnected", false, "PLUGIN_DISCONNECTED"],
    ["documentIdentity", "ambiguous", "DOCUMENT_AMBIGUOUS"],
    ["documentIdentity", "mismatch", "DOCUMENT_MISMATCH"],
    ["observedStartNodeId", "other", "START_NOT_CONFIRMED"],
  ] as const) {
    const x = fixture();
    Object.assign(x.environment, { [key]: value });
    const r = evaluatePrototypeRun(x);
    expect(r.status).toBe("blocked");
    expect(r.reasons).toContain(reason);
  }
});
test("changed flow/session, unsupported graph, missing screenshots or unchecked paths cannot pass", () => {
  for (const change of [
    (x: PrototypeReportInput) => {
      x.after!.flowFingerprint = "changed";
    },
    (x: PrototypeReportInput) => {
      x.after!.generation = "new";
    },
    (x: PrototypeReportInput) => {
      delete x.after;
    },
    (x: PrototypeReportInput) => {
      x.prepared.structuralStatus = "inconclusive";
    },
    (x: PrototypeReportInput) => {
      x.checks[0].screenshots = [];
    },
    (x: PrototypeReportInput) => {
      x.requiredChecks = ["scroll"];
    },
    (x: PrototypeReportInput) => {
      x.prepared.stepsComplete = false;
    },
  ]) {
    const x = fixture();
    change(x);
    expect(evaluatePrototypeRun(x).status).toBe("inconclusive");
  }
  const x = fixture();
  x.checks[0].status = "failed";
  expect(evaluatePrototypeRun(x).status).toBe("failed");
  x.checks.push(x.checks[0]);
  expect(() => evaluatePrototypeRun(x)).toThrow("DUPLICATE_CHECK_ID");
});
test("screenshot bundles reject symlinks and non-image data", () => {
  const root = mkdtempSync(join(tmpdir(), "prototype-report-"));
  try {
    writeFileSync(join(root, "target.png"), png);
    symlinkSync(join(root, "target.png"), join(root, "screen.png"));
    expect(() => savePrototypeRun(root, fixture())).toThrow(
      "UNSAFE_SCREENSHOT_PATH"
    );
    rmSync(join(root, "screen.png"));
    writeFileSync(join(root, "screen.png"), "not an image");
    expect(() => savePrototypeRun(root, fixture())).toThrow(
      "SCREENSHOT_MUST_BE_PNG_OR_JPEG"
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("history-dependent scenarios can pass only with complete observed interaction coverage", () => {
  const input = fixture();
  input.prepared.scenarioStatus = "requires_playback";
  expect(evaluatePrototypeRun(input).status).toBe("passed");
  input.checks = [];
  expect(evaluatePrototypeRun(input).status).toBe("inconclusive");
});
