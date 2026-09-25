# Prototype authoring and playback plan

Status: MVP implemented and verified, 2026-09-25. The sections below retain the design rationale; see `prototype-verification.md` for delivered scope and acceptance evidence. Scenario-specific reachability/exit expectations remain agent checks, not automated validator guarantees.

## Outcome and boundaries

Extend Figma Bridge so an agent can inspect an explicit prototype flow, wire supported interactions, read its changes back, and exercise the flow in Figma's real presentation UI. Keep the package framework-independent and usable with the existing local Plugin API connection.

The bridge owns structured design reads and writes. The agent's browser/desktop automation owns presentation controls, input and visual observations. The first release must not bundle a second browser runtime or depend on Codex-only tool names. The skill describes the handoff; agents without a suitable browser/desktop tool can still author prototypes and receive manual playback steps, with playback reported as unverified.

This does not imply access to every Figma feature. Figma documents variable-based prototyping, expressions, and multiple actions/conditionals as paid-plan features. Basic navigation and overlay behavior must be accepted on the user's actual Starter account. Do not infer feature entitlement from successful serialization or bypass plan restrictions.

## Findings before implementation

- `src/protocol/index.ts` has strict operation schemas and a 50-operation apply limit, but no prototype operations.
- `src/figma/engine.ts` checks scope, fingerprints, leases and replay receipts. Its snapshots currently omit reactions and flow starting points, so prototype edits would not invalidate fingerprints without additional work.
- `src/bridge/server.ts` currently reports its own tool list as every session's capabilities. A newer server must not advertise prototype writes for an older plugin.
- `src/figma/runtime.ts` serializes plugin commands. Prototype writes can reuse that queue and existing cancellation/receipt handling.
- `figma.fileKey` is restricted to private plugins/Figma-owned resources. A development plugin cannot assume it can obtain a reliable file key.
- Figma exposes `setReactionsAsync` and writable `page.flowStartingPoints`. Several overlay configuration properties are read-only in the installed typings; they cannot simply be added to the general patch allowlist.
- Omni Care already has a bespoke navigation example, but the reusable package must contain no Omni Care fixtures or component assumptions.

## 1. Resolve playback feasibility first

Use an explicitly authorized, isolated frame set in an existing Figma Design file. Create a small three-screen flow and an overlay during implementation acceptance, without creating a new document or page.

Verify click navigation, back, overlay open/close, a flow starting point, and a simple transition on the real account. Open the native presentation UI and prove that the available computer-use tool can interact with the prototype and observe its results while the editor plugin remains connected.

For routing, retain an explicit bridge session and generation. Obtain a prototype link from the user or the observed Figma UI; never construct a file identity from a document name or node ID. Bind that link to the selected session for the run and verify the starting frame visually. If identity cannot be established, request the missing link or use the editor's Present control. Do not enable private Plugin APIs as a shortcut.

This spike settles account support, link handling, login requirements, presentation targeting, and overlay behavior before building a broad API around assumptions.

## 2. Add bounded reads and static flow validation

Proposed tools, all with explicit session routing:

| Tool | Contract |
| --- | --- |
| `figma_bridge_read_prototype` | Read a page's named flow starts and the reactions/prototype properties of explicitly requested nodes or a bounded flow traversal. Include pending IDs, unsupported features and completeness. |
| `figma_bridge_validate_prototype` | Validate an explicitly scoped flow against fresh reads. Return errors and warnings with node/reaction locations; this is structural validation, not a playback result. |
| `figma_bridge_prepare_prototype_playback` | Return the start node, fresh flow fingerprint, confirmed/supplied presentation URL if available, interaction targets and test steps. It does not launch a browser or claim execution. |

Use configurable, capped node/edge budgets and existing message limits. Traverse cycles with a visited set. Follow destinations only within the requested file/page scope; return unresolved destinations explicitly. A truncated graph cannot produce a complete validation result.

Preserve trigger order, action order, transitions, destination references, and unknown reaction data in reads. Expose unsupported write types without rewriting them. Normalize legacy `action` versus `actions` into one interpretation without treating both as separate executions.

Check missing destinations, invalid node/navigation combinations, absent starts, and references beyond the inspected scope. Report unreachable screens or missing exit paths as warnings when relevant to the requested scenario; loops and terminal screens are not automatically errors. Conditional paths are indeterminate until their inputs are known.

## 3. Extend the existing guarded write path

Add typed operations to `figma_bridge_apply`; do not introduce a second unrestricted writer or arbitrary JavaScript execution:

- `upsert_reaction`: append a supported reaction, or replace one explicit reaction index guarded by the current prototype fingerprint. Preserve all other reactions, including unsupported ones.
- `remove_reaction`: remove one explicitly requested, fingerprint-guarded interaction. This does not enable node deletion.
- `upsert_flow_start` / `remove_flow_start`: change one named start on an explicitly leased page while preserving other flow starts and their order.
- `update_prototype_settings`: a narrowly validated allowlist of writable scrolling properties needed by supported scenarios. Read-only overlay settings remain read-only.

Start with click/tap, a single action per reaction, navigate, open overlay, back and close, with instant/dissolve transitions. Validate destination type/page and required fields against the Figma API. Create frames using existing operations, read their real IDs from receipts, then wire them in a subsequent batch; initially reject `$key` references in prototype operations.

Include full reaction/flow state in mutation fingerprints, or add an explicitly required prototype fingerprint alongside node fingerprints. Hash complete state even when read payloads are paginated. Refresh baselines after each mutation. Check destination existence/type/page again immediately before writing; destinations may be references outside the mutation root but must never be modified implicitly. Page flow changes require a page lease.

