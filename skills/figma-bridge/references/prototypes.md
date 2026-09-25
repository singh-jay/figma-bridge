# Prototype workflow

## Scope and capabilities

Select an explicit session, page and starting screen. Check `figma_bridge_sessions` for the peer’s supported tools and operations. Package 0.2/protocol 2 is required. Report unknown account availability honestly; API support is not proof of plan entitlement. Do not enable private APIs, switch bridges or infer a file key from its name.

Read `figma_bridge_read_prototype` with `sessionId`, `pageId`, `nodeIds` and `traverseDestinations: true` when the requested scenario includes linked destinations. Defaults are 100 nodes and 200 edges; caps are 500 and 1,000. Reads preserve raw reactions, including unsupported data. Follow pending IDs with scoped reads, keeping incomplete coverage explicit; edge-budget exhaustion may require a larger bounded budget. Do not treat separate reads as one atomic snapshot.

`figma_bridge_validate_prototype` returns `structuralStatus` (`valid`, `invalid`, `inconclusive`) and `playbackStatus: "not_run"`. Errors include missing/cross-page/invalid destinations. Unsupported or truncated paths prevent a conclusive result. Terminal screens and cycles can be intentional. Supply caller-defined expectations with optional `scenario`:

```json
{
  "startNodeId": "confirmed-start",
  "expectedScreenIds": ["screen-b", "screen-c"],
  "requireExitNodeIds": ["screen-b"]
}
```

Seed `nodeIds` with the start plus any expected screen that may be disconnected, and enable destination traversal. `UNREACHABLE_SCREEN` and `MISSING_EXIT_PATH` warn only about explicitly declared expectations. Missing/incomplete/unsupported coverage returns an inconclusive scenario instead of a false unreachable claim. Opening an overlay does not count as leaving its underlying screen. BACK/CLOSE require history and return `EXIT_REQUIRES_PLAYBACK_HISTORY` with `scenarioStatus: "requires_playback"`; verify those in the player. These warnings allow preparation, but the evidence report still requires every interaction check to pass. Terminal screens need not appear in `requireExitNodeIds`.

## Guarded authoring

Acquire the existing write lease and use `figma_bridge_apply` with its generation, lease ID and a fresh operation UUID. Use the full current node `fingerprint` as `expectedFingerprint`, not the separate `prototypeFingerprint`. Source fingerprints include reactions, starts and prototype properties. Human changes invalidate them. Use confirmed real IDs: prototype operations reject `$key` creation references.

Supported operation shapes inside `operations`:

```json
{
  "type": "upsert_reaction",
  "nodeId": "confirmed-button-id",
  "expectedFingerprint": "fresh-node-fingerprint",
  "reaction": {
    "trigger": { "type": "ON_CLICK" },
    "actions": [
      {
        "type": "NODE",
        "destinationId": "confirmed-screen-id",
        "navigation": "NAVIGATE",
        "transition": null,
        "resetScrollPosition": true,
        "resetVideoPosition": false
      }
    ]
  }
}
```

Omit `index` to append; supply an existing zero-based `index` to replace exactly one reaction. `remove_reaction` requires that index plus the same guard fields. Unrelated entries stay in place. Read first to avoid duplicate click handlers. The sole action can instead be `{ "type": "BACK" }` or `{ "type": "CLOSE" }`; `navigation: "OVERLAY"` opens a destination overlay. A dissolve transition is `{ "type": "DISSOLVE", "duration": 0.2, "easing": { "type": "EASE_OUT" } }` (seconds, maximum 10). Allowed easing types: `LINEAR`, `EASE_IN`, `EASE_OUT`, `EASE_IN_AND_OUT`.

`upsert_flow_start` takes page `nodeId`, fresh page `expectedFingerprint`, `startNodeId` and `name`; `remove_flow_start` omits `name`. Both require a page lease and preserve other starts. Destinations must be same-page top-level frames, components or instances, optionally within sections.

`update_prototype_settings` takes guarded `nodeId` and `patch: { "overflowDirection": "VERTICAL" }`. Allowed values are `NONE`, `HORIZONTAL`, `VERTICAL`, `BOTH`. Overlay positioning/background settings are readable but are not writable through this API.

Create frames, inspect receipts, wire reactions, **then re-read the page and configure its flow start in a separate batch**. Figma may automatically add starts while wiring. A stale page fingerprint after completed reaction writes is a recoverable partial result: inspect `operation_status` and current state, then submit only remaining changes with fresh guards. Never replay successful steps under new UUIDs. Preflight is not a transaction and does not eliminate native setter failures. Read back all changed interactions/settings and release the lease.

