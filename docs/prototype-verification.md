# Prototype 0.2 acceptance

Verified 2026-09-25 with the local desktop plugin, a separate loopback service and the real Figma presentation UI in an account displaying Free.

## Delivered

Three bounded read/validation/playback-preparation tools, five guarded prototype operations, reaction-aware fingerprints, peer capability negotiation and protocol-2 upgrade rejection. Writes cover single click/tap navigation, overlays, back/close, instant/dissolve, named starts and overflow settings. Playback uses the host agent’s existing browser/desktop controller through the bundled skill.

## Desktop results

Created an isolated fixture with three screens and one overlay through the real MCP transport and Plugin API. Six reaction writes succeeded. Figma automatically added a flow start during wiring; the subsequent page mutation correctly returned a partial receipt with `STALE_FINGERPRINT`. Inspected the receipt and resumed only the unexecuted flow-start/settings operations with fresh state.

Native reads add `resetScrollPosition`, `resetVideoPosition` and a legacy `action` mirror. The schema recognizes these documented fields, and graph traversal counts the modern actions only once. Regression tests cover this normalization and automatic-start conflict.

The final graph was complete, structurally valid and had no issues. In the real presentation UI, verified A → B, B → C, C → previous B, B → previous A, overlay open, overlay close, and restart from B → configured A. Each result was inspected through a current screenshot; navigation also matched the player’s node URL. The graph fingerprint was identical before and after playback. Existing named starts remained present.

Screenshots were observed in the agent task; no screenshot files are bundled or claimed as durable CI artifacts. Private document identifiers, receipts and readback evidence remain local and excluded from the package.

## Automated checks and limits

Unit/integration tests cover unknown reaction preservation, scoped starts, fingerprints, same-page valid destinations, async human edits, cancellation, dry runs, partial receipts, cycles, traversal budgets, URL validation, unsupported schemas and old/limited peers. The Node tarball verifier exercises isolated installation, skill assets, MCP transports, capability reporting and prototype-tool routing.

Overflow settings were written and read back. Actual scrolling with overflowing content, advanced interactions and animation timing fidelity were not part of desktop acceptance. No paid-feature entitlement is inferred. Static validation does not prove all screens are reachable or that a scenario has the intended exits; those remain agent scenario checks. Browser/desktop automation and an authenticated player are required for playback.
