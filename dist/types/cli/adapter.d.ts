import { Client } from "@modelcontextprotocol/sdk/client/index.js";
export declare function upstreamClient(stateDirectory: string, port: number): Promise<Client<{
    method: string;
    params?: {
        [x: string]: unknown;
        _meta?: {
            [x: string]: unknown;
            progressToken?: string | number | undefined;
            "io.modelcontextprotocol/related-task"?: {
                taskId: string;
            } | undefined;
        } | undefined;
    } | undefined;
}, {
    method: string;
    params?: {
        [x: string]: unknown;
        _meta?: {
            [x: string]: unknown;
            progressToken?: string | number | undefined;
            "io.modelcontextprotocol/related-task"?: {
                taskId: string;
            } | undefined;
        } | undefined;
    } | undefined;
}, {
    [x: string]: unknown;
    _meta?: {
        [x: string]: unknown;
        progressToken?: string | number | undefined;
        "io.modelcontextprotocol/related-task"?: {
            taskId: string;
        } | undefined;
    } | undefined;
}>>;
export declare function callWithContext(client: Client, project: string, name: string, args: Record<string, unknown>): Promise<{
    [x: string]: unknown;
    content: ({
        type: "text";
        text: string;
        annotations?: {
            audience?: ("user" | "assistant")[] | undefined;
            priority?: number | undefined;
            lastModified?: string | undefined;
        } | undefined;
        _meta?: Record<string, unknown> | undefined;
    } | {
        type: "image";
        data: string;
        mimeType: string;
        annotations?: {
            audience?: ("user" | "assistant")[] | undefined;
            priority?: number | undefined;
            lastModified?: string | undefined;
        } | undefined;
        _meta?: Record<string, unknown> | undefined;
    } | {
        type: "audio";
        data: string;
        mimeType: string;
        annotations?: {
            audience?: ("user" | "assistant")[] | undefined;
            priority?: number | undefined;
            lastModified?: string | undefined;
        } | undefined;
        _meta?: Record<string, unknown> | undefined;
    } | {
        uri: string;
        name: string;
        type: "resource_link";
        description?: string | undefined;
        mimeType?: string | undefined;
        size?: number | undefined;
        annotations?: {
            audience?: ("user" | "assistant")[] | undefined;
            priority?: number | undefined;
            lastModified?: string | undefined;
        } | undefined;
        _meta?: {
            [x: string]: unknown;
        } | undefined;
        icons?: {
            src: string;
            mimeType?: string | undefined;
            sizes?: string[] | undefined;
            theme?: "light" | "dark" | undefined;
        }[] | undefined;
        title?: string | undefined;
    } | {
        type: "resource";
        resource: {
            uri: string;
            text: string;
            mimeType?: string | undefined;
            _meta?: Record<string, unknown> | undefined;
        } | {
            uri: string;
            blob: string;
            mimeType?: string | undefined;
            _meta?: Record<string, unknown> | undefined;
        };
        annotations?: {
            audience?: ("user" | "assistant")[] | undefined;
            priority?: number | undefined;
            lastModified?: string | undefined;
        } | undefined;
        _meta?: Record<string, unknown> | undefined;
    })[];
    _meta?: {
        [x: string]: unknown;
        progressToken?: string | number | undefined;
        "io.modelcontextprotocol/related-task"?: {
            taskId: string;
        } | undefined;
    } | undefined;
    structuredContent?: Record<string, unknown> | undefined;
    isError?: boolean | undefined;
} | {
    structuredContent: {
        repository: {
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
    };
    content: {
        type: "text";
        text: string;
    }[];
    _meta?: {
        [x: string]: unknown;
        progressToken?: string | number | undefined;
        "io.modelcontextprotocol/related-task"?: {
            taskId: string;
        } | undefined;
    } | undefined;
    isError?: boolean | undefined;
}>;
export declare function runMcp(project: string, stateDirectory: string, port: number): Promise<void>;
