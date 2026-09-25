# Prototype 0.2 acceptance

Verified 2026-09-25 with the local desktop plugin, a separate loopback service and the real Figma presentation UI in an account displaying Free.

## Delivered

Three bounded read/validation/playback-preparation tools, five guarded prototype operations, reaction-aware fingerprints, peer capability negotiation and protocol-2 upgrade rejection. Writes cover single click/tap navigation, overlays, back/close, instant/dissolve, named starts and overflow settings. Playback uses the host agent’s existing browser/desktop controller through the bundled skill.

## Desktop results

Created an isolated fixture with three screens and one overlay through the real MCP transport and Plugin API. Six reaction writes succeeded. Figma automatically added a flow start during wiring; the subsequent page mutation correctly returned a partial receipt with `STALE_FINGERPRINT`. Inspected the receipt and resumed only the unexecuted flow-start/settings operations with fresh state.

Native reads add `resetScrollPosition`, `resetVideoPosition` and a legacy `action` mirror. The schema recognizes these documented fields, and graph traversal counts the modern actions only once. Regression tests cover this normalization and automatic-start conflict.

The final graph was complete, structurally valid and had no issues. In the real presentation UI, verified A → B, B → C, C → previous B, B → previous A, overlay open, overlay close, and restart from B → configured A. Each result was inspected through a current screenshot; navigation also matched the player’s node URL. The graph fingerprint was identical before and after playback. Existing named starts remained present.

The follow-up acceptance saved 12 actual Figma-window screenshots, controller observations and hashes into a durable local CLI run bundle. All six interactions plus scrolling, restart and dissolve passed, with unchanged pre/post flow fingerprints. Private document identifiers, receipts and screenshots remain ignored and excluded from the published package.

Overflow scrolling was exercised against real offscreen content. A two-second linear dissolve was captured as a timestamped window-image sequence; the observed onset/completion bracket was approximately 1.57–2.17 seconds and included an intermediate blended frame. This is a sampled timing check, not frame-perfect performance measurement.

Scenario validation was verified on real nodes: a separately seeded, disconnected QA frame produced `UNREACHABLE_SCREEN` and `MISSING_EXIT_PATH`, while existing linked screens stayed reachable. Terminal screens produce no exit warning without an explicit exit requirement. BACK/CLOSE require observed history, exposed as `requires_playback` rather than a guaranteed static exit.

Real failure acceptance covered a separate unauthenticated browser session (login required), a player switched to the wrong named flow (unconfirmed start), a disconnected editor plugin (MCP returns `PLUGIN_DISCONNECTED`), and a temporary QA design change (flow mismatch yields an inconclusive report). The design change was restored and the plugin reconnected. Missing-controller and ambiguous/mismatched-document conditions were exercised as controlled inputs through the installed CLI and durable report output; they do not require removing host tools or exposing another real document.

## Automated checks and limits

Unit/integration tests cover unknown reaction preservation, scoped starts, fingerprints, same-page valid destinations, async human edits, cancellation, dry runs, partial receipts, cycles, traversal budgets, URL validation, unsupported schemas and old/limited peers. The Node tarball verifier exercises isolated installation, skill assets, MCP transports, capability reporting and prototype-tool routing.

The installed Node package verifier covers eight successful/blocked/inconclusive outcome cases through the CLI, in addition to transport, routing and install checks. Unit tests cover explicit scenario expectations, incomplete/unsupported coverage, history-dependent exits, evidence coverage, stale sessions, duplicate checks and unsafe image paths.

Browser/desktop automation and an authenticated player are required for playback. Advanced prototype features remain the plan’s later extensions. No paid-feature entitlement or cross-platform live acceptance is inferred from this macOS Free-account run.

## Remaining integration prerequisite

Omni Care remains pinned to its previously reviewed commit. The installation/documentation PR has merged; the prototype PR remains open. The plan requires a reviewed merged prototype commit before upgrading that consumer; the repository owner must merge that PR first. No branch protection or merge authority was changed.
