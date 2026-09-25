import * as v from "valibot";

const id = v.pipe(v.string(), v.minLength(1), v.maxLength(200));
const realId = v.pipe(id, v.regex(/^[^$]/, "Use confirmed node IDs"));
const index = v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(999));
const guarded = { nodeId: realId, expectedFingerprint: id };
const transition = v.nullable(
  v.strictObject({
    type: v.literal("DISSOLVE"),
    duration: v.pipe(v.number(), v.finite(), v.minValue(0), v.maxValue(10)),
    easing: v.strictObject({
      type: v.picklist(["LINEAR", "EASE_IN", "EASE_OUT", "EASE_IN_AND_OUT"]),
    }),
  })
);
export const prototypeActionSchema = v.variant("type", [
  v.strictObject({ type: v.literal("BACK") }),
  v.strictObject({ type: v.literal("CLOSE") }),
  v.strictObject({
    type: v.literal("NODE"),
    destinationId: realId,
    navigation: v.picklist(["NAVIGATE", "OVERLAY"]),
    transition,
    resetScrollPosition: v.optional(v.boolean(), true),
    resetVideoPosition: v.optional(v.boolean(), false),
  }),
]);
export const reactionSchema = v.strictObject({
  trigger: v.strictObject({ type: v.literal("ON_CLICK") }),
  actions: v.pipe(v.array(prototypeActionSchema), v.length(1)),
});
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
