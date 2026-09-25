import { createHash, randomUUID } from "node:crypto";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  writeFileSync,
  openSync,
  closeSync,
  fstatSync,
  constants,
} from "node:fs";
import { join, resolve } from "node:path";

import * as v from "valibot";

const text = v.pipe(v.string(), v.minLength(1), v.maxLength(4096));
const identity = v.pipe(v.string(), v.minLength(1), v.maxLength(200));
const stepSchema = v.looseObject({
  sourceId: identity,
  reactionIndex: v.pipe(v.number(), v.integer(), v.minValue(0)),
  actionPath: v.optional(identity),
  actionIndex: v.pipe(v.number(), v.integer(), v.minValue(0)),
});
const preparedSchema = v.looseObject({
  sessionId: identity,
  generation: identity,
  pageId: identity,
  startNodeId: identity,
  flowFingerprint: identity,
  structuralStatus: v.picklist(["valid", "invalid", "inconclusive"]),
  scenarioStatus: v.optional(
    v.picklist([
      "not_requested",
      "requires_playback",
      "satisfied",
      "warnings",
      "inconclusive",
    ])
  ),
  complete: v.boolean(),
  stepsComplete: v.boolean(),
  steps: v.pipe(v.array(stepSchema), v.maxLength(1000)),
});
export const prototypeReportSchema = v.strictObject({
  prepared: preparedSchema,
  after: v.optional(
    v.looseObject({
      sessionId: identity,
      generation: identity,
      flowFingerprint: identity,
    })
  ),
  environment: v.strictObject({
    controllerAvailable: v.boolean(),
    authenticated: v.boolean(),
    pluginConnected: v.boolean(),
    documentIdentity: v.picklist([
      "confirmed",
      "ambiguous",
      "mismatch",
      "unknown",
    ]),
    observedStartNodeId: v.optional(identity),
    viewport: v.optional(
      v.strictObject({
        width: v.pipe(v.number(), v.integer(), v.minValue(1)),
        height: v.pipe(v.number(), v.integer(), v.minValue(1)),
      })
    ),
  }),
  requiredChecks: v.optional(v.pipe(v.array(identity), v.maxLength(100)), []),
  checks: v.pipe(
    v.array(
      v.strictObject({
        id: identity,
        action: text,
        expected: text,
        observed: text,
        status: v.picklist(["passed", "failed", "blocked", "inconclusive"]),
        observedAt: v.pipe(v.string(), v.isoTimestamp()),
        screenshots: v.pipe(v.array(text), v.maxLength(4)),
        elapsedMs: v.optional(
          v.pipe(v.number(), v.minValue(0), v.maxValue(86400000))
        ),
      })
    ),
    v.maxLength(1000)
  ),
});
export type PrototypeReportInput = v.InferOutput<typeof prototypeReportSchema>;
export const interactionCheckId = (step: v.InferOutput<typeof stepSchema>) =>
  `${step.sourceId}/${step.reactionIndex}/${step.actionPath ?? step.actionIndex}`;

