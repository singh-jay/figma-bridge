# Advanced prototype 0.3 verification

Verified on 2026-09-25. This release implements the advanced prototype extensions from the original plan; it does not claim complete Figma API coverage or paid-feature entitlement.

## Delivered

- Hover, press, drag, keyboard and timeout/mouse triggers, retaining native timing and input metadata.
- Smart Animate with preset easing and transitions between existing sibling variants.
- Ordered actions, assignments to existing local variables, variable modes, typed expressions and bounded nested conditionals.
- Recursive destination/resource validation, alias-cycle rejection, bounded dependency snapshots, resource-aware flow fingerprints and detection of changes during reads.
- Per-peer feature negotiation in protocol 3, explicit upgrade rejection and branch-specific evidence IDs. Conditional and variant scenarios require runtime verification; static reachability is not presented as proof.
- Updated skill examples, installation/upgrade guidance and generated package assets.

The [advanced reference](../skills/figma-bridge/references/advanced-prototypes.md) defines the supported schemas and limits. New variable/collection/component creation, remote library imports, custom transition curves, VAR_MODE_LOOKUP and EASING/TIMING values are outside this release.

## Desktop acceptance

Used an isolated loopback service and a separate QA flow in an existing authorized Figma document. All six reactions were written and read back through the MCP transport and native plugin. The final graph was complete, structurally valid and issue-free; the pre/post playback fingerprints matched.

The real Figma presentation UI verified keyboard K navigation, rightward drag navigation, Back, click navigation to a delay screen, automatic delayed navigation without another input, and Smart Animate interpolation. A timestamped Figma-window capture sequence contains intermediate moving-layer positions, the delay screen, and the subsequent destination. This verifies visible motion, not frame-perfect timing.

A native timing mismatch was discovered during acceptance: the published Trigger documentation says milliseconds, but `timeout: 1500` appeared as `1500000ms` in the editor. Replacing it with `timeout: 1.5` displayed `1500ms` and navigated automatically. The public bridge schema and examples use native seconds, with explicit bounds.

The initial durable report remains **blocked** because its controller could not issue pointer-only movement. A follow-up run used an explicitly authorized, window-scoped macOS pointer helper and Figma-window captures. It created a separate interactive-component QA fixture through the native editor, then wrote and read each reaction through the bridge. Seven new reports retain matching pre/post flow fingerprints:

| Interaction | Player result |
| --- | --- |
| Click + CHANGE_TO | Passed: blue IDLE instance switched to green ACTIVE sibling variant. |
| ON_HOVER | Passed: green while hovered, blue again after exit. |
| ON_PRESS | Passed: green while held, blue after release. |
| MOUSE_DOWN | Passed: green before release and still green afterward. |
| MOUSE_UP | Passed: blue during hold, green only after release. |
| MOUSE_ENTER | Inconclusive: one activation was observed, but clean repeats stayed IDLE; persistence/repeatability were not accepted. |
| MOUSE_LEAVE | Inconclusive: usable captures remained IDLE after exit/re-entry. |

The five passed reports contain 12 hashed screenshots and eight required checks. The two inconclusive reports preserve their observations separately. Some native captures had black compositor regions outside a clearly visible control; this is recorded in the affected checks and full native UI observations also confirmed the states. Entirely blank captures were excluded. Figma required an approved restart after a blank-window stall; subsequent focus/rendering instability prevents attributing enter/leave outcomes to either the bridge or account tier.

Live QA found a native setter compatibility issue: mouse-enter/leave reactions reject the legacy `deprecatedVersion: false` field advertised by the plugin typings. The bridge now omits that field when writing those triggers. Both native writes and graph readback then succeeded; a regression test covers both trigger types. This authoring fix does not turn inconclusive playback into a pass.

The account displays Free. Variable assignments, modes, expressions and conditionals have automated validation coverage but no paid-account player acceptance. A successful authoring call would not establish playback entitlement. No plan changes or restriction bypasses were attempted.

Private document identifiers, screenshots, receipts and evidence reports remain ignored local artifacts and are excluded from the published package. The regular project connection was restored to reviewed 0.2 after isolated acceptance.

## Automated verification

The suite passed 49 tests with 240 assertions. It covers trigger metadata, Smart Animate readback, nested references and branch coverage, type/arity/mode errors, local-only resources, default alias dependencies and cycles, dependency races, sibling variants, schema bounds, limited peers and the previous guarded-write/read/report behavior.

Typecheck, format checks, package build and the installed Node tarball verifier are required gates. The tarball verifier exercises installation, skill assets, stdio MCP, capability negotiation, advanced conditional request routing and durable report handling. These checks validate the bridge contract; they do not simulate Figma's rendering or paid runtime behavior.