## Real playback

Call `figma_bridge_prepare_prototype_playback` with the read arguments plus `startNodeId` and, optionally, a Figma prototype URL obtained from the user or observed UI. This returns candidate interaction checks, a flow fingerprint and an unexecuted evidence template. The URL remains a hint requiring document confirmation. Candidates are graph edges, not an ordered test script; BACK requires a known navigation history and CLOSE requires an open overlay.

Use the agent’s existing authorized browser/desktop controller. The package neither opens a player nor provides a browser automation runtime. Keep the plugin open in the editor. Confirm the player’s document and starting frame visually; existing presentation tabs may still point at another flow. Select the intended named flow or open its confirmed link.

Restart before independent scenarios. Capture the initial state, act on one accessible or screenshot-observed target, allow the transition to settle, and inspect the resulting screen/overlay. Recalibrate after viewport/zoom changes. Never reuse editor coordinates as player coordinates. An overlay can open without changing the URL, so URL-only checks are insufficient. Test back with established history and restart through the actual player control. Only exercise external-link destinations if part of the requested scope.

Record each action, expected outcome, observation, timestamp and available screenshot reference. If screenshots cannot be saved, record that limitation rather than inventing paths. Keep optional artifacts under ignored `.figma-bridge/prototype-runs/<run-id>/`. Example evidence shape:

```json
{
  "format": "figma-bridge.prototype-run",
  "version": 1,
  "sessionId": "explicit-session",
  "generation": "observed-generation",
  "flowFingerprint": "prepared-fingerprint",
  "startNodeId": "confirmed-start",
  "viewport": { "width": 1280, "height": 800 },
  "status": "not_run",
  "steps": [],
  "coverage": { "tested": [], "untested": [] }
}
```

Statuses are `not_run`, `passed`, `failed`, `blocked`, `inconclusive`. Each executed step should identify its source/reaction, action, expected result, observed result and status. Re-read the same scoped flow after playback; a changed fingerprint makes the earlier run inconclusive. Report structural validation, write/readback and playback separately. Missing tools/login/document identity mean blocked playback, not a pass. Unsupported paths or incomplete coverage remain explicit. A design simulation does not verify real authentication, payments or backend behavior.

For code implementation, return to the project’s configured target, source components and conventions. The prototype provides behavior evidence; it does not select React or any other framework.

## Save a durable evidence bundle

Use `figma-bridge prototype-report --project . --input /absolute/path/run-input.json` after the controller captures the requested screenshots. This command neither captures the screen nor drives the player. Obtain screenshot files through the host controller’s supported export/capture mechanism. Never substitute design exports for player screenshots.

The input schema ships as `schema/prototype-report.schema.json`. Provide:

- `prepared`: the full `prepare_prototype_playback` response, including session/generation.
- `after`: a fresh response from the same preparation arguments after playback (omit if blocked).
- `environment`: `controllerAvailable`, `authenticated`, `pluginConnected`, `documentIdentity` (`confirmed`, `ambiguous`, `mismatch`, `unknown`), `observedStartNodeId`, and `viewport` width/height. These are observed controller facts, not values to assume.
- `checks`: observations with `id`, `action`, `expected`, `observed`, `status`, ISO `observedAt`, and `screenshots` (local PNG/JPEG paths, relative to the project or absolute). Use `<sourceId>/<reactionIndex>/<actionIndex>` as each prepared interaction’s ID. Optional `elapsedMs` records a measured duration.
- `requiredChecks`: optional additional IDs such as `scroll` or `restart`; include corresponding observations in `checks`.

The command copies and hashes screenshots into an immutable run folder under `.figma-bridge/prototype-runs/` and returns its `report.json` path. The saved report contains relative image references, observations, coverage and reasons. Keep `.figma-bridge/` ignored. It rejects duplicate check IDs, symlinked screenshot paths and non-image inputs. Limit: 100 screenshots, 10 MiB each, 100 MiB total.

It computes the outcome: missing controller/login/identity/plugin blocks a run; a changed flow or session, missing post-run read, unsupported structure, untested checks or missing screenshot evidence prevents a pass. It audits submitted evidence, not image semantics or the truth of controller observations. Inspect returned `status`; a successful command exit means the bundle was saved, not that playback passed. Preserve blocked/failed bundles as useful evidence and resolve the actual cause before retesting.
