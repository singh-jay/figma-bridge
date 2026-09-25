import * as v from "valibot";
declare const stepSchema: v.LooseObjectSchema<{
    readonly sourceId: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
    readonly reactionIndex: v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.IntegerAction<number, undefined>, v.MinValueAction<number, 0, undefined>]>;
    readonly actionIndex: v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.IntegerAction<number, undefined>, v.MinValueAction<number, 0, undefined>]>;
}, undefined>;
export declare const prototypeReportSchema: v.StrictObjectSchema<{
    readonly prepared: v.LooseObjectSchema<{
        readonly sessionId: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
        readonly generation: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
        readonly pageId: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
        readonly startNodeId: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
        readonly flowFingerprint: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
        readonly structuralStatus: v.PicklistSchema<["valid", "invalid", "inconclusive"], undefined>;
        readonly scenarioStatus: v.OptionalSchema<v.PicklistSchema<["not_requested", "requires_playback", "satisfied", "warnings", "inconclusive"], undefined>, undefined>;
        readonly complete: v.BooleanSchema<undefined>;
        readonly stepsComplete: v.BooleanSchema<undefined>;
        readonly steps: v.SchemaWithPipe<readonly [v.ArraySchema<v.LooseObjectSchema<{
            readonly sourceId: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
            readonly reactionIndex: v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.IntegerAction<number, undefined>, v.MinValueAction<number, 0, undefined>]>;
            readonly actionIndex: v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.IntegerAction<number, undefined>, v.MinValueAction<number, 0, undefined>]>;
        }, undefined>, undefined>, v.MaxLengthAction<({
            sourceId: string;
            reactionIndex: number;
            actionIndex: number;
        } & {
            [key: string]: unknown;
        })[], 1000, undefined>]>;
    }, undefined>;
    readonly after: v.OptionalSchema<v.LooseObjectSchema<{
        readonly sessionId: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
        readonly generation: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
        readonly flowFingerprint: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
    }, undefined>, undefined>;
    readonly environment: v.StrictObjectSchema<{
        readonly controllerAvailable: v.BooleanSchema<undefined>;
        readonly authenticated: v.BooleanSchema<undefined>;
        readonly pluginConnected: v.BooleanSchema<undefined>;
        readonly documentIdentity: v.PicklistSchema<["confirmed", "ambiguous", "mismatch", "unknown"], undefined>;
        readonly observedStartNodeId: v.OptionalSchema<v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>, undefined>;
        readonly viewport: v.OptionalSchema<v.StrictObjectSchema<{
            readonly width: v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.IntegerAction<number, undefined>, v.MinValueAction<number, 1, undefined>]>;
            readonly height: v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.IntegerAction<number, undefined>, v.MinValueAction<number, 1, undefined>]>;
        }, undefined>, undefined>;
    }, undefined>;
    readonly requiredChecks: v.OptionalSchema<v.SchemaWithPipe<readonly [v.ArraySchema<v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>, undefined>, v.MaxLengthAction<string[], 100, undefined>]>, readonly []>;
    readonly checks: v.SchemaWithPipe<readonly [v.ArraySchema<v.StrictObjectSchema<{
        readonly id: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 200, undefined>]>;
        readonly action: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 4096, undefined>]>;
        readonly expected: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 4096, undefined>]>;
        readonly observed: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 4096, undefined>]>;
        readonly status: v.PicklistSchema<["passed", "failed", "blocked", "inconclusive"], undefined>;
        readonly observedAt: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.IsoTimestampAction<string, undefined>]>;
        readonly screenshots: v.SchemaWithPipe<readonly [v.ArraySchema<v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 1, undefined>, v.MaxLengthAction<string, 4096, undefined>]>, undefined>, v.MaxLengthAction<string[], 4, undefined>]>;
        readonly elapsedMs: v.OptionalSchema<v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.MinValueAction<number, 0, undefined>, v.MaxValueAction<number, 86400000, undefined>]>, undefined>;
    }, undefined>, undefined>, v.MaxLengthAction<{
        id: string;
        action: string;
        expected: string;
        observed: string;
        status: "failed" | "inconclusive" | "passed" | "blocked";
        observedAt: string;
        screenshots: string[];
        elapsedMs?: number | undefined;
    }[], 1000, undefined>]>;
}, undefined>;
export type PrototypeReportInput = v.InferOutput<typeof prototypeReportSchema>;
export declare const interactionCheckId: (step: v.InferOutput<typeof stepSchema>) => string;
export declare function evaluatePrototypeRun(input: PrototypeReportInput): {
    status: string;
    reasons: string[];
    coverage: {
        required: string[];
        passed: string[];
        untested: string[];
    };
};
export declare function savePrototypeRun(project: string, raw: unknown): {
    screenshots: number;
    status: string;
    reasons: string[];
    coverage: {
        required: string[];
        passed: string[];
        untested: string[];
    };
    path: string;
    runId: `${string}-${string}-${string}-${string}-${string}`;
};
export {};
