export declare function startBridge(options: {
    token: string;
    port?: number;
    requestTimeoutMs?: number;
    stateDirectory: string;
}): Promise<{
    port: number;
    stop(): Promise<void>;
}>;
