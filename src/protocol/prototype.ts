import * as v from "valibot";

const id = v.pipe(v.string(), v.minLength(1), v.maxLength(200));
const realId = v.pipe(id, v.regex(/^[^$]/, "Use confirmed node IDs"));
const index = v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(999));
const guarded = { nodeId: realId, expectedFingerprint: id };
const seconds = v.pipe(v.number(), v.minValue(0), v.maxValue(10));
const triggerSeconds = v.pipe(
  v.number(),
  v.minValue(0),
  v.maxValue(60),
  v.description(
    "Seconds in the native Plugin API; 1.5 is 1500ms in the Figma editor"
  )
);
const transition = v.nullable(
  v.strictObject({
    type: v.picklist(["DISSOLVE", "SMART_ANIMATE"]),
    duration: seconds,
    easing: v.strictObject({
      type: v.picklist([
        "LINEAR",
        "EASE_IN",
        "EASE_OUT",
        "EASE_IN_AND_OUT",
        "EASE_IN_BACK",
        "EASE_OUT_BACK",
        "EASE_IN_AND_OUT_BACK",
        "GENTLE",
        "QUICK",
        "BOUNCY",
        "SLOW",
      ]),
    }),
  })
);
export const triggerSchema = v.variant("type", [
  v.strictObject({
    type: v.picklist(["ON_CLICK", "ON_HOVER", "ON_PRESS", "ON_DRAG"]),
  }),
  v.strictObject({ type: v.literal("AFTER_TIMEOUT"), timeout: triggerSeconds }),
  v.strictObject({
    type: v.picklist(["MOUSE_UP", "MOUSE_DOWN"]),
    delay: triggerSeconds,
  }),
  v.strictObject({
    type: v.picklist(["MOUSE_ENTER", "MOUSE_LEAVE"]),
    delay: triggerSeconds,
    deprecatedVersion: v.optional(v.literal(false), false),
  }),
  v.strictObject({
    type: v.literal("ON_KEY_DOWN"),
    device: v.literal("KEYBOARD"),
    keyCodes: v.pipe(
      v.array(v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(255))),
      v.minLength(1),
      v.maxLength(4),
      v.check((keys) => new Set(keys).size === keys.length, "Duplicate keys")
    ),
  }),
]);
export type PrototypeValue = {
  type:
    | "BOOLEAN"
    | "FLOAT"
    | "STRING"
    | "COLOR"
    | "VARIABLE_ALIAS"
    | "EXPRESSION";
  resolvedType: "BOOLEAN" | "FLOAT" | "STRING" | "COLOR";
  value:
    | boolean
    | number
    | string
    | { r: number; g: number; b: number; a?: number }
    | { type: "VARIABLE_ALIAS"; id: string }
    | { expressionFunction: string; expressionArguments: PrototypeValue[] };
};
const resolved = v.picklist(["BOOLEAN", "FLOAT", "STRING", "COLOR"]);
const channel = v.pipe(v.number(), v.minValue(0), v.maxValue(1));
function valueSchema(depth: number): v.GenericSchema<PrototypeValue> {
  const literals = [
    v.strictObject({
      type: v.literal("BOOLEAN"),
      resolvedType: v.literal("BOOLEAN"),
      value: v.boolean(),
    }),
    v.strictObject({
      type: v.literal("FLOAT"),
      resolvedType: v.literal("FLOAT"),
      value: v.pipe(v.number(), v.minValue(-1e12), v.maxValue(1e12)),
    }),
    v.strictObject({
      type: v.literal("STRING"),
      resolvedType: v.literal("STRING"),
      value: v.pipe(v.string(), v.maxLength(4096)),
    }),
    v.strictObject({
      type: v.literal("COLOR"),
      resolvedType: v.literal("COLOR"),
      value: v.strictObject({
        r: channel,
        g: channel,
        b: channel,
        a: v.optional(channel),
      }),
    }),
    v.strictObject({
      type: v.literal("VARIABLE_ALIAS"),
      resolvedType: resolved,
      value: v.strictObject({ type: v.literal("VARIABLE_ALIAS"), id: realId }),
    }),
  ] as const;
  if (!depth) return v.union(literals);
  return v.union([
    ...literals,
    v.strictObject({
      type: v.literal("EXPRESSION"),
      resolvedType: resolved,
      value: v.strictObject({
        expressionFunction: v.picklist([
          "ADDITION",
          "SUBTRACTION",
          "MULTIPLICATION",
          "DIVISION",
          "EQUALS",
          "NOT_EQUAL",
          "LESS_THAN",
          "LESS_THAN_OR_EQUAL",
          "GREATER_THAN",
          "GREATER_THAN_OR_EQUAL",
          "AND",
          "OR",
          "NEGATE",
          "NOT",
        ]),
        expressionArguments: v.pipe(
          v.array(valueSchema(depth - 1)),
          v.minLength(1),
          v.maxLength(2)
        ),
      }),
    }),
  ]);
}
export const prototypeValueSchema = valueSchema(4);
export type PrototypeAction =
  | { type: "BACK" | "CLOSE" }
  | {
      type: "NODE";
      destinationId: string;
      navigation: "NAVIGATE" | "OVERLAY" | "CHANGE_TO";
      transition: v.InferOutput<typeof transition>;
      resetScrollPosition?: boolean;
      resetVideoPosition?: boolean;
    }
  | { type: "SET_VARIABLE"; variableId: string; variableValue: PrototypeValue }
  | {
      type: "SET_VARIABLE_MODE";
      variableCollectionId: string;
      variableModeId: string;
    }
  | {
      type: "CONDITIONAL";
      conditionalBlocks: {
        condition?: PrototypeValue;
        actions: PrototypeAction[];
      }[];
    };
