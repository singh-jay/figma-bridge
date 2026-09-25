export declare function snapshot(node: BaseNode): {
    fingerprint: string;
    id: string;
    type: "FRAME" | "TEXT" | "RECTANGLE" | "INSTANCE" | "DOCUMENT" | "PAGE" | "SLICE" | "GROUP" | "COMPONENT_SET" | "COMPONENT" | "BOOLEAN_OPERATION" | "VECTOR" | "STAR" | "LINE" | "ELLIPSE" | "POLYGON" | "TEXT_PATH" | "TRANSFORM_GROUP" | "STICKY" | "CONNECTOR" | "SHAPE_WITH_TEXT" | "CODE_BLOCK" | "STAMP" | "WIDGET" | "EMBED" | "LINK_UNFURL" | "MEDIA" | "SECTION" | "HIGHLIGHT" | "WASHI_TAPE" | "TABLE" | "SLIDE" | "SLIDE_ROW" | "SLIDE_GRID" | "SLOT" | "INTERACTIVE_SLIDE_ELEMENT";
    parentId: string | null;
    properties: Record<string, unknown>;
    children: string[];
};
export declare class BridgeEngine {
    private api;
    private cancelled;
    private receipts;
    private exports;
    constructor(api: PluginAPI);
    dispatch(method: string, input: Record<string, unknown>): Promise<unknown>;
    private fonts;
    private apply;
}
