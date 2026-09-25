import * as v from "valibot";
export declare const VERSION = 3;
export declare const PACKAGE_VERSION = "0.3.0";
export declare const PORT = 3846;
export declare const MAX_MESSAGE: number;
export declare const MAX_RESULT: number;
export declare const MAX_OPERATIONS = 500;
export declare const id: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
export declare const fontSchema: v.StrictObjectSchema<{
    readonly family: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
    readonly style: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
}, undefined>;
export declare const patchSchema: v.StrictObjectSchema<{
    readonly name: v.OptionalSchema<v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MaxLengthAction<string, 512, undefined>]>, undefined>;
    readonly x: v.OptionalSchema<v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.FiniteAction<number, undefined>]>, undefined>;
    readonly y: v.OptionalSchema<v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.FiniteAction<number, undefined>]>, undefined>;
    readonly width: v.OptionalSchema<v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.FiniteAction<number, undefined>]>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 100000, undefined>]>, undefined>;
    readonly height: v.OptionalSchema<v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.FiniteAction<number, undefined>]>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 100000, undefined>]>, undefined>;
    readonly visible: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>;
    readonly opacity: v.OptionalSchema<v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.FiniteAction<number, undefined>]>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 1, undefined>]>, undefined>;
    readonly cornerRadius: v.OptionalSchema<v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.FiniteAction<number, undefined>]>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 100000, undefined>]>, undefined>;
    readonly clipsContent: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>;
    readonly layoutMode: v.OptionalSchema<v.PicklistSchema<["NONE", "HORIZONTAL", "VERTICAL"], undefined>, undefined>;
    readonly layoutSizingHorizontal: v.OptionalSchema<v.PicklistSchema<["FIXED", "HUG", "FILL"], undefined>, undefined>;
    readonly layoutSizingVertical: v.OptionalSchema<v.PicklistSchema<["FIXED", "HUG", "FILL"], undefined>, undefined>;
    readonly primaryAxisAlignItems: v.OptionalSchema<v.PicklistSchema<["MIN", "MAX", "CENTER", "SPACE_BETWEEN"], undefined>, undefined>;
    readonly counterAxisAlignItems: v.OptionalSchema<v.PicklistSchema<["MIN", "MAX", "CENTER", "BASELINE"], undefined>, undefined>;
    readonly paddingTop: v.OptionalSchema<v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.FiniteAction<number, undefined>]>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 100000, undefined>]>, undefined>;
    readonly paddingBottom: v.OptionalSchema<v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.FiniteAction<number, undefined>]>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 100000, undefined>]>, undefined>;
    readonly paddingLeft: v.OptionalSchema<v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.FiniteAction<number, undefined>]>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 100000, undefined>]>, undefined>;
    readonly paddingRight: v.OptionalSchema<v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.FiniteAction<number, undefined>]>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 100000, undefined>]>, undefined>;
    readonly itemSpacing: v.OptionalSchema<v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.FiniteAction<number, undefined>]>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 100000, undefined>]>, undefined>;
    readonly fontSize: v.OptionalSchema<v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.FiniteAction<number, undefined>]>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 100000, undefined>]>, v.MinValueAction<number, 1, undefined>]>, undefined>;
    readonly fills: v.OptionalSchema<v.SchemaWithPipe<readonly [v.ArraySchema<v.StrictObjectSchema<{
        readonly type: v.LiteralSchema<"SOLID", undefined>;
        readonly color: v.StrictObjectSchema<{
            readonly r: v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.FiniteAction<number, undefined>]>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 1, undefined>]>;
            readonly g: v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.FiniteAction<number, undefined>]>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 1, undefined>]>;
            readonly b: v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.FiniteAction<number, undefined>]>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 1, undefined>]>;
        }, undefined>;
        readonly opacity: v.OptionalSchema<v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.FiniteAction<number, undefined>]>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 1, undefined>]>, undefined>;
    }, undefined>, undefined>, v.MaxLengthAction<{
        type: "SOLID";
        color: {
            r: number;
            g: number;
            b: number;
        };
        opacity?: number | undefined;
    }[], 8, undefined>]>, undefined>;
}, undefined>;
export declare const operationSchema: v.VariantSchema<"type", [v.StrictObjectSchema<{
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
        readonly actions: v.SchemaWithPipe<readonly [v.ArraySchema<v.GenericSchema<import("./prototype").PrototypeAction>, undefined>, v.MinLengthAction<import("./prototype").PrototypeAction[], 1, undefined>, v.MaxLengthAction<import("./prototype").PrototypeAction[], 16, undefined>]>;
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
        actions: import("./prototype").PrototypeAction[];
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
}, undefined>, v.StrictObjectSchema<{
    readonly type: v.LiteralSchema<"create", undefined>;
    readonly key: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.RegexAction<string, undefined>]>;
    readonly parentId: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
    readonly expectedFingerprint: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
    readonly kind: v.PicklistSchema<["FRAME", "TEXT", "RECTANGLE", "INSTANCE"], undefined>;
    readonly componentId: v.OptionalSchema<v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>, undefined>;
    readonly patch: v.OptionalSchema<v.StrictObjectSchema<{
        readonly name: v.OptionalSchema<v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MaxLengthAction<string, 512, undefined>]>, undefined>;
        readonly x: v.OptionalSchema<v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.FiniteAction<number, undefined>]>, undefined>;
        readonly y: v.OptionalSchema<v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.FiniteAction<number, undefined>]>, undefined>;
        readonly width: v.OptionalSchema<v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.FiniteAction<number, undefined>]>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 100000, undefined>]>, undefined>;
        readonly height: v.OptionalSchema<v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.FiniteAction<number, undefined>]>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 100000, undefined>]>, undefined>;
        readonly visible: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>;
        readonly opacity: v.OptionalSchema<v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.FiniteAction<number, undefined>]>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 1, undefined>]>, undefined>;
        readonly cornerRadius: v.OptionalSchema<v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.FiniteAction<number, undefined>]>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 100000, undefined>]>, undefined>;
        readonly clipsContent: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>;
        readonly layoutMode: v.OptionalSchema<v.PicklistSchema<["NONE", "HORIZONTAL", "VERTICAL"], undefined>, undefined>;
        readonly layoutSizingHorizontal: v.OptionalSchema<v.PicklistSchema<["FIXED", "HUG", "FILL"], undefined>, undefined>;
        readonly layoutSizingVertical: v.OptionalSchema<v.PicklistSchema<["FIXED", "HUG", "FILL"], undefined>, undefined>;
        readonly primaryAxisAlignItems: v.OptionalSchema<v.PicklistSchema<["MIN", "MAX", "CENTER", "SPACE_BETWEEN"], undefined>, undefined>;
        readonly counterAxisAlignItems: v.OptionalSchema<v.PicklistSchema<["MIN", "MAX", "CENTER", "BASELINE"], undefined>, undefined>;
        readonly paddingTop: v.OptionalSchema<v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.FiniteAction<number, undefined>]>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 100000, undefined>]>, undefined>;
        readonly paddingBottom: v.OptionalSchema<v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.FiniteAction<number, undefined>]>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 100000, undefined>]>, undefined>;
        readonly paddingLeft: v.OptionalSchema<v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.FiniteAction<number, undefined>]>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 100000, undefined>]>, undefined>;
        readonly paddingRight: v.OptionalSchema<v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.FiniteAction<number, undefined>]>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 100000, undefined>]>, undefined>;
        readonly itemSpacing: v.OptionalSchema<v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.FiniteAction<number, undefined>]>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 100000, undefined>]>, undefined>;
        readonly fontSize: v.OptionalSchema<v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.FiniteAction<number, undefined>]>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 100000, undefined>]>, v.MinValueAction<number, 1, undefined>]>, undefined>;
        readonly fills: v.OptionalSchema<v.SchemaWithPipe<readonly [v.ArraySchema<v.StrictObjectSchema<{
            readonly type: v.LiteralSchema<"SOLID", undefined>;
            readonly color: v.StrictObjectSchema<{
                readonly r: v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.FiniteAction<number, undefined>]>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 1, undefined>]>;
                readonly g: v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.FiniteAction<number, undefined>]>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 1, undefined>]>;
                readonly b: v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.FiniteAction<number, undefined>]>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 1, undefined>]>;
            }, undefined>;
            readonly opacity: v.OptionalSchema<v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.FiniteAction<number, undefined>]>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 1, undefined>]>, undefined>;
        }, undefined>, undefined>, v.MaxLengthAction<{
            type: "SOLID";
            color: {
                r: number;
                g: number;
                b: number;
            };
            opacity?: number | undefined;
        }[], 8, undefined>]>, undefined>;
    }, undefined>, undefined>;
    readonly characters: v.OptionalSchema<v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MaxLengthAction<string, 16384, undefined>]>, undefined>;
    readonly font: v.OptionalSchema<v.StrictObjectSchema<{
        readonly family: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
        readonly style: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
    }, undefined>, undefined>;
}, undefined>, v.StrictObjectSchema<{
    readonly patch: v.StrictObjectSchema<{
        readonly name: v.OptionalSchema<v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MaxLengthAction<string, 512, undefined>]>, undefined>;
        readonly x: v.OptionalSchema<v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.FiniteAction<number, undefined>]>, undefined>;
        readonly y: v.OptionalSchema<v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.FiniteAction<number, undefined>]>, undefined>;
        readonly width: v.OptionalSchema<v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.FiniteAction<number, undefined>]>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 100000, undefined>]>, undefined>;
        readonly height: v.OptionalSchema<v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.FiniteAction<number, undefined>]>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 100000, undefined>]>, undefined>;
        readonly visible: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>;
        readonly opacity: v.OptionalSchema<v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.FiniteAction<number, undefined>]>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 1, undefined>]>, undefined>;
        readonly cornerRadius: v.OptionalSchema<v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.FiniteAction<number, undefined>]>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 100000, undefined>]>, undefined>;
        readonly clipsContent: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>;
        readonly layoutMode: v.OptionalSchema<v.PicklistSchema<["NONE", "HORIZONTAL", "VERTICAL"], undefined>, undefined>;
        readonly layoutSizingHorizontal: v.OptionalSchema<v.PicklistSchema<["FIXED", "HUG", "FILL"], undefined>, undefined>;
        readonly layoutSizingVertical: v.OptionalSchema<v.PicklistSchema<["FIXED", "HUG", "FILL"], undefined>, undefined>;
        readonly primaryAxisAlignItems: v.OptionalSchema<v.PicklistSchema<["MIN", "MAX", "CENTER", "SPACE_BETWEEN"], undefined>, undefined>;
        readonly counterAxisAlignItems: v.OptionalSchema<v.PicklistSchema<["MIN", "MAX", "CENTER", "BASELINE"], undefined>, undefined>;
        readonly paddingTop: v.OptionalSchema<v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.FiniteAction<number, undefined>]>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 100000, undefined>]>, undefined>;
        readonly paddingBottom: v.OptionalSchema<v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.FiniteAction<number, undefined>]>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 100000, undefined>]>, undefined>;
        readonly paddingLeft: v.OptionalSchema<v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.FiniteAction<number, undefined>]>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 100000, undefined>]>, undefined>;
        readonly paddingRight: v.OptionalSchema<v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.FiniteAction<number, undefined>]>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 100000, undefined>]>, undefined>;
        readonly itemSpacing: v.OptionalSchema<v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.FiniteAction<number, undefined>]>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 100000, undefined>]>, undefined>;
        readonly fontSize: v.OptionalSchema<v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.FiniteAction<number, undefined>]>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 100000, undefined>]>, v.MinValueAction<number, 1, undefined>]>, undefined>;
        readonly fills: v.OptionalSchema<v.SchemaWithPipe<readonly [v.ArraySchema<v.StrictObjectSchema<{
            readonly type: v.LiteralSchema<"SOLID", undefined>;
            readonly color: v.StrictObjectSchema<{
                readonly r: v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.FiniteAction<number, undefined>]>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 1, undefined>]>;
                readonly g: v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.FiniteAction<number, undefined>]>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 1, undefined>]>;
                readonly b: v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.FiniteAction<number, undefined>]>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 1, undefined>]>;
            }, undefined>;
            readonly opacity: v.OptionalSchema<v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.FiniteAction<number, undefined>]>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 1, undefined>]>, undefined>;
        }, undefined>, undefined>, v.MaxLengthAction<{
            type: "SOLID";
            color: {
                r: number;
                g: number;
                b: number;
            };
            opacity?: number | undefined;
        }[], 8, undefined>]>, undefined>;
    }, undefined>;
    readonly nodeId: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
    readonly expectedFingerprint: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
    readonly type: v.LiteralSchema<"update", undefined>;
}, undefined>, v.StrictObjectSchema<{
    readonly properties: v.RecordSchema<v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>, v.UnionSchema<[v.StringSchema<undefined>, v.BooleanSchema<undefined>], undefined>, undefined>;
    readonly nodeId: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
    readonly expectedFingerprint: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
    readonly type: v.LiteralSchema<"instance_properties", undefined>;
}, undefined>, v.StrictObjectSchema<{
    readonly field: v.PicklistSchema<["width", "height", "itemSpacing", "paddingTop", "paddingBottom", "paddingLeft", "paddingRight", "opacity", "cornerRadius", "fontSize", "fills"], undefined>;
    readonly variableId: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
    readonly nodeId: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
    readonly expectedFingerprint: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
    readonly type: v.LiteralSchema<"bind_variable", undefined>;
}, undefined>, v.StrictObjectSchema<{
    readonly parentId: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
    readonly parentFingerprint: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
    readonly index: v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.IntegerAction<number, undefined>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 10000, undefined>]>;
    readonly nodeId: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
    readonly expectedFingerprint: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
    readonly type: v.LiteralSchema<"move", undefined>;
}, undefined>, v.StrictObjectSchema<{
    readonly characters: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MaxLengthAction<string, 16384, undefined>]>;
    readonly font: v.OptionalSchema<v.StrictObjectSchema<{
        readonly family: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
        readonly style: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
    }, undefined>, undefined>;
    readonly nodeId: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
    readonly expectedFingerprint: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
    readonly type: v.LiteralSchema<"set_text", undefined>;
}, undefined>], undefined>;
export type Operation = v.InferOutput<typeof operationSchema>;
export declare const SUPPORTED_OPERATIONS: ("upsert_reaction" | "remove_reaction" | "upsert_flow_start" | "remove_flow_start" | "update_prototype_settings" | "create" | "update" | "instance_properties" | "bind_variable" | "move" | "set_text")[];
export declare const tools: {
    readonly read_prototype: {
        readonly description: "Read an explicit page and bounded node/flow graph, including reactions, starts, fingerprints and incomplete/unsupported paths.";
        readonly schema: v.StrictObjectSchema<{
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
        readonly readOnly: true;
    };
    readonly validate_prototype: {
        readonly description: "Statically validate a scoped prototype graph. Valid structure is not proof of playback.";
        readonly schema: v.StrictObjectSchema<{
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
        readonly readOnly: true;
    };
    readonly prepare_prototype_playback: {
        readonly description: "Prepare a prototype flow and candidate interaction checks for the agent browser/desktop controller. Does not open or play Figma; supplied URLs require document confirmation.";
        readonly schema: v.StrictObjectSchema<{
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
        readonly readOnly: true;
    };
    readonly sessions: {
        readonly description: "List connected local Figma plugin sessions. Always target an explicit session; file names and foreground tabs are not routing authority.";
        readonly schema: v.StrictObjectSchema<{}, undefined>;
        readonly readOnly: true;
    };
    readonly selection: {
        readonly description: "Read the current page and selected node IDs in an explicit plugin session.";
        readonly schema: v.StrictObjectSchema<{
            readonly sessionId: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
        }, undefined>;
        readonly readOnly: true;
    };
    readonly read_nodes: {
        readonly description: "Read bounded design data and mutation fingerprints for explicit nodes. Follow omitted child IDs with another scoped read. Never assume an incomplete response is a complete design.";
        readonly schema: v.StrictObjectSchema<{
            readonly sessionId: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
            readonly nodeIds: v.SchemaWithPipe<readonly [v.ArraySchema<v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>, undefined>, v.MinLengthAction<string[], 1, undefined>, v.MaxLengthAction<string[], 24, undefined>]>;
            readonly depth: v.OptionalSchema<v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.IntegerAction<number, undefined>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 8, undefined>]>, 2>;
            readonly maxNodes: v.OptionalSchema<v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.IntegerAction<number, undefined>, v.MinValueAction<number, 1, undefined>, v.MaxValueAction<number, 500, undefined>]>, 100>;
        }, undefined>;
        readonly readOnly: true;
    };
    readonly read_text: {
        readonly description: "Read a bounded text range and styled runs. Continue with nextOffset; expectedTextHash rejects a changed text snapshot.";
        readonly schema: v.StrictObjectSchema<{
            readonly sessionId: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
            readonly nodeId: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
            readonly offset: v.OptionalSchema<v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.IntegerAction<number, undefined>, v.MinValueAction<number, 0, undefined>]>, 0>;
            readonly length: v.OptionalSchema<v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.IntegerAction<number, undefined>, v.MinValueAction<number, 1, undefined>, v.MaxValueAction<number, 8192, undefined>]>, 4096>;
            readonly expectedTextHash: v.OptionalSchema<v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>, undefined>;
        }, undefined>;
        readonly readOnly: true;
    };
    readonly read_resources: {
        readonly description: "Resolve explicit local variable/collection/style/component IDs; aliases are preserved with bounded continuation IDs. Remote resources are unavailable.";
        readonly schema: v.StrictObjectSchema<{
            readonly sessionId: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
            readonly variableIds: v.OptionalSchema<v.SchemaWithPipe<readonly [v.ArraySchema<v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>, undefined>, v.MaxLengthAction<string[], 50, undefined>]>, readonly []>;
            readonly styleIds: v.OptionalSchema<v.SchemaWithPipe<readonly [v.ArraySchema<v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>, undefined>, v.MaxLengthAction<string[], 50, undefined>]>, readonly []>;
            readonly componentIds: v.OptionalSchema<v.SchemaWithPipe<readonly [v.ArraySchema<v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>, undefined>, v.MaxLengthAction<string[], 20, undefined>]>, readonly []>;
        }, undefined>;
        readonly readOnly: true;
    };
    readonly export: {
        readonly description: "Export an explicit node as PNG/SVG, or original image bytes by imageHash. Saves a bounded artifact locally; no remote URLs.";
        readonly schema: v.StrictObjectSchema<{
            readonly sessionId: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
            readonly nodeId: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
            readonly format: v.PicklistSchema<["PNG", "SVG", "IMAGE"], undefined>;
            readonly imageHash: v.OptionalSchema<v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>, undefined>;
            readonly scale: v.OptionalSchema<v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.MinValueAction<number, 0.1, undefined>, v.MaxValueAction<number, 4, undefined>]>, 1>;
        }, undefined>;
        readonly readOnly: true;
    };
    readonly design_context: {
        readonly description: "Read a scoped design subtree. The project MCP adapter adds configured framework and source references for an optional target. Resolve resource IDs and export a preview separately.";
        readonly schema: v.StrictObjectSchema<{
            readonly sessionId: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
            readonly nodeId: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
            readonly target: v.OptionalSchema<v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>, undefined>;
        }, undefined>;
        readonly readOnly: true;
    };
    readonly write_scope: {
        readonly description: "Acquire or release the sole writer lease for an explicit page/frame. Use the returned generation and leaseId for apply. A lease does not lock out human editors.";
        readonly schema: v.StrictObjectSchema<{
            readonly sessionId: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
            readonly rootId: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
            readonly action: v.PicklistSchema<["acquire", "release"], undefined>;
        }, undefined>;
        readonly readOnly: false;
    };
    readonly apply: {
        readonly description: "Preflight or apply supported operations inside a leased root. Use fresh fingerprints from read_nodes. Results can be partial or unknown; never blindly replay a lost write. Reuse operationId only with the identical payload.";
        readonly schema: v.StrictObjectSchema<{
            readonly sessionId: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
            readonly generation: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
            readonly leaseId: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
            readonly operationId: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.UuidAction<string, undefined>]>;
            readonly dryRun: v.OptionalSchema<v.BooleanSchema<undefined>, false>;
            readonly operations: v.SchemaWithPipe<readonly [v.ArraySchema<v.VariantSchema<"type", [v.StrictObjectSchema<{
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
                    readonly actions: v.SchemaWithPipe<readonly [v.ArraySchema<v.GenericSchema<import("./prototype").PrototypeAction>, undefined>, v.MinLengthAction<import("./prototype").PrototypeAction[], 1, undefined>, v.MaxLengthAction<import("./prototype").PrototypeAction[], 16, undefined>]>;
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
                    actions: import("./prototype").PrototypeAction[];
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
            }, undefined>, v.StrictObjectSchema<{
                readonly type: v.LiteralSchema<"create", undefined>;
                readonly key: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.RegexAction<string, undefined>]>;
                readonly parentId: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
                readonly expectedFingerprint: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
                readonly kind: v.PicklistSchema<["FRAME", "TEXT", "RECTANGLE", "INSTANCE"], undefined>;
                readonly componentId: v.OptionalSchema<v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>, undefined>;
                readonly patch: v.OptionalSchema<v.StrictObjectSchema<{
                    readonly name: v.OptionalSchema<v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MaxLengthAction<string, 512, undefined>]>, undefined>;
                    readonly x: v.OptionalSchema<v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.FiniteAction<number, undefined>]>, undefined>;
                    readonly y: v.OptionalSchema<v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.FiniteAction<number, undefined>]>, undefined>;
                    readonly width: v.OptionalSchema<v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.FiniteAction<number, undefined>]>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 100000, undefined>]>, undefined>;
                    readonly height: v.OptionalSchema<v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.FiniteAction<number, undefined>]>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 100000, undefined>]>, undefined>;
                    readonly visible: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>;
                    readonly opacity: v.OptionalSchema<v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.FiniteAction<number, undefined>]>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 1, undefined>]>, undefined>;
                    readonly cornerRadius: v.OptionalSchema<v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.FiniteAction<number, undefined>]>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 100000, undefined>]>, undefined>;
                    readonly clipsContent: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>;
                    readonly layoutMode: v.OptionalSchema<v.PicklistSchema<["NONE", "HORIZONTAL", "VERTICAL"], undefined>, undefined>;
                    readonly layoutSizingHorizontal: v.OptionalSchema<v.PicklistSchema<["FIXED", "HUG", "FILL"], undefined>, undefined>;
                    readonly layoutSizingVertical: v.OptionalSchema<v.PicklistSchema<["FIXED", "HUG", "FILL"], undefined>, undefined>;
                    readonly primaryAxisAlignItems: v.OptionalSchema<v.PicklistSchema<["MIN", "MAX", "CENTER", "SPACE_BETWEEN"], undefined>, undefined>;
                    readonly counterAxisAlignItems: v.OptionalSchema<v.PicklistSchema<["MIN", "MAX", "CENTER", "BASELINE"], undefined>, undefined>;
                    readonly paddingTop: v.OptionalSchema<v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.FiniteAction<number, undefined>]>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 100000, undefined>]>, undefined>;
                    readonly paddingBottom: v.OptionalSchema<v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.FiniteAction<number, undefined>]>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 100000, undefined>]>, undefined>;
                    readonly paddingLeft: v.OptionalSchema<v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.FiniteAction<number, undefined>]>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 100000, undefined>]>, undefined>;
                    readonly paddingRight: v.OptionalSchema<v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.FiniteAction<number, undefined>]>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 100000, undefined>]>, undefined>;
                    readonly itemSpacing: v.OptionalSchema<v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.FiniteAction<number, undefined>]>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 100000, undefined>]>, undefined>;
                    readonly fontSize: v.OptionalSchema<v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.FiniteAction<number, undefined>]>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 100000, undefined>]>, v.MinValueAction<number, 1, undefined>]>, undefined>;
                    readonly fills: v.OptionalSchema<v.SchemaWithPipe<readonly [v.ArraySchema<v.StrictObjectSchema<{
                        readonly type: v.LiteralSchema<"SOLID", undefined>;
                        readonly color: v.StrictObjectSchema<{
                            readonly r: v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.FiniteAction<number, undefined>]>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 1, undefined>]>;
                            readonly g: v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.FiniteAction<number, undefined>]>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 1, undefined>]>;
                            readonly b: v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.FiniteAction<number, undefined>]>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 1, undefined>]>;
                        }, undefined>;
                        readonly opacity: v.OptionalSchema<v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.FiniteAction<number, undefined>]>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 1, undefined>]>, undefined>;
                    }, undefined>, undefined>, v.MaxLengthAction<{
                        type: "SOLID";
                        color: {
                            r: number;
                            g: number;
                            b: number;
                        };
                        opacity?: number | undefined;
                    }[], 8, undefined>]>, undefined>;
                }, undefined>, undefined>;
                readonly characters: v.OptionalSchema<v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MaxLengthAction<string, 16384, undefined>]>, undefined>;
                readonly font: v.OptionalSchema<v.StrictObjectSchema<{
                    readonly family: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
                    readonly style: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
                }, undefined>, undefined>;
            }, undefined>, v.StrictObjectSchema<{
                readonly patch: v.StrictObjectSchema<{
                    readonly name: v.OptionalSchema<v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MaxLengthAction<string, 512, undefined>]>, undefined>;
                    readonly x: v.OptionalSchema<v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.FiniteAction<number, undefined>]>, undefined>;
                    readonly y: v.OptionalSchema<v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.FiniteAction<number, undefined>]>, undefined>;
                    readonly width: v.OptionalSchema<v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.FiniteAction<number, undefined>]>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 100000, undefined>]>, undefined>;
                    readonly height: v.OptionalSchema<v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.FiniteAction<number, undefined>]>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 100000, undefined>]>, undefined>;
                    readonly visible: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>;
                    readonly opacity: v.OptionalSchema<v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.FiniteAction<number, undefined>]>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 1, undefined>]>, undefined>;
                    readonly cornerRadius: v.OptionalSchema<v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.FiniteAction<number, undefined>]>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 100000, undefined>]>, undefined>;
                    readonly clipsContent: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>;
                    readonly layoutMode: v.OptionalSchema<v.PicklistSchema<["NONE", "HORIZONTAL", "VERTICAL"], undefined>, undefined>;
                    readonly layoutSizingHorizontal: v.OptionalSchema<v.PicklistSchema<["FIXED", "HUG", "FILL"], undefined>, undefined>;
                    readonly layoutSizingVertical: v.OptionalSchema<v.PicklistSchema<["FIXED", "HUG", "FILL"], undefined>, undefined>;
                    readonly primaryAxisAlignItems: v.OptionalSchema<v.PicklistSchema<["MIN", "MAX", "CENTER", "SPACE_BETWEEN"], undefined>, undefined>;
                    readonly counterAxisAlignItems: v.OptionalSchema<v.PicklistSchema<["MIN", "MAX", "CENTER", "BASELINE"], undefined>, undefined>;
                    readonly paddingTop: v.OptionalSchema<v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.FiniteAction<number, undefined>]>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 100000, undefined>]>, undefined>;
                    readonly paddingBottom: v.OptionalSchema<v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.FiniteAction<number, undefined>]>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 100000, undefined>]>, undefined>;
                    readonly paddingLeft: v.OptionalSchema<v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.FiniteAction<number, undefined>]>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 100000, undefined>]>, undefined>;
                    readonly paddingRight: v.OptionalSchema<v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.FiniteAction<number, undefined>]>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 100000, undefined>]>, undefined>;
                    readonly itemSpacing: v.OptionalSchema<v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.FiniteAction<number, undefined>]>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 100000, undefined>]>, undefined>;
                    readonly fontSize: v.OptionalSchema<v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.FiniteAction<number, undefined>]>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 100000, undefined>]>, v.MinValueAction<number, 1, undefined>]>, undefined>;
                    readonly fills: v.OptionalSchema<v.SchemaWithPipe<readonly [v.ArraySchema<v.StrictObjectSchema<{
                        readonly type: v.LiteralSchema<"SOLID", undefined>;
                        readonly color: v.StrictObjectSchema<{
                            readonly r: v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.FiniteAction<number, undefined>]>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 1, undefined>]>;
                            readonly g: v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.FiniteAction<number, undefined>]>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 1, undefined>]>;
                            readonly b: v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.FiniteAction<number, undefined>]>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 1, undefined>]>;
                        }, undefined>;
                        readonly opacity: v.OptionalSchema<v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.FiniteAction<number, undefined>]>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 1, undefined>]>, undefined>;
                    }, undefined>, undefined>, v.MaxLengthAction<{
                        type: "SOLID";
                        color: {
                            r: number;
                            g: number;
                            b: number;
                        };
                        opacity?: number | undefined;
                    }[], 8, undefined>]>, undefined>;
                }, undefined>;
                readonly nodeId: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
                readonly expectedFingerprint: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
                readonly type: v.LiteralSchema<"update", undefined>;
            }, undefined>, v.StrictObjectSchema<{
                readonly properties: v.RecordSchema<v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>, v.UnionSchema<[v.StringSchema<undefined>, v.BooleanSchema<undefined>], undefined>, undefined>;
                readonly nodeId: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
                readonly expectedFingerprint: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
                readonly type: v.LiteralSchema<"instance_properties", undefined>;
            }, undefined>, v.StrictObjectSchema<{
                readonly field: v.PicklistSchema<["width", "height", "itemSpacing", "paddingTop", "paddingBottom", "paddingLeft", "paddingRight", "opacity", "cornerRadius", "fontSize", "fills"], undefined>;
                readonly variableId: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
                readonly nodeId: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
                readonly expectedFingerprint: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
                readonly type: v.LiteralSchema<"bind_variable", undefined>;
            }, undefined>, v.StrictObjectSchema<{
                readonly parentId: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
                readonly parentFingerprint: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
                readonly index: v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.IntegerAction<number, undefined>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 10000, undefined>]>;
                readonly nodeId: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
                readonly expectedFingerprint: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
                readonly type: v.LiteralSchema<"move", undefined>;
            }, undefined>, v.StrictObjectSchema<{
                readonly characters: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MaxLengthAction<string, 16384, undefined>]>;
                readonly font: v.OptionalSchema<v.StrictObjectSchema<{
                    readonly family: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
                    readonly style: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
                }, undefined>, undefined>;
                readonly nodeId: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
                readonly expectedFingerprint: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
                readonly type: v.LiteralSchema<"set_text", undefined>;
            }, undefined>], undefined>, undefined>, v.MinLengthAction<({
                index?: number | undefined;
                reaction: {
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
                    actions: import("./prototype").PrototypeAction[];
                };
                nodeId: string;
                expectedFingerprint: string;
                type: "upsert_reaction";
            } | {
                index: number;
                nodeId: string;
                expectedFingerprint: string;
                type: "remove_reaction";
            } | {
                startNodeId: string;
                name: string;
                nodeId: string;
                expectedFingerprint: string;
                type: "upsert_flow_start";
            } | {
                startNodeId: string;
                nodeId: string;
                expectedFingerprint: string;
                type: "remove_flow_start";
            } | {
                patch: {
                    overflowDirection: "NONE" | "HORIZONTAL" | "VERTICAL" | "BOTH";
                };
                nodeId: string;
                expectedFingerprint: string;
                type: "update_prototype_settings";
            } | {
                type: "create";
                key: string;
                parentId: string;
                expectedFingerprint: string;
                kind: "FRAME" | "TEXT" | "RECTANGLE" | "INSTANCE";
                componentId?: string | undefined;
                patch?: {
                    name?: string | undefined;
                    x?: number | undefined;
                    y?: number | undefined;
                    width?: number | undefined;
                    height?: number | undefined;
                    visible?: boolean | undefined;
                    opacity?: number | undefined;
                    cornerRadius?: number | undefined;
                    clipsContent?: boolean | undefined;
                    layoutMode?: "NONE" | "HORIZONTAL" | "VERTICAL" | undefined;
                    layoutSizingHorizontal?: "FIXED" | "HUG" | "FILL" | undefined;
                    layoutSizingVertical?: "FIXED" | "HUG" | "FILL" | undefined;
                    primaryAxisAlignItems?: "MIN" | "MAX" | "CENTER" | "SPACE_BETWEEN" | undefined;
                    counterAxisAlignItems?: "MIN" | "MAX" | "CENTER" | "BASELINE" | undefined;
                    paddingTop?: number | undefined;
                    paddingBottom?: number | undefined;
                    paddingLeft?: number | undefined;
                    paddingRight?: number | undefined;
                    itemSpacing?: number | undefined;
                    fontSize?: number | undefined;
                    fills?: {
                        type: "SOLID";
                        color: {
                            r: number;
                            g: number;
                            b: number;
                        };
                        opacity?: number | undefined;
                    }[] | undefined;
                } | undefined;
                characters?: string | undefined;
                font?: {
                    family: string;
                    style: string;
                } | undefined;
            } | {
                patch: {
                    name?: string | undefined;
                    x?: number | undefined;
                    y?: number | undefined;
                    width?: number | undefined;
                    height?: number | undefined;
                    visible?: boolean | undefined;
                    opacity?: number | undefined;
                    cornerRadius?: number | undefined;
                    clipsContent?: boolean | undefined;
                    layoutMode?: "NONE" | "HORIZONTAL" | "VERTICAL" | undefined;
                    layoutSizingHorizontal?: "FIXED" | "HUG" | "FILL" | undefined;
                    layoutSizingVertical?: "FIXED" | "HUG" | "FILL" | undefined;
                    primaryAxisAlignItems?: "MIN" | "MAX" | "CENTER" | "SPACE_BETWEEN" | undefined;
                    counterAxisAlignItems?: "MIN" | "MAX" | "CENTER" | "BASELINE" | undefined;
                    paddingTop?: number | undefined;
                    paddingBottom?: number | undefined;
                    paddingLeft?: number | undefined;
                    paddingRight?: number | undefined;
                    itemSpacing?: number | undefined;
                    fontSize?: number | undefined;
                    fills?: {
                        type: "SOLID";
                        color: {
                            r: number;
                            g: number;
                            b: number;
                        };
                        opacity?: number | undefined;
                    }[] | undefined;
                };
                nodeId: string;
                expectedFingerprint: string;
                type: "update";
            } | {
                properties: {
                    [x: string]: string | boolean;
                };
                nodeId: string;
                expectedFingerprint: string;
                type: "instance_properties";
            } | {
                field: "width" | "height" | "opacity" | "cornerRadius" | "paddingTop" | "paddingBottom" | "paddingLeft" | "paddingRight" | "itemSpacing" | "fontSize" | "fills";
                variableId: string;
                nodeId: string;
                expectedFingerprint: string;
                type: "bind_variable";
            } | {
                parentId: string;
                parentFingerprint: string;
                index: number;
                nodeId: string;
                expectedFingerprint: string;
                type: "move";
            } | {
                characters: string;
                font?: {
                    family: string;
                    style: string;
                } | undefined;
                nodeId: string;
                expectedFingerprint: string;
                type: "set_text";
            })[], 1, undefined>, v.MaxLengthAction<({
                index?: number | undefined;
                reaction: {
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
                    actions: import("./prototype").PrototypeAction[];
                };
                nodeId: string;
                expectedFingerprint: string;
                type: "upsert_reaction";
            } | {
                index: number;
                nodeId: string;
                expectedFingerprint: string;
                type: "remove_reaction";
            } | {
                startNodeId: string;
                name: string;
                nodeId: string;
                expectedFingerprint: string;
                type: "upsert_flow_start";
            } | {
                startNodeId: string;
                nodeId: string;
                expectedFingerprint: string;
                type: "remove_flow_start";
            } | {
                patch: {
                    overflowDirection: "NONE" | "HORIZONTAL" | "VERTICAL" | "BOTH";
                };
                nodeId: string;
                expectedFingerprint: string;
                type: "update_prototype_settings";
            } | {
                type: "create";
                key: string;
                parentId: string;
                expectedFingerprint: string;
                kind: "FRAME" | "TEXT" | "RECTANGLE" | "INSTANCE";
                componentId?: string | undefined;
                patch?: {
                    name?: string | undefined;
                    x?: number | undefined;
                    y?: number | undefined;
                    width?: number | undefined;
                    height?: number | undefined;
                    visible?: boolean | undefined;
                    opacity?: number | undefined;
                    cornerRadius?: number | undefined;
                    clipsContent?: boolean | undefined;
                    layoutMode?: "NONE" | "HORIZONTAL" | "VERTICAL" | undefined;
                    layoutSizingHorizontal?: "FIXED" | "HUG" | "FILL" | undefined;
                    layoutSizingVertical?: "FIXED" | "HUG" | "FILL" | undefined;
                    primaryAxisAlignItems?: "MIN" | "MAX" | "CENTER" | "SPACE_BETWEEN" | undefined;
                    counterAxisAlignItems?: "MIN" | "MAX" | "CENTER" | "BASELINE" | undefined;
                    paddingTop?: number | undefined;
                    paddingBottom?: number | undefined;
                    paddingLeft?: number | undefined;
                    paddingRight?: number | undefined;
                    itemSpacing?: number | undefined;
                    fontSize?: number | undefined;
                    fills?: {
                        type: "SOLID";
                        color: {
                            r: number;
                            g: number;
                            b: number;
                        };
                        opacity?: number | undefined;
                    }[] | undefined;
                } | undefined;
                characters?: string | undefined;
                font?: {
                    family: string;
                    style: string;
                } | undefined;
            } | {
                patch: {
                    name?: string | undefined;
                    x?: number | undefined;
                    y?: number | undefined;
                    width?: number | undefined;
                    height?: number | undefined;
                    visible?: boolean | undefined;
                    opacity?: number | undefined;
                    cornerRadius?: number | undefined;
                    clipsContent?: boolean | undefined;
                    layoutMode?: "NONE" | "HORIZONTAL" | "VERTICAL" | undefined;
                    layoutSizingHorizontal?: "FIXED" | "HUG" | "FILL" | undefined;
                    layoutSizingVertical?: "FIXED" | "HUG" | "FILL" | undefined;
                    primaryAxisAlignItems?: "MIN" | "MAX" | "CENTER" | "SPACE_BETWEEN" | undefined;
                    counterAxisAlignItems?: "MIN" | "MAX" | "CENTER" | "BASELINE" | undefined;
                    paddingTop?: number | undefined;
                    paddingBottom?: number | undefined;
                    paddingLeft?: number | undefined;
                    paddingRight?: number | undefined;
                    itemSpacing?: number | undefined;
                    fontSize?: number | undefined;
                    fills?: {
                        type: "SOLID";
                        color: {
                            r: number;
                            g: number;
                            b: number;
                        };
                        opacity?: number | undefined;
                    }[] | undefined;
                };
                nodeId: string;
                expectedFingerprint: string;
                type: "update";
            } | {
                properties: {
                    [x: string]: string | boolean;
                };
                nodeId: string;
                expectedFingerprint: string;
                type: "instance_properties";
            } | {
                field: "width" | "height" | "opacity" | "cornerRadius" | "paddingTop" | "paddingBottom" | "paddingLeft" | "paddingRight" | "itemSpacing" | "fontSize" | "fills";
                variableId: string;
                nodeId: string;
                expectedFingerprint: string;
                type: "bind_variable";
            } | {
                parentId: string;
                parentFingerprint: string;
                index: number;
                nodeId: string;
                expectedFingerprint: string;
                type: "move";
            } | {
                characters: string;
                font?: {
                    family: string;
                    style: string;
                } | undefined;
                nodeId: string;
                expectedFingerprint: string;
                type: "set_text";
            })[], 50, undefined>]>;
        }, undefined>;
        readonly readOnly: false;
    };
    readonly cancel_operation: {
        readonly description: "Request cancellation at the next safe operation boundary. Inspect operation_status afterward; native calls may finish first.";
        readonly schema: v.StrictObjectSchema<{
            readonly sessionId: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
            readonly operationId: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
        }, undefined>;
        readonly readOnly: false;
    };
    readonly operation_status: {
        readonly description: "Read a write receipt without replaying the write. Unknown means inspect the canvas before any new operation.";
        readonly schema: v.StrictObjectSchema<{
            readonly sessionId: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
            readonly operationId: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
        }, undefined>;
        readonly readOnly: true;
    };
};
export type ToolName = keyof typeof tools;
export declare const commandSchema: v.StrictObjectSchema<{
    readonly type: v.LiteralSchema<"command", undefined>;
    readonly version: v.LiteralSchema<3, undefined>;
    readonly requestId: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
    readonly method: v.PicklistSchema<["read_prototype", "validate_prototype", "prepare_prototype_playback", "selection", "read_nodes", "scope", "apply", "operation_status", "read_resources", "export_begin", "export_chunk", "export_release", "cancel_operation", "read_text"], undefined>;
    readonly params: v.RecordSchema<v.StringSchema<undefined>, v.UnknownSchema, undefined>;
}, undefined>;
export type Command = v.InferOutput<typeof commandSchema>;
export declare const replySchema: v.StrictObjectSchema<{
    readonly type: v.LiteralSchema<"result", undefined>;
    readonly version: v.LiteralSchema<3, undefined>;
    readonly requestId: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
    readonly ok: v.BooleanSchema<undefined>;
    readonly result: v.OptionalSchema<v.UnknownSchema, undefined>;
    readonly error: v.OptionalSchema<v.StringSchema<undefined>, undefined>;
}, undefined>;
export declare const helloSchema: v.StrictObjectSchema<{
    readonly type: v.LiteralSchema<"hello", undefined>;
    readonly version: v.LiteralSchema<3, undefined>;
    readonly token: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.LengthAction<string, 64, undefined>]>;
    readonly nonce: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
    readonly documentName: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MaxLengthAction<string, 512, undefined>]>;
    readonly capabilities: v.SchemaWithPipe<readonly [v.ArraySchema<v.PicklistSchema<["read_prototype" | "validate_prototype" | "prepare_prototype_playback" | "selection" | "read_nodes" | "apply" | "operation_status" | "read_resources" | "cancel_operation" | "read_text" | "sessions" | "export" | "design_context" | "write_scope", ...("read_prototype" | "validate_prototype" | "prepare_prototype_playback" | "selection" | "read_nodes" | "apply" | "operation_status" | "read_resources" | "cancel_operation" | "read_text" | "sessions" | "export" | "design_context" | "write_scope")[]], undefined>, undefined>, v.MaxLengthAction<("read_prototype" | "validate_prototype" | "prepare_prototype_playback" | "selection" | "read_nodes" | "apply" | "operation_status" | "read_resources" | "cancel_operation" | "read_text" | "sessions" | "export" | "design_context" | "write_scope")[], 32, undefined>]>;
    readonly operations: v.SchemaWithPipe<readonly [v.ArraySchema<v.StringSchema<undefined>, undefined>, v.MaxLengthAction<string[], 32, undefined>]>;
    readonly prototypeFeatures: v.OptionalSchema<v.SchemaWithPipe<readonly [v.ArraySchema<v.PicklistSchema<readonly ["advanced_triggers", "smart_animate", "change_to", "multiple_actions", "variable_actions", "expressions", "conditionals"], undefined>, undefined>, v.MaxLengthAction<("advanced_triggers" | "smart_animate" | "change_to" | "multiple_actions" | "variable_actions" | "expressions" | "conditionals")[], 16, undefined>]>, readonly []>;
}, undefined>;
export declare function canonical(value: unknown): string;
export declare function utf8(value: string): Uint8Array;
export declare const fingerprint: (value: unknown) => string;
export declare class BridgeError extends Error {
    readonly code: string;
    constructor(code: string);
}
export declare const parse: <T extends v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>>(schema: T, input: unknown) => v.InferOutput<T>;
export declare const proof: (secret: string, nonce: string) => string;
export declare const bytesHash: (bytes: Uint8Array) => string;