function actionSchema(depth: number): v.GenericSchema<PrototypeAction> {
  const leaves = [
    v.strictObject({ type: v.picklist(["BACK", "CLOSE"]) }),
    v.strictObject({
      type: v.literal("NODE"),
      destinationId: realId,
      navigation: v.picklist(["NAVIGATE", "OVERLAY", "CHANGE_TO"]),
      transition,
      resetScrollPosition: v.optional(v.boolean(), true),
      resetVideoPosition: v.optional(v.boolean(), false),
    }),
    v.strictObject({
      type: v.literal("SET_VARIABLE"),
      variableId: realId,
      variableValue: prototypeValueSchema,
    }),
    v.strictObject({
      type: v.literal("SET_VARIABLE_MODE"),
      variableCollectionId: realId,
      variableModeId: realId,
    }),
  ] as const;
  if (!depth) return v.union(leaves);
  return v.union([
    ...leaves,
    v.strictObject({
      type: v.literal("CONDITIONAL"),
      conditionalBlocks: v.pipe(
        v.array(
          v.strictObject({
            condition: v.optional(prototypeValueSchema),
            actions: v.pipe(
              v.array(actionSchema(depth - 1)),
              v.minLength(1),
              v.maxLength(16)
            ),
          })
        ),
        v.minLength(1),
        v.maxLength(8),
        v.check(
          (blocks) =>
            blocks.every(
              (block, i) =>
                block.condition !== undefined || i === blocks.length - 1
            ),
          "Else must be last"
        )
      ),
    }),
  ]);
}
export const prototypeActionSchema = actionSchema(3);
export function actionCount(actions: PrototypeAction[]): number {
  return actions.reduce(
    (count, action) =>
      count +
      1 +
      (action.type === "CONDITIONAL"
        ? action.conditionalBlocks.reduce(
            (n, b) => n + actionCount(b.actions),
            0
          )
        : 0),
    0
  );
}
export const reactionSchema = v.pipe(
  v.strictObject({
    trigger: triggerSchema,
    actions: v.pipe(
      v.array(prototypeActionSchema),
      v.minLength(1),
      v.maxLength(16)
    ),
  }),
  v.check(
    (reaction) => actionCount(reaction.actions) <= 64,
    "At most 64 actions per reaction"
  )
);
export const PROTOTYPE_FEATURES = [
  "advanced_triggers",
  "smart_animate",
  "change_to",
  "multiple_actions",
  "variable_actions",
  "expressions",
  "conditionals",
] as const;
export const prototypeOperations = [
  v.strictObject({
    type: v.literal("upsert_reaction"),
    ...guarded,
    index: v.optional(index),
    reaction: reactionSchema,
  }),
  v.strictObject({ type: v.literal("remove_reaction"), ...guarded, index }),
  v.strictObject({
    type: v.literal("upsert_flow_start"),
    ...guarded,
    startNodeId: realId,
    name: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
  }),
  v.strictObject({
    type: v.literal("remove_flow_start"),
    ...guarded,
    startNodeId: realId,
  }),
  v.strictObject({
    type: v.literal("update_prototype_settings"),
    ...guarded,
    patch: v.strictObject({
      overflowDirection: v.picklist(["NONE", "HORIZONTAL", "VERTICAL", "BOTH"]),
    }),
  }),
] as const;
export const prototypeOperationSchema = v.variant("type", prototypeOperations);
export type PrototypeOperation = v.InferOutput<typeof prototypeOperationSchema>;
export const scenarioSchema = v.strictObject({
  startNodeId: realId,
  expectedScreenIds: v.optional(v.pipe(v.array(realId), v.maxLength(100)), []),
  requireExitNodeIds: v.optional(v.pipe(v.array(realId), v.maxLength(100)), []),
});
export const prototypeReadEntries = {
  scenario: v.optional(scenarioSchema),
  sessionId: id,
  pageId: realId,
  nodeIds: v.pipe(v.array(realId), v.minLength(1), v.maxLength(24)),
  traverseDestinations: v.optional(v.boolean(), false),
  maxNodes: v.optional(
    v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(500)),
    100
  ),
  maxEdges: v.optional(
    v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(1000)),
    200
  ),
};
export const prototypeReadSchema = v.strictObject(prototypeReadEntries);
export const prototypePlaybackSchema = v.strictObject({
  ...prototypeReadEntries,
  startNodeId: realId,
  // A supplied URL is a routing hint, never proof of document identity.
  prototypeUrl: v.optional(
    v.pipe(
      v.string(),
      v.maxLength(2048),
      v.regex(
        /^https:\/\/(?:www\.)?figma\.com\/proto\/[A-Za-z0-9]+(?:\/[^\s?#]*)?(?:\?[^\s#]*)?(?:#[^\s]*)?$/
      )
    )
  ),
});
export const PROTOTYPE_OPERATIONS = prototypeOperations.map(
  (schema) => schema.entries.type.literal
);

export function reactionFeatures(
  reaction: v.InferOutput<typeof reactionSchema>
): string[] {
  const required = new Set<string>();
  if (reaction.trigger.type !== "ON_CLICK") required.add("advanced_triggers");
  const values = (value: PrototypeValue) => {
    if (value.type === "EXPRESSION") required.add("expressions");
  };
  const visit = (actions: PrototypeAction[]) => {
    if (actions.length > 1) required.add("multiple_actions");
    for (const action of actions) {
      if (action.type === "NODE") {
        if (action.navigation === "CHANGE_TO") required.add("change_to");
        if (action.transition?.type === "SMART_ANIMATE")
          required.add("smart_animate");
      } else if (action.type === "SET_VARIABLE") {
        required.add("variable_actions");
        values(action.variableValue);
      } else if (action.type === "SET_VARIABLE_MODE")
        required.add("variable_actions");
      else if (action.type === "CONDITIONAL") {
        required.add("conditionals");
        for (const block of action.conditionalBlocks) {
          if (block.condition) values(block.condition);
          visit(block.actions);
        }
      }
    }
  };
  visit(reaction.actions);
  return [...required];
}
