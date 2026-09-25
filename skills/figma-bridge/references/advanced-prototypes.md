# Advanced prototypes (0.3 / protocol 3)

Read the base [prototype workflow](prototypes.md) first. Retain explicit session, page, scope lease and fresh fingerprints. Check `sessions[].prototypeFeatures`: `advanced_triggers`, `smart_animate`, `change_to`, `multiple_actions`, `variable_actions`, `expressions`, `conditionals`. Features describe the connected plugin implementation; `accountAvailability` remains unknown. Native setter failures retain ordinary partial-receipt recovery. Do not infer paid feature entitlement from a successful write.

## Triggers and motion

`upsert_reaction.reaction.trigger` supports:

- `{ "type": "ON_HOVER" }`, `ON_PRESS`, `ON_DRAG`, and existing `ON_CLICK`.
- `{ "type": "ON_KEY_DOWN", "device": "KEYBOARD", "keyCodes": [75] }` for K. Use 1–4 distinct native keyboard codes (0–255); do not substitute text characters or controller buttons.
- `{ "type": "AFTER_TIMEOUT", "timeout": 1.5 }` for a 1500ms delay.
- `{ "type": "MOUSE_ENTER", "delay": 0.1 }`, also `MOUSE_LEAVE`. The optional legacy `deprecatedVersion: false` input is accepted but omitted from native writes because the current Figma setter rejects it.
- `{ "type": "MOUSE_DOWN", "delay": 0.1 }`, also `MOUSE_UP`.

**Timing fields use seconds.** Trigger `timeout`/`delay` accept 0–60 seconds; transition `duration` accepts 0–10 seconds. The published Trigger documentation says milliseconds, but desktop acceptance confirmed that native `timeout: 1.5` displays as `1500ms`, whereas `1500` displays as `1500000ms`. Check the editor and actual playback when integrating other Figma versions.

Use `transition: { "type": "SMART_ANIMATE", "duration": 0.6, "easing": { "type": "LINEAR" } }`. Layer matching is Figma's responsibility: matching names/hierarchy improve results; readback alone cannot prove interpolation. Easing supports LINEAR, EASE_IN, EASE_OUT, EASE_IN_AND_OUT, the three corresponding BACK curves, GENTLE, QUICK, BOUNCY and SLOW. Custom curves and directional transitions remain read-only.

`navigation: "CHANGE_TO"` targets an existing sibling component variant. The source must be inside a component or instance whose main component belongs to that same set; the destination must be a different COMPONENT in the same set and page. This does not create components or component sets, import libraries, or swap arbitrary instances.

## Variable actions and expressions

Use confirmed existing **local** variable and collection IDs from scoped design/resource reads. This API authors runtime assignments; it does not change design defaults or create variable collections. Imported/remote or unavailable references are rejected explicitly.

A reaction may contain 1–16 ordered actions, with at most 64 including nested actions:

```json
{
  "trigger": { "type": "ON_CLICK" },
  "actions": [
    {
      "type": "SET_VARIABLE",
      "variableId": "confirmed-boolean-variable-id",
      "variableValue": {
        "type": "BOOLEAN",
        "resolvedType": "BOOLEAN",
        "value": true
      }
    },
    {
      "type": "NODE",
      "destinationId": "confirmed-screen-id",
      "navigation": "NAVIGATE",
      "transition": null
    }
  ]
}
```

Values require `type`, `resolvedType`, and `value`. Literal BOOLEAN, FLOAT, STRING and COLOR values must match their resolved type. COLOR uses `{r,g,b,a?}` channels from 0 to 1. Alias values use `{ "type": "VARIABLE_ALIAS", "resolvedType": "BOOLEAN", "value": { "type": "VARIABLE_ALIAS", "id": "confirmed-id" } }`; actual variable types are checked.

Expressions are typed data, never JavaScript:

```json
{
  "type": "EXPRESSION",
  "resolvedType": "BOOLEAN",
  "value": {
    "expressionFunction": "NOT",
    "expressionArguments": [
      {
        "type": "VARIABLE_ALIAS",
        "resolvedType": "BOOLEAN",
        "value": { "type": "VARIABLE_ALIAS", "id": "confirmed-boolean-id" }
      }
    ]
  }
}
```

Supported functions: ADDITION, SUBTRACTION, MULTIPLICATION, DIVISION, EQUALS, NOT_EQUAL, LESS_THAN, LESS_THAN_OR_EQUAL, GREATER_THAN, GREATER_THAN_OR_EQUAL, AND, OR, NEGATE, NOT. Unary functions take one argument, others two. Arithmetic requires FLOAT; ADDITION also accepts two STRING operands. Logical operators require BOOLEAN; equality requires matching types. Declared output types must match. Literal division by zero is rejected. Expressions nest at most four levels. VAR_MODE_LOOKUP and EASING/TIMING variable values remain unsupported.

`{ "type": "SET_VARIABLE_MODE", "variableCollectionId": "confirmed-collection-id", "variableModeId": "confirmed-mode-id" }` validates that the existing mode belongs to the local collection.

## Conditionals and playback coverage

A conditional contains 1–8 ordered blocks. Each block has `condition` (a BOOLEAN value/alias/expression) and `actions`; omit `condition` only for a final else block. Nested conditionals are limited to three levels. Every nested destination and resource reference is validated before writing.

```json
{
  "type": "CONDITIONAL",
  "conditionalBlocks": [
    {
      "condition": {
        "type": "VARIABLE_ALIAS",
        "resolvedType": "BOOLEAN",
        "value": { "type": "VARIABLE_ALIAS", "id": "confirmed-boolean-id" }
      },
      "actions": [
        {
          "type": "NODE",
          "destinationId": "confirmed-screen-id",
          "navigation": "NAVIGATE",
          "transition": null
        }
      ]
    },
    { "actions": [{ "type": "BACK" }] }
  ]
}
```

Reads retain raw reactions and return nested action paths, branch checks (including implicit no-op else), trigger details, and bounded design-time dependency snapshots. These snapshots affect the flow fingerprint; they are **not live player variable state**. Static scenario reachability/exit checks report `requires_playback` for conditional/variant flows because actual paths depend on runtime state.

Prepared check IDs use `<sourceId>/<reactionIndex>/<actionPath>` when `actionPath` exists (otherwise the legacy actionIndex). For example `button/0/1/branch/0/0` identifies the first action of the first branch in top-level action 1. Use the exact returned paths; do not manufacture IDs. Every prepared branch/action requires its own observation. A single successful branch cannot satisfy the others.

Before each branch test, restart and establish its variable inputs through the real player. Record those inputs, the action order and visible effects. Observe assignments through bound layers or subsequent conditional behavior; never claim a plugin read exposes live runtime values. A missing controller gesture, paid-plan restriction, unobservable effect or unreachable test branch prevents a full pass. Hover/press also require verifying release/revert behavior. Delay checks must observe automatic navigation without another user input; motion checks need intermediate frames, not only endpoints.

Figma documents variables, expressions and conditional prototypes as paid features. Do not change the account plan or attempt to bypass restrictions. Report unavailable playback separately from supported authoring and automated validation.

Sources: [Trigger](https://developers.figma.com/docs/plugins/api/Trigger/), [Action](https://developers.figma.com/docs/plugins/api/Action/), [Transition](https://developers.figma.com/docs/plugins/api/Transition/), [paid prototype features](https://help.figma.com/hc/en-us/articles/360040328273-Figma-plans-and-features).
