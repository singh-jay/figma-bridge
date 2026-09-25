import * as v from "valibot";
export declare const prototypeActionSchema: v.VariantSchema<"type", [v.StrictObjectSchema<{
    readonly type: v.LiteralSchema<"BACK", undefined>;
}, undefined>, v.StrictObjectSchema<{
    readonly type: v.LiteralSchema<"CLOSE", undefined>;
}, undefined>, v.StrictObjectSchema<{
    readonly type: v.LiteralSchema<"NODE", undefined>;
    readonly destinationId: v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>, v.RegexAction<string, "Use confirmed node IDs">]>;
    readonly navigation: v.PicklistSchema<["NAVIGATE", "OVERLAY"], undefined>;
    readonly transition: v.NullableSchema<v.StrictObjectSchema<{
        readonly type: v.LiteralSchema<"DISSOLVE", undefined>;
        readonly duration: v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.FiniteAction<number, undefined>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 10, undefined>]>;
        readonly easing: v.StrictObjectSchema<{
            readonly type: v.PicklistSchema<["LINEAR", "EASE_IN", "EASE_OUT", "EASE_IN_AND_OUT"], undefined>;
        }, undefined>;
    }, undefined>, undefined>;
    readonly resetScrollPosition: v.OptionalSchema<v.BooleanSchema<undefined>, true>;
    readonly resetVideoPosition: v.OptionalSchema<v.BooleanSchema<undefined>, false>;
}, undefined>], undefined>;
export declare const reactionSchema: v.StrictObjectSchema<{
    readonly trigger: v.StrictObjectSchema<{
        readonly type: v.LiteralSchema<"ON_CLICK", undefined>;
    }, undefined>;
    readonly actions: v.SchemaWithPipe<readonly [v.ArraySchema<v.VariantSchema<"type", [v.StrictObjectSchema<{
        readonly type: v.LiteralSchema<"BACK", undefined>;
    }, undefined>, v.StrictObjectSchema<{
        readonly type: v.LiteralSchema<"CLOSE", undefined>;
    }, undefined>, v.StrictObjectSchema<{
        readonly type: v.LiteralSchema<"NODE", undefined>;
        readonly destinationId: v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>, v.RegexAction<string, "Use confirmed node IDs">]>;
        readonly navigation: v.PicklistSchema<["NAVIGATE", "OVERLAY"], undefined>;
        readonly transition: v.NullableSchema<v.StrictObjectSchema<{
            readonly type: v.LiteralSchema<"DISSOLVE", undefined>;
            readonly duration: v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.FiniteAction<number, undefined>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 10, undefined>]>;
            readonly easing: v.StrictObjectSchema<{
                readonly type: v.PicklistSchema<["LINEAR", "EASE_IN", "EASE_OUT", "EASE_IN_AND_OUT"], undefined>;
            }, undefined>;
        }, undefined>, undefined>;
        readonly resetScrollPosition: v.OptionalSchema<v.BooleanSchema<undefined>, true>;
        readonly resetVideoPosition: v.OptionalSchema<v.BooleanSchema<undefined>, false>;
    }, undefined>], undefined>, undefined>, v.LengthAction<({
        type: "BACK";
    } | {
        type: "CLOSE";
    } | {
        type: "NODE";
        destinationId: string;
        navigation: "NAVIGATE" | "OVERLAY";
        transition: {
            type: "DISSOLVE";
            duration: number;
            easing: {
                type: "LINEAR" | "EASE_IN" | "EASE_OUT" | "EASE_IN_AND_OUT";
            };
        } | null;
        resetScrollPosition: boolean;
        resetVideoPosition: boolean;
    })[], 1, undefined>]>;
}, undefined>;
export declare const prototypeOperations: readonly [v.StrictObjectSchema<{
    readonly index: v.OptionalSchema<v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.IntegerAction<number, undefined>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 999, undefined>]>, undefined>;
    readonly reaction: v.StrictObjectSchema<{
        readonly trigger: v.StrictObjectSchema<{
            readonly type: v.LiteralSchema<"ON_CLICK", undefined>;
        }, undefined>;
        readonly actions: v.SchemaWithPipe<readonly [v.ArraySchema<v.VariantSchema<"type", [v.StrictObjectSchema<{
            readonly type: v.LiteralSchema<"BACK", undefined>;
        }, undefined>, v.StrictObjectSchema<{
            readonly type: v.LiteralSchema<"CLOSE", undefined>;
        }, undefined>, v.StrictObjectSchema<{
            readonly type: v.LiteralSchema<"NODE", undefined>;
            readonly destinationId: v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>, v.RegexAction<string, "Use confirmed node IDs">]>;
            readonly navigation: v.PicklistSchema<["NAVIGATE", "OVERLAY"], undefined>;
            readonly transition: v.NullableSchema<v.StrictObjectSchema<{
                readonly type: v.LiteralSchema<"DISSOLVE", undefined>;
                readonly duration: v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.FiniteAction<number, undefined>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 10, undefined>]>;
                readonly easing: v.StrictObjectSchema<{
                    readonly type: v.PicklistSchema<["LINEAR", "EASE_IN", "EASE_OUT", "EASE_IN_AND_OUT"], undefined>;
                }, undefined>;
            }, undefined>, undefined>;
            readonly resetScrollPosition: v.OptionalSchema<v.BooleanSchema<undefined>, true>;
            readonly resetVideoPosition: v.OptionalSchema<v.BooleanSchema<undefined>, false>;
        }, undefined>], undefined>, undefined>, v.LengthAction<({
            type: "BACK";
        } | {
            type: "CLOSE";
        } | {
            type: "NODE";
            destinationId: string;
            navigation: "NAVIGATE" | "OVERLAY";
            transition: {
                type: "DISSOLVE";
                duration: number;
                easing: {
                    type: "LINEAR" | "EASE_IN" | "EASE_OUT" | "EASE_IN_AND_OUT";
                };
            } | null;
            resetScrollPosition: boolean;
            resetVideoPosition: boolean;
        })[], 1, undefined>]>;
    }, undefined>;
    readonly nodeId: v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>, v.RegexAction<string, "Use confirmed node IDs">]>;
    readonly expectedFingerprint: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
    readonly type: v.LiteralSchema<"upsert_reaction", undefined>;
}, undefined>, v.StrictObjectSchema<{
    readonly index: v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.IntegerAction<number, undefined>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 999, undefined>]>;
    readonly nodeId: v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>, v.RegexAction<string, "Use confirmed node IDs">]>;
    readonly expectedFingerprint: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
    readonly type: v.LiteralSchema<"remove_reaction", undefined>;
}, undefined>, v.StrictObjectSchema<{
    readonly startNodeId: v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>, v.RegexAction<string, "Use confirmed node IDs">]>;
    readonly name: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
    readonly nodeId: v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>, v.RegexAction<string, "Use confirmed node IDs">]>;
    readonly expectedFingerprint: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
    readonly type: v.LiteralSchema<"upsert_flow_start", undefined>;
}, undefined>, v.StrictObjectSchema<{
    readonly startNodeId: v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>, v.RegexAction<string, "Use confirmed node IDs">]>;
    readonly nodeId: v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>, v.RegexAction<string, "Use confirmed node IDs">]>;
    readonly expectedFingerprint: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
    readonly type: v.LiteralSchema<"remove_flow_start", undefined>;
}, undefined>, v.StrictObjectSchema<{
    readonly patch: v.StrictObjectSchema<{
        readonly overflowDirection: v.PicklistSchema<["NONE", "HORIZONTAL", "VERTICAL", "BOTH"], undefined>;
    }, undefined>;
    readonly nodeId: v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>, v.RegexAction<string, "Use confirmed node IDs">]>;
    readonly expectedFingerprint: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
    readonly type: v.LiteralSchema<"update_prototype_settings", undefined>;
}, undefined>];
export declare const prototypeOperationSchema: v.VariantSchema<"type", readonly [v.StrictObjectSchema<{
    readonly index: v.OptionalSchema<v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.IntegerAction<number, undefined>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 999, undefined>]>, undefined>;
    readonly reaction: v.StrictObjectSchema<{
        readonly trigger: v.StrictObjectSchema<{
            readonly type: v.LiteralSchema<"ON_CLICK", undefined>;
        }, undefined>;
        readonly actions: v.SchemaWithPipe<readonly [v.ArraySchema<v.VariantSchema<"type", [v.StrictObjectSchema<{
            readonly type: v.LiteralSchema<"BACK", undefined>;
        }, undefined>, v.StrictObjectSchema<{
            readonly type: v.LiteralSchema<"CLOSE", undefined>;
        }, undefined>, v.StrictObjectSchema<{
            readonly type: v.LiteralSchema<"NODE", undefined>;
            readonly destinationId: v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>, v.RegexAction<string, "Use confirmed node IDs">]>;
            readonly navigation: v.PicklistSchema<["NAVIGATE", "OVERLAY"], undefined>;
            readonly transition: v.NullableSchema<v.StrictObjectSchema<{
                readonly type: v.LiteralSchema<"DISSOLVE", undefined>;
                readonly duration: v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.FiniteAction<number, undefined>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 10, undefined>]>;
                readonly easing: v.StrictObjectSchema<{
                    readonly type: v.PicklistSchema<["LINEAR", "EASE_IN", "EASE_OUT", "EASE_IN_AND_OUT"], undefined>;
                }, undefined>;
            }, undefined>, undefined>;
            readonly resetScrollPosition: v.OptionalSchema<v.BooleanSchema<undefined>, true>;
            readonly resetVideoPosition: v.OptionalSchema<v.BooleanSchema<undefined>, false>;
        }, undefined>], undefined>, undefined>, v.LengthAction<({
            type: "BACK";
        } | {
            type: "CLOSE";
        } | {
            type: "NODE";
            destinationId: string;
            navigation: "NAVIGATE" | "OVERLAY";
            transition: {
                type: "DISSOLVE";
                duration: number;
                easing: {
                    type: "LINEAR" | "EASE_IN" | "EASE_OUT" | "EASE_IN_AND_OUT";
                };
            } | null;
            resetScrollPosition: boolean;
            resetVideoPosition: boolean;
        })[], 1, undefined>]>;
    }, undefined>;
    readonly nodeId: v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>, v.RegexAction<string, "Use confirmed node IDs">]>;
    readonly expectedFingerprint: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
    readonly type: v.LiteralSchema<"upsert_reaction", undefined>;
}, undefined>, v.StrictObjectSchema<{
    readonly index: v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.IntegerAction<number, undefined>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 999, undefined>]>;
    readonly nodeId: v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>, v.RegexAction<string, "Use confirmed node IDs">]>;
    readonly expectedFingerprint: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
    readonly type: v.LiteralSchema<"remove_reaction", undefined>;
}, undefined>, v.StrictObjectSchema<{
    readonly startNodeId: v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>, v.RegexAction<string, "Use confirmed node IDs">]>;
    readonly name: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
    readonly nodeId: v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>, v.RegexAction<string, "Use confirmed node IDs">]>;
    readonly expectedFingerprint: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
    readonly type: v.LiteralSchema<"upsert_flow_start", undefined>;
}, undefined>, v.StrictObjectSchema<{
    readonly startNodeId: v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>, v.RegexAction<string, "Use confirmed node IDs">]>;
    readonly nodeId: v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>, v.RegexAction<string, "Use confirmed node IDs">]>;
    readonly expectedFingerprint: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
    readonly type: v.LiteralSchema<"remove_flow_start", undefined>;
}, undefined>, v.StrictObjectSchema<{
    readonly patch: v.StrictObjectSchema<{
        readonly overflowDirection: v.PicklistSchema<["NONE", "HORIZONTAL", "VERTICAL", "BOTH"], undefined>;
    }, undefined>;
    readonly nodeId: v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>, v.RegexAction<string, "Use confirmed node IDs">]>;
    readonly expectedFingerprint: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
    readonly type: v.LiteralSchema<"update_prototype_settings", undefined>;
}, undefined>], undefined>;
export type PrototypeOperation = v.InferOutput<typeof prototypeOperationSchema>;
export declare const scenarioSchema: v.StrictObjectSchema<{
    readonly startNodeId: v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>, v.RegexAction<string, "Use confirmed node IDs">]>;
    readonly expectedScreenIds: v.OptionalSchema<v.SchemaWithPipe<readonly [v.ArraySchema<v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>, v.RegexAction<string, "Use confirmed node IDs">]>, undefined>, v.MaxLengthAction<string[], 100, undefined>]>, readonly []>;
    readonly requireExitNodeIds: v.OptionalSchema<v.SchemaWithPipe<readonly [v.ArraySchema<v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>, v.RegexAction<string, "Use confirmed node IDs">]>, undefined>, v.MaxLengthAction<string[], 100, undefined>]>, readonly []>;
}, undefined>;
export declare const prototypeReadEntries: {
    scenario: v.OptionalSchema<v.StrictObjectSchema<{
        readonly startNodeId: v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>, v.RegexAction<string, "Use confirmed node IDs">]>;
        readonly expectedScreenIds: v.OptionalSchema<v.SchemaWithPipe<readonly [v.ArraySchema<v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>, v.RegexAction<string, "Use confirmed node IDs">]>, undefined>, v.MaxLengthAction<string[], 100, undefined>]>, readonly []>;
        readonly requireExitNodeIds: v.OptionalSchema<v.SchemaWithPipe<readonly [v.ArraySchema<v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>, v.RegexAction<string, "Use confirmed node IDs">]>, undefined>, v.MaxLengthAction<string[], 100, undefined>]>, readonly []>;
    }, undefined>, undefined>;
    sessionId: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
    pageId: v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>, v.RegexAction<string, "Use confirmed node IDs">]>;
    nodeIds: v.SchemaWithPipe<readonly [v.ArraySchema<v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>, v.RegexAction<string, "Use confirmed node IDs">]>, undefined>, v.MinLengthAction<string[], 1, undefined>, v.MaxLengthAction<string[], 24, undefined>]>;
    traverseDestinations: v.OptionalSchema<v.BooleanSchema<undefined>, false>;
    maxNodes: v.OptionalSchema<v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.IntegerAction<number, undefined>, v.MinValueAction<number, 1, undefined>, v.MaxValueAction<number, 500, undefined>]>, 100>;
    maxEdges: v.OptionalSchema<v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.IntegerAction<number, undefined>, v.MinValueAction<number, 1, undefined>, v.MaxValueAction<number, 1000, undefined>]>, 200>;
};
export declare const prototypeReadSchema: v.StrictObjectSchema<{
    scenario: v.OptionalSchema<v.StrictObjectSchema<{
        readonly startNodeId: v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>, v.RegexAction<string, "Use confirmed node IDs">]>;
        readonly expectedScreenIds: v.OptionalSchema<v.SchemaWithPipe<readonly [v.ArraySchema<v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>, v.RegexAction<string, "Use confirmed node IDs">]>, undefined>, v.MaxLengthAction<string[], 100, undefined>]>, readonly []>;
        readonly requireExitNodeIds: v.OptionalSchema<v.SchemaWithPipe<readonly [v.ArraySchema<v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>, v.RegexAction<string, "Use confirmed node IDs">]>, undefined>, v.MaxLengthAction<string[], 100, undefined>]>, readonly []>;
    }, undefined>, undefined>;
    sessionId: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
    pageId: v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>, v.RegexAction<string, "Use confirmed node IDs">]>;
    nodeIds: v.SchemaWithPipe<readonly [v.ArraySchema<v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>, v.RegexAction<string, "Use confirmed node IDs">]>, undefined>, v.MinLengthAction<string[], 1, undefined>, v.MaxLengthAction<string[], 24, undefined>]>;
    traverseDestinations: v.OptionalSchema<v.BooleanSchema<undefined>, false>;
    maxNodes: v.OptionalSchema<v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.IntegerAction<number, undefined>, v.MinValueAction<number, 1, undefined>, v.MaxValueAction<number, 500, undefined>]>, 100>;
    maxEdges: v.OptionalSchema<v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.IntegerAction<number, undefined>, v.MinValueAction<number, 1, undefined>, v.MaxValueAction<number, 1000, undefined>]>, 200>;
}, undefined>;
export declare const prototypePlaybackSchema: v.StrictObjectSchema<{
    readonly startNodeId: v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>, v.RegexAction<string, "Use confirmed node IDs">]>;
    readonly prototypeUrl: v.OptionalSchema<v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MaxLengthAction<string, 2048, undefined>, v.RegexAction<string, undefined>]>, undefined>;
    readonly scenario: v.OptionalSchema<v.StrictObjectSchema<{
        readonly startNodeId: v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>, v.RegexAction<string, "Use confirmed node IDs">]>;
        readonly expectedScreenIds: v.OptionalSchema<v.SchemaWithPipe<readonly [v.ArraySchema<v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>, v.RegexAction<string, "Use confirmed node IDs">]>, undefined>, v.MaxLengthAction<string[], 100, undefined>]>, readonly []>;
        readonly requireExitNodeIds: v.OptionalSchema<v.SchemaWithPipe<readonly [v.ArraySchema<v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>, v.RegexAction<string, "Use confirmed node IDs">]>, undefined>, v.MaxLengthAction<string[], 100, undefined>]>, readonly []>;
    }, undefined>, undefined>;
    readonly sessionId: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
    readonly pageId: v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>, v.RegexAction<string, "Use confirmed node IDs">]>;
    readonly nodeIds: v.SchemaWithPipe<readonly [v.ArraySchema<v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>, v.RegexAction<string, "Use confirmed node IDs">]>, undefined>, v.MinLengthAction<string[], 1, undefined>, v.MaxLengthAction<string[], 24, undefined>]>;
    readonly traverseDestinations: v.OptionalSchema<v.BooleanSchema<undefined>, false>;
    readonly maxNodes: v.OptionalSchema<v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.IntegerAction<number, undefined>, v.MinValueAction<number, 1, undefined>, v.MaxValueAction<number, 500, undefined>]>, 100>;
    readonly maxEdges: v.OptionalSchema<v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.IntegerAction<number, undefined>, v.MinValueAction<number, 1, undefined>, v.MaxValueAction<number, 1000, undefined>]>, 200>;
}, undefined>;
export declare const PROTOTYPE_OPERATIONS: ("upsert_reaction" | "remove_reaction" | "upsert_flow_start" | "remove_flow_start" | "update_prototype_settings")[];
