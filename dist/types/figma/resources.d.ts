export declare function readResources(api: PluginAPI, input: unknown): Promise<{
    variables: unknown[];
    collections: unknown[];
    styles: unknown[];
    components: unknown[];
    complete: boolean;
    pendingVariableIds: string[];
}>;
export declare class Exports {
    private api;
    private bytes?;
    private id;
    constructor(api: PluginAPI);
    dispatch(method: string, input: Record<string, unknown>): Promise<{
        released: boolean;
        index?: undefined;
        data?: undefined;
        exportId?: undefined;
        bytes?: undefined;
        chunks?: undefined;
        sha256?: undefined;
        mime?: undefined;
    } | {
        index: number;
        data: string;
        released?: undefined;
        exportId?: undefined;
        bytes?: undefined;
        chunks?: undefined;
        sha256?: undefined;
        mime?: undefined;
    } | {
        exportId: string;
        bytes: number;
        chunks: number;
        sha256: string;
        mime: string;
        released?: undefined;
        index?: undefined;
        data?: undefined;
    }>;
}
