import * as v from "valibot";
export declare const projectSchema: v.StrictObjectSchema<{
    readonly version: v.LiteralSchema<1, undefined>;
    readonly targets: v.RecordSchema<v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 512, undefined>]>, v.StrictObjectSchema<{
        readonly root: v.OptionalSchema<v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 512, undefined>]>, ".">;
        readonly framework: v.OptionalSchema<v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 512, undefined>]>, undefined>;
        readonly language: v.OptionalSchema<v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 512, undefined>]>, undefined>;
        readonly styling: v.OptionalSchema<v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 512, undefined>]>, undefined>;
        readonly components: v.OptionalSchema<v.SchemaWithPipe<readonly [v.ArraySchema<v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 512, undefined>]>, undefined>, v.MaxLengthAction<string[], 32, undefined>]>, readonly []>;
        readonly tokens: v.OptionalSchema<v.SchemaWithPipe<readonly [v.ArraySchema<v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 512, undefined>]>, undefined>, v.MaxLengthAction<string[], 32, undefined>]>, readonly []>;
        readonly guidance: v.OptionalSchema<v.SchemaWithPipe<readonly [v.ArraySchema<v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 512, undefined>]>, undefined>, v.MaxLengthAction<string[], 32, undefined>]>, readonly []>;
    }, undefined>, undefined>;
}, undefined>;
export type ProjectConfig = v.InferOutput<typeof projectSchema>;
export declare function projectContext(project: string, target?: string): {
    configured: boolean;
    root: string;
    availableTargets: string[];
    missingMappings: string[];
    target?: undefined;
    framework?: undefined;
    language?: undefined;
    styling?: undefined;
    targetRoot?: undefined;
    sources?: undefined;
} | {
    configured: boolean;
    root: string;
    target: string;
    availableTargets: string[];
    framework: string | null;
    language: string | null;
    styling: string | null;
    targetRoot: string;
    sources: {
        kind: "components" | "tokens" | "guidance";
        path: string;
        verifiedExists: boolean;
    }[];
    missingMappings: string[];
};
