import * as v from "valibot";
declare const transition: v.NullableSchema<v.StrictObjectSchema<{
    readonly type: v.PicklistSchema<["DISSOLVE", "SMART_ANIMATE"], undefined>;
    readonly duration: v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 10, undefined>]>;
    readonly easing: v.StrictObjectSchema<{
        readonly type: v.PicklistSchema<["LINEAR", "EASE_IN", "EASE_OUT", "EASE_IN_AND_OUT", "EASE_IN_BACK", "EASE_OUT_BACK", "EASE_IN_AND_OUT_BACK", "GENTLE", "QUICK", "BOUNCY", "SLOW"], undefined>;
    }, undefined>;
}, undefined>, undefined>;
export declare const triggerSchema: v.VariantSchema<"type", [v.StrictObjectSchema<{
    readonly type: v.PicklistSchema<["ON_CLICK", "ON_HOVER", "ON_PRESS", "ON_DRAG"], undefined>;
}, undefined>, v.StrictObjectSchema<{
    readonly type: v.LiteralSchema<"AFTER_TIMEOUT", undefined>;
    readonly timeout: v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 60, undefined>, v.DescriptionAction<number, "Seconds in the native Plugin API; 1.5 is 1500ms in the Figma editor">]>;
}, undefined>, v.StrictObjectSchema<{
    readonly type: v.PicklistSchema<["MOUSE_UP", "MOUSE_DOWN"], undefined>;
    readonly delay: v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 60, undefined>, v.DescriptionAction<number, "Seconds in the native Plugin API; 1.5 is 1500ms in the Figma editor">]>;
}, undefined>, v.StrictObjectSchema<{
    readonly type: v.PicklistSchema<["MOUSE_ENTER", "MOUSE_LEAVE"], undefined>;
    readonly delay: v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 60, undefined>, v.DescriptionAction<number, "Seconds in the native Plugin API; 1.5 is 1500ms in the Figma editor">]>;
    readonly deprecatedVersion: v.OptionalSchema<v.LiteralSchema<false, undefined>, false>;
}, undefined>, v.StrictObjectSchema<{
    readonly type: v.LiteralSchema<"ON_KEY_DOWN", undefined>;
    readonly device: v.LiteralSchema<"KEYBOARD", undefined>;
    readonly keyCodes: v.SchemaWithPipe<readonly [v.ArraySchema<v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.IntegerAction<number, undefined>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 255, undefined>]>, undefined>, v.MinLengthAction<number[], 1, undefined>, v.MaxLengthAction<number[], 4, undefined>, v.CheckAction<number[], "Duplicate keys">]>;
}, undefined>], undefined>;
export type PrototypeValue = {
    type: "BOOLEAN" | "FLOAT" | "STRING" | "COLOR" | "VARIABLE_ALIAS" | "EXPRESSION";
    resolvedType: "BOOLEAN" | "FLOAT" | "STRING" | "COLOR";
    value: boolean | number | string | {
        r: number;
        g: number;
        b: number;
        a?: number;
    } | {
        type: "VARIABLE_ALIAS";
        id: string;
    } | {
        expressionFunction: string;
        expressionArguments: PrototypeValue[];
    };
};
export declare const prototypeValueSchema: v.GenericSchema<PrototypeValue>;
export type PrototypeAction = {
    type: "BACK" | "CLOSE";
} | {
    type: "NODE";
    destinationId: string;
    navigation: "NAVIGATE" | "OVERLAY" | "CHANGE_TO";
    transition: v.InferOutput<typeof transition>;
    resetScrollPosition?: boolean;
    resetVideoPosition?: boolean;
} | {
    type: "SET_VARIABLE";
    variableId: string;
    variableValue: PrototypeValue;
} | {
    type: "SET_VARIABLE_MODE";
    variableCollectionId: string;
    variableModeId: string;
} | {
    type: "CONDITIONAL";
    conditionalBlocks: {
        condition?: PrototypeValue;
        actions: PrototypeAction[];
    }[];
};
export declare const prototypeActionSchema: v.GenericSchema<PrototypeAction>;
export declare function actionCount(actions: PrototypeAction[]): number;
export declare const reactionSchema: v.SchemaWithPipe<readonly [v.StrictObjectSchema<{
    readonly trigger: v.VariantSchema<"type", [v.StrictObjectSchema<{
        readonly type: v.PicklistSchema<["ON_CLICK", "ON_HOVER", "ON_PRESS", "ON_DRAG"], undefined>;
    }, undefined>, v.StrictObjectSchema<{
        readonly type: v.LiteralSchema<"AFTER_TIMEOUT", undefined>;
        readonly timeout: v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 60, undefined>, v.DescriptionAction<number, "Seconds in the native Plugin API; 1.5 is 1500ms in the Figma editor">]>;
    }, undefined>, v.StrictObjectSchema<{
        readonly type: v.PicklistSchema<["MOUSE_UP", "MOUSE_DOWN"], undefined>;
        readonly delay: v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 60, undefined>, v.DescriptionAction<number, "Seconds in the native Plugin API; 1.5 is 1500ms in the Figma editor">]>;
    }, undefined>, v.StrictObjectSchema<{
        readonly type: v.PicklistSchema<["MOUSE_ENTER", "MOUSE_LEAVE"], undefined>;
        readonly delay: v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 60, undefined>, v.DescriptionAction<number, "Seconds in the native Plugin API; 1.5 is 1500ms in the Figma editor">]>;
        readonly deprecatedVersion: v.OptionalSchema<v.LiteralSchema<false, undefined>, false>;
    }, undefined>, v.StrictObjectSchema<{
        readonly type: v.LiteralSchema<"ON_KEY_DOWN", undefined>;
        readonly device: v.LiteralSchema<"KEYBOARD", undefined>;
        readonly keyCodes: v.SchemaWithPipe<readonly [v.ArraySchema<v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.IntegerAction<number, undefined>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 255, undefined>]>, undefined>, v.MinLengthAction<number[], 1, undefined>, v.MaxLengthAction<number[], 4, undefined>, v.CheckAction<number[], "Duplicate keys">]>;
    }, undefined>], undefined>;
    readonly actions: v.SchemaWithPipe<readonly [v.ArraySchema<v.GenericSchema<PrototypeAction>, undefined>, v.MinLengthAction<PrototypeAction[], 1, undefined>, v.MaxLengthAction<PrototypeAction[], 16, undefined>]>;
}, undefined>, v.CheckAction<{
    trigger: {
        type: "ON_CLICK" | "ON_HOVER" | "ON_PRESS" | "ON_DRAG";
    } | {
        type: "AFTER_TIMEOUT";
        timeout: number;
    } | {
        type: "MOUSE_UP" | "MOUSE_DOWN";
        delay: number;
    } | {
        type: "MOUSE_ENTER" | "MOUSE_LEAVE";
        delay: number;
        deprecatedVersion: false;
    } | {
        type: "ON_KEY_DOWN";
        device: "KEYBOARD";
        keyCodes: number[];
    };
    actions: PrototypeAction[];
}, "At most 64 actions per reaction">]>;
export declare const PROTOTYPE_FEATURES: readonly ["advanced_triggers", "smart_animate", "change_to", "multiple_actions", "variable_actions", "expressions", "conditionals"];
export declare const prototypeOperations: readonly [v.StrictObjectSchema<{
    readonly index: v.OptionalSchema<v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.IntegerAction<number, undefined>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 999, undefined>]>, undefined>;
    readonly reaction: v.SchemaWithPipe<readonly [v.StrictObjectSchema<{
        readonly trigger: v.VariantSchema<"type", [v.StrictObjectSchema<{
            readonly type: v.PicklistSchema<["ON_CLICK", "ON_HOVER", "ON_PRESS", "ON_DRAG"], undefined>;
        }, undefined>, v.StrictObjectSchema<{
            readonly type: v.LiteralSchema<"AFTER_TIMEOUT", undefined>;
            readonly timeout: v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 60, undefined>, v.DescriptionAction<number, "Seconds in the native Plugin API; 1.5 is 1500ms in the Figma editor">]>;
        }, undefined>, v.StrictObjectSchema<{
            readonly type: v.PicklistSchema<["MOUSE_UP", "MOUSE_DOWN"], undefined>;
            readonly delay: v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 60, undefined>, v.DescriptionAction<number, "Seconds in the native Plugin API; 1.5 is 1500ms in the Figma editor">]>;
        }, undefined>, v.StrictObjectSchema<{
            readonly type: v.PicklistSchema<["MOUSE_ENTER", "MOUSE_LEAVE"], undefined>;
            readonly delay: v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 60, undefined>, v.DescriptionAction<number, "Seconds in the native Plugin API; 1.5 is 1500ms in the Figma editor">]>;
            readonly deprecatedVersion: v.OptionalSchema<v.LiteralSchema<false, undefined>, false>;
        }, undefined>, v.StrictObjectSchema<{
            readonly type: v.LiteralSchema<"ON_KEY_DOWN", undefined>;
            readonly device: v.LiteralSchema<"KEYBOARD", undefined>;
            readonly keyCodes: v.SchemaWithPipe<readonly [v.ArraySchema<v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.IntegerAction<number, undefined>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 255, undefined>]>, undefined>, v.MinLengthAction<number[], 1, undefined>, v.MaxLengthAction<number[], 4, undefined>, v.CheckAction<number[], "Duplicate keys">]>;
        }, undefined>], undefined>;
        readonly actions: v.SchemaWithPipe<readonly [v.ArraySchema<v.GenericSchema<PrototypeAction>, undefined>, v.MinLengthAction<PrototypeAction[], 1, undefined>, v.MaxLengthAction<PrototypeAction[], 16, undefined>]>;
    }, undefined>, v.CheckAction<{
        trigger: {
            type: "ON_CLICK" | "ON_HOVER" | "ON_PRESS" | "ON_DRAG";
        } | {
            type: "AFTER_TIMEOUT";
            timeout: number;
        } | {
            type: "MOUSE_UP" | "MOUSE_DOWN";
            delay: number;
        } | {
            type: "MOUSE_ENTER" | "MOUSE_LEAVE";
            delay: number;
            deprecatedVersion: false;
        } | {
            type: "ON_KEY_DOWN";
            device: "KEYBOARD";
            keyCodes: number[];
        };
        actions: PrototypeAction[];
    }, "At most 64 actions per reaction">]>;
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
    readonly reaction: v.SchemaWithPipe<readonly [v.StrictObjectSchema<{
        readonly trigger: v.VariantSchema<"type", [v.StrictObjectSchema<{
            readonly type: v.PicklistSchema<["ON_CLICK", "ON_HOVER", "ON_PRESS", "ON_DRAG"], undefined>;
        }, undefined>, v.StrictObjectSchema<{
            readonly type: v.LiteralSchema<"AFTER_TIMEOUT", undefined>;
            readonly timeout: v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 60, undefined>, v.DescriptionAction<number, "Seconds in the native Plugin API; 1.5 is 1500ms in the Figma editor">]>;
        }, undefined>, v.StrictObjectSchema<{
            readonly type: v.PicklistSchema<["MOUSE_UP", "MOUSE_DOWN"], undefined>;
            readonly delay: v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 60, undefined>, v.DescriptionAction<number, "Seconds in the native Plugin API; 1.5 is 1500ms in the Figma editor">]>;
        }, undefined>, v.StrictObjectSchema<{
            readonly type: v.PicklistSchema<["MOUSE_ENTER", "MOUSE_LEAVE"], undefined>;
            readonly delay: v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 60, undefined>, v.DescriptionAction<number, "Seconds in the native Plugin API; 1.5 is 1500ms in the Figma editor">]>;
            readonly deprecatedVersion: v.OptionalSchema<v.LiteralSchema<false, undefined>, false>;
        }, undefined>, v.StrictObjectSchema<{
            readonly type: v.LiteralSchema<"ON_KEY_DOWN", undefined>;
            readonly device: v.LiteralSchema<"KEYBOARD", undefined>;
            readonly keyCodes: v.SchemaWithPipe<readonly [v.ArraySchema<v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.IntegerAction<number, undefined>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 255, undefined>]>, undefined>, v.MinLengthAction<number[], 1, undefined>, v.MaxLengthAction<number[], 4, undefined>, v.CheckAction<number[], "Duplicate keys">]>;
        }, undefined>], undefined>;
        readonly actions: v.SchemaWithPipe<readonly [v.ArraySchema<v.GenericSchema<PrototypeAction>, undefined>, v.MinLengthAction<PrototypeAction[], 1, undefined>, v.MaxLengthAction<PrototypeAction[], 16, undefined>]>;
    }, undefined>, v.CheckAction<{
        trigger: {
            type: "ON_CLICK" | "ON_HOVER" | "ON_PRESS" | "ON_DRAG";
        } | {
            type: "AFTER_TIMEOUT";
            timeout: number;
        } | {
            type: "MOUSE_UP" | "MOUSE_DOWN";
            delay: number;
        } | {
            type: "MOUSE_ENTER" | "MOUSE_LEAVE";
            delay: number;
            deprecatedVersion: false;
        } | {
            type: "ON_KEY_DOWN";
            device: "KEYBOARD";
            keyCodes: number[];
        };
        actions: PrototypeAction[];
    }, "At most 64 actions per reaction">]>;
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
export declare function reactionFeatures(reaction: v.InferOutput<typeof reactionSchema>): string[];
export {};