Reuse the same session, generation, lease, operation ID, dry-run, partial receipts and cancellation rules. Record each completed step only after the awaited Figma call resolves, and read back prototype state. Native calls can fail after preflight: partial/unknown outcomes must retain existing recovery behavior, with no blind replay or automatic rollback over human edits.

## 4. Make capabilities and upgrades explicit

Release as package 0.2.0 with protocol version 2 for the changed peer handshake and fingerprint contract. Keep `figma-bridge.config.json` version 1 and its framework profiles unchanged.

The plugin handshake advertises implemented prototype operations/features. Session capabilities are derived from that peer, not the server's entire tool list. Distinguish implementation support, observed writability and account availability; unavailable or unknown capability must be explicit, with no silent downgrade.

Reject incompatible old peers with an actionable restart/refresh message. Rebuild and ship `dist/`, plugin assets and declarations. Document reinstall/update, `init --force`, service restart, plugin reopen/re-pair and MCP reconnect. Upgrade Omni Care to a reviewed merged commit after standalone acceptance.

## 5. Playback and evidence

Use the configured agent's existing browser/desktop tools to open or select the confirmed Figma presentation. Keep browser authentication in that tool's user-managed session; the bridge must not collect cookies, passwords or browser debugging credentials.

For each test scenario: restart from the confirmed flow start, capture the initial state, perform one observed click/key/scroll action, wait for the transition, and capture the resulting screen or overlay. Prefer accessible targets where available. For canvas content, use screenshot-grounded hit targets and recalibrate after resizing/zoom changes; editor node coordinates are not browser click coordinates.

Do not assume Figma exposes DOM selectors, runtime variable values, the current overlay stack, or animation state through the Plugin API. Treat the player as a visually observed application. Do not use internal Figma endpoints to fill gaps. Static PNG export is an authoring check, not evidence that an interaction played correctly.

Store optional run evidence locally under ignored `.figma-bridge/prototype-runs/<run-id>/`: session/generation, flow fingerprint, viewport, scenario steps, expected outcomes, observations, screenshots and timestamps. A design change invalidates an earlier playback result. Separate statuses: structurally valid, write/readback verified, and playback passed/failed/blocked/inconclusive. Report incomplete scenario coverage explicitly.

Keep external-link actions out of automatic playback unless their destination is part of the requested scenario. Prototypes remain design simulations and cannot establish real backend, payment or authentication behavior.

## 6. Extend the skill and documentation

Update the bundled `figma-bridge` skill to follow: select session → read scoped flow → validate → acquire lease → edit → read back → release → prepare playback → exercise scenario → report evidence. Playback requires a suitable agent tool and may be blocked independently of authoring.

Add README examples for creating a flow, changing an interaction, testing navigation/overlays, and reporting unsupported advanced logic. Document account-dependent features, package versus plugin capabilities, and the separation between static validation and observed behavior.

## 7. Verification and acceptance

- Schema/engine coverage: legal and rejected reactions, preservation of unknown reactions and unrelated starts, invalid destinations, changed source/destination state, out-of-scope mutations, replay, cancellation and lost acknowledgements.
- Read/validator coverage: cycles, missing nodes, bounded traversal, continuation, unsupported actions and incomplete-graph reporting.
- Packaging coverage: clean install outside the source repository, real MCP stdio/HTTP forwarding, protocol mismatch, fresh plugin assets and two independently routed peer sessions.
- Real Starter desktop acceptance: three screens plus overlay; navigate forward/back, open/close overlay, restart at the intended flow, inspect a simple transition, read back changes, and confirm unrelated designs survived. Exercise the actual presentation with screenshots; mocked peers are not playback evidence.
- Verify failed/blocked cases: wrong or ambiguous document, missing player tooling, login required, unsupported feature, stale flow and disconnected plugin.
- Run typecheck, affected tests, build, formatting, packed-install verification and live acceptance. Do not claim cross-platform acceptance from macOS alone.

## Delivery order

1. Feasibility result, prototype reads, scoped static validator, real peer capability handshake.
2. Basic typed authoring, starts, concurrency/recovery coverage and readback.
3. Playback handoff, generic evidence format, skill/README, and end-to-end acceptance. This completes the first useful release; authoring alone does not.
4. Later extensions: hover/drag/key/delay triggers, smart animate and existing-component variant transitions, then account-supported variables, expressions and conditionals. New component/library authoring and unrestricted Figma automation remain separate scope.

Use focused PRs against protected `main`, with the owner performing merges. Keep this prototype feature work separate from the existing installation/documentation PR. This plan itself is local and does not authorize a merge or publication.

## Sources

- [Figma reactions and setReactionsAsync](https://developers.figma.com/docs/plugins/api/properties/nodes-reactions/)
- [Prototype actions](https://developers.figma.com/docs/plugins/api/Action/)
- [Prototype triggers](https://developers.figma.com/docs/plugins/api/Trigger/)
- [Flow starting points](https://developers.figma.com/docs/plugins/api/properties/PageNode-flowstartingpoints/)
- [Plugin API and restricted fileKey](https://developers.figma.com/docs/plugins/api/figma/)
- [Variables in prototypes and plan availability](https://help.figma.com/hc/en-us/articles/14506587589399-Use-variables-in-prototypes)
- [Multiple actions and conditionals](https://help.figma.com/hc/en-us/articles/15253220891799-Multiple-actions-and-conditionals)
