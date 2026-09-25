export type BridgeSocket = {
    data: {
        peerId?: string;
        timer?: ReturnType<typeof setTimeout>;
    };
    send(text: string): number;
    close(code?: number, reason?: string): void;
};
type Runtime = {
    port: number;
    upgrade(request: Request, options: {
        data: BridgeSocket["data"];
    }): boolean;
};
type Options = {
    port: number;
    fetch(request: Request, runtime: Runtime): Promise<Response | undefined>;
    websocket: {
        open(socket: BridgeSocket): void;
        message(socket: BridgeSocket, message: string | Uint8Array): void;
        close(socket: BridgeSocket): void;
    };
};
/** Node transport only; document routing and MCP state live in server.ts. */
export declare function createTransport(options: Options): Promise<{
    port: number;
    stop(): Promise<void>;
}>;
export {};
