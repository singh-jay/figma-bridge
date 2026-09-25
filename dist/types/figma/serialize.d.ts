type JsonValue = string | number | boolean | null | JsonValue[] | {
    [key: string]: JsonValue;
};
type JsonObject = {
    [key: string]: JsonValue;
};
type ExportResolvers = {
    getStyleById(id: string): Promise<BaseStyle | null>;
    getVariableById(id: string): Promise<Variable | null>;
    getVariableCollectionById(id: string): Promise<VariableCollection | null>;
};
export type SelectionExportSource = {
    document: {
        id: string;
        name: string;
    };
    page: {
        id: string;
        name: string;
    };
};
export declare function buildSelectionExport(node: SceneNode, source: SelectionExportSource, resolvers: ExportResolvers, exportedAt?: string): Promise<{
    schema: string;
    version: number;
    exportedAt: string;
    source: {
        selection: {
            id: string;
            name: string;
            type: "FRAME" | "TEXT" | "RECTANGLE" | "INSTANCE" | "SLICE" | "GROUP" | "COMPONENT_SET" | "COMPONENT" | "BOOLEAN_OPERATION" | "VECTOR" | "STAR" | "LINE" | "ELLIPSE" | "POLYGON" | "TEXT_PATH" | "TRANSFORM_GROUP" | "STICKY" | "CONNECTOR" | "SHAPE_WITH_TEXT" | "CODE_BLOCK" | "STAMP" | "WIDGET" | "EMBED" | "LINK_UNFURL" | "MEDIA" | "SECTION" | "HIGHLIGHT" | "WASHI_TAPE" | "TABLE" | "SLIDE" | "SLIDE_ROW" | "SLIDE_GRID" | "SLOT" | "INTERACTIVE_SLIDE_ELEMENT";
        };
        document: {
            id: string;
            name: string;
        };
        page: {
            id: string;
            name: string;
        };
    };
    stats: {
        nodes: number;
        variables: number;
        variableCollections: number;
        styles: number;
        assetReferences: number;
    };
    variables: JsonObject[];
    variableCollections: JsonObject[];
    styles: JsonObject[];
    assets: JsonObject[];
    root: JsonObject;
}>;
/** Shared per-node serializer: bridge traversal supplies its own budgets. */
export declare function serializeBridgeNode(node: SceneNode): Promise<{
    data: JsonObject;
    variableIds: string[];
    styleIds: string[];
}>;
export {};
