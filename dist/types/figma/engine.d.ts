export declare function snapshot(node: BaseNode): {
    fingerprint: string;
    id: string;
    type: "FRAME" | "TEXT" | "RECTANGLE" | "INSTANCE" | "GROUP" | "LINE" | "COMPONENT" | "VECTOR" | "STAR" | "POLYGON" | "WASHI_TAPE" | "STAMP" | "HIGHLIGHT" | "SLIDE_ROW" | "COMPONENT_SET" | "BOOLEAN_OPERATION" | "TRANSFORM_GROUP" | "SECTION" | "SLIDE" | "SLIDE_GRID" | "DOCUMENT" | "PAGE" | "SLICE" | "ELLIPSE" | "TEXT_PATH" | "STICKY" | "CONNECTOR" | "SHAPE_WITH_TEXT" | "CODE_BLOCK" | "WIDGET" | "EMBED" | "LINK_UNFURL" | "MEDIA" | "TABLE" | "SLOT" | "INTERACTIVE_SLIDE_ELEMENT";
    parentId: string | null;
    properties: Record<string, unknown>;
    prototypeFingerprint: string;
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
