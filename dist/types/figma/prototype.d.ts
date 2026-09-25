import { type PrototypeOperation } from "../protocol/prototype";
export declare function prototypeState(node: BaseNode): Record<string, unknown>;
export declare function isPrototypeOperation(op: {
    type: string;
}): op is PrototypeOperation;
export declare function checkPrototypeOperation(api: PluginAPI, node: BaseNode, op: PrototypeOperation, root: BaseNode): Promise<void>;
export declare function writePrototypeOperation(node: BaseNode, op: PrototypeOperation): Promise<void>;
type Issue = {
    severity: "error" | "warning";
    code: string;
    nodeId: string;
    reactionIndex?: number;
};
type Snapshot = (node: BaseNode) => {
    fingerprint: string;
};
export declare function readPrototype(api: PluginAPI, input: Record<string, unknown>, snapshot: Snapshot): Promise<{
    flowFingerprint: string;
    scenario: {
        startNodeId: string;
        expectedScreenIds: string[];
        requireExitNodeIds: string[];
    } | null;
    scenarioStatus: "inconclusive" | "not_requested" | "requires_playback" | "satisfied" | "warnings";
    pageId: string;
    pageFingerprint: string;
    flowStartingPoints: readonly {
        nodeId: string;
        name: string;
    }[];
    nodes: {
        id: string;
        name: string;
        type: string;
        parentId: string | null;
        screenId: string | null;
        fingerprint: string;
        prototype: Record<string, unknown>;
    }[];
    edges: {
        sourceId: string;
        reactionIndex: number;
        actionIndex: number;
        type: string;
        supported: boolean;
        destinationId?: string;
        navigation?: string;
    }[];
    issues: Issue[];
    complete: boolean;
    pendingNodeIds: string[];
    pendingTruncated: boolean;
}>;
export declare function prototypeTool(api: PluginAPI, method: string, input: Record<string, unknown>, snapshot: Snapshot): Promise<{
    flowFingerprint: string;
    scenario: {
        startNodeId: string;
        expectedScreenIds: string[];
        requireExitNodeIds: string[];
    } | null;
    scenarioStatus: "inconclusive" | "not_requested" | "requires_playback" | "satisfied" | "warnings";
    pageId: string;
    pageFingerprint: string;
    flowStartingPoints: readonly {
        nodeId: string;
        name: string;
    }[];
    nodes: {
        id: string;
        name: string;
        type: string;
        parentId: string | null;
        screenId: string | null;
        fingerprint: string;
        prototype: Record<string, unknown>;
    }[];
    edges: {
        sourceId: string;
        reactionIndex: number;
        actionIndex: number;
        type: string;
        supported: boolean;
        destinationId?: string;
        navigation?: string;
    }[];
    issues: Issue[];
    complete: boolean;
    pendingNodeIds: string[];
    pendingTruncated: boolean;
} | {
    structuralStatus: string;
    playbackStatus: string;
    flowFingerprint: string;
    scenario: {
        startNodeId: string;
        expectedScreenIds: string[];
        requireExitNodeIds: string[];
    } | null;
    scenarioStatus: "inconclusive" | "not_requested" | "requires_playback" | "satisfied" | "warnings";
    pageId: string;
    pageFingerprint: string;
    flowStartingPoints: readonly {
        nodeId: string;
        name: string;
    }[];
    nodes: {
        id: string;
        name: string;
        type: string;
        parentId: string | null;
        screenId: string | null;
        fingerprint: string;
        prototype: Record<string, unknown>;
    }[];
    edges: {
        sourceId: string;
        reactionIndex: number;
        actionIndex: number;
        type: string;
        supported: boolean;
        destinationId?: string;
        navigation?: string;
    }[];
    issues: Issue[];
    complete: boolean;
    pendingNodeIds: string[];
    pendingTruncated: boolean;
    stepsComplete?: undefined;
    readyForPlayback?: undefined;
    startNodeId?: undefined;
    startName?: undefined;
    prototypeUrl?: undefined;
    documentIdentity?: undefined;
    requiredController?: undefined;
    steps?: undefined;
    evidence?: undefined;
    instructions?: undefined;
} | {
    scenario: {
        startNodeId: string;
        expectedScreenIds: string[];
        requireExitNodeIds: string[];
    } | null;
    scenarioStatus: "inconclusive" | "not_requested" | "requires_playback" | "satisfied" | "warnings";
    pageId: string;
    flowFingerprint: string;
    complete: boolean;
    pendingNodeIds: string[];
    pendingTruncated: boolean;
    issues: Issue[];
    stepsComplete: boolean;
    structuralStatus: string;
    playbackStatus: string;
    readyForPlayback: boolean;
    startNodeId: string;
    startName: string;
    prototypeUrl: string | null;
    documentIdentity: string;
    requiredController: string;
    steps: {
        targetName: string | null;
        expected: string;
        status: string;
        sourceId: string;
        reactionIndex: number;
        actionIndex: number;
        type: string;
        supported: boolean;
        destinationId?: string;
        navigation?: string;
    }[];
    evidence: {
        format: string;
        version: number;
        flowFingerprint: string;
        status: string;
        steps: never[];
        viewport: null;
    };
    instructions: string[];
}>;
export {};