// Observations are supplied by the host controller. This validates evidence and
// coverage, not the truth of a screenshot or a claim about the UI.
export function evaluatePrototypeRun(input: PrototypeReportInput) {
  const { prepared: before, after, environment: env, checks } = input;
  const reasons: string[] = [];
  const required = [
    ...new Set([
      ...before.steps.map(interactionCheckId),
      ...input.requiredChecks,
    ]),
  ];
  const covered = new Set(
    checks.filter((c) => c.status === "passed").map((c) => c.id)
  );
  const untested = required.filter((id) => !covered.has(id));
  if (new Set(checks.map((c) => c.id)).size !== checks.length)
    throw new Error("DUPLICATE_CHECK_ID");
  if (!env.controllerAvailable) reasons.push("CONTROLLER_UNAVAILABLE");
  if (!env.authenticated) reasons.push("LOGIN_REQUIRED");
  if (!env.pluginConnected) reasons.push("PLUGIN_DISCONNECTED");
  if (env.documentIdentity !== "confirmed")
    reasons.push(`DOCUMENT_${env.documentIdentity.toUpperCase()}`);
  if (env.observedStartNodeId !== before.startNodeId)
    reasons.push("START_NOT_CONFIRMED");
  let status = reasons.length ? "blocked" : "passed";
  if (status !== "blocked") {
    if (checks.some((c) => c.status === "failed")) {
      status = "failed";
      reasons.push("CHECK_FAILED");
    } else if (checks.some((c) => c.status === "blocked")) {
      status = "blocked";
      reasons.push("CHECK_BLOCKED");
    } else if (checks.some((c) => c.status === "inconclusive")) {
      status = "inconclusive";
      reasons.push("CHECK_INCONCLUSIVE");
    }
    if (
      !after ||
      after.flowFingerprint !== before.flowFingerprint ||
      after.sessionId !== before.sessionId ||
      after.generation !== before.generation
    ) {
      if (status === "passed") status = "inconclusive";
      reasons.push(
        after ? "FLOW_OR_SESSION_CHANGED" : "POST_RUN_READ_REQUIRED"
      );
    }
    if (
      !before.complete ||
      !before.stepsComplete ||
      before.structuralStatus !== "valid" ||
      before.scenarioStatus === "warnings" ||
      before.scenarioStatus === "inconclusive"
    ) {
      if (status === "passed") status = "inconclusive";
      reasons.push("STRUCTURE_NOT_VERIFIED");
    }
    if (
      untested.length ||
      !checks.length ||
      !env.viewport ||
      checks.some((c) => c.status === "passed" && !c.screenshots.length)
    ) {
      if (status === "passed") status = "inconclusive";
      reasons.push("EVIDENCE_OR_COVERAGE_INCOMPLETE");
    }
  }
  return {
    status,
    reasons,
    coverage: { required, passed: [...covered], untested },
  };
}

function directory(path: string) {
  if (existsSync(path)) {
    if (!lstatSync(path).isDirectory() || realpathSync(path) !== path)
      throw new Error("UNSAFE_EVIDENCE_DIRECTORY");
  } else mkdirSync(path, { mode: 0o700 });
}
export function savePrototypeRun(project: string, raw: unknown) {
  const input = v.parse(prototypeReportSchema, raw);
  const outcome = evaluatePrototypeRun(input);
  const root = realpathSync(project);
  const base = join(root, ".figma-bridge");
  directory(base);
  const runs = join(base, "prototype-runs");
  directory(runs);
  // Validate all inputs before creating a run. Never follow screenshot symlinks.
  const sources = [...new Set(input.checks.flatMap((c) => c.screenshots))];
  if (sources.length > 100) throw new Error("TOO_MANY_SCREENSHOTS");
  let total = 0;
  const files = sources.map((source) => {
    const path = resolve(root, source);
    if (realpathSync(path) !== path) throw new Error("UNSAFE_SCREENSHOT_PATH");
    const fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW);
    try {
      const stat = fstatSync(fd);
      if (!stat.isFile() || stat.size > 10 * 1024 * 1024)
        throw new Error("INVALID_SCREENSHOT_SIZE");
      const bytes = readFileSync(fd);
      total += bytes.length;
      if (total > 100 * 1024 * 1024) throw new Error("EVIDENCE_TOO_LARGE");
      const png = bytes
        .subarray(0, 8)
        .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
      const jpg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
      if (!png && !jpg) throw new Error("SCREENSHOT_MUST_BE_PNG_OR_JPEG");
      return {
        source,
        bytes,
        extension: png ? "png" : "jpg",
        sha256: createHash("sha256").update(bytes).digest("hex"),
      };
    } finally {
      closeSync(fd);
    }
  });
  const runId = randomUUID(),
    output = join(runs, runId);
  directory(output);
  const artifacts = files.map((file, index) => {
    const path = `screenshot-${index + 1}.${file.extension}`;
    writeFileSync(join(output, path), file.bytes, { flag: "wx", mode: 0o600 });
    return {
      source: file.source,
      path,
      sha256: file.sha256,
      bytes: file.bytes.length,
    };
  });
  const report = {
    format: "figma-bridge.prototype-run",
    version: 1,
    runId,
    recordedAt: new Date().toISOString(),
    ...input,
    ...outcome,
    checks: input.checks.map((c) => ({
      ...c,
      screenshots: c.screenshots.map(
        (source) => artifacts.find((a) => a.source === source)!.path
      ),
    })),
    artifacts: artifacts.map(({ source, ...artifact }) => artifact),
  };
  const path = join(output, "report.json");
  writeFileSync(path, JSON.stringify(report, null, 2) + "\n", {
    flag: "wx",
    mode: 0o600,
  });
  return { path, runId, ...outcome, screenshots: artifacts.length };
}
