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
            type: "FRAME" | "TEXT" | "RECTANGLE" | "INSTANCE" | "GROUP" | "LINE" | "COMPONENT" | "VECTOR" | "STAR" | "POLYGON" | "WASHI_TAPE" | "STAMP" | "HIGHLIGHT" | "SLIDE_ROW" | "COMPONENT_SET" | "BOOLEAN_OPERATION" | "TRANSFORM_GROUP" | "SECTION" | "SLIDE" | "SLIDE_GRID" | "SLICE" | "ELLIPSE" | "TEXT_PATH" | "STICKY" | "CONNECTOR" | "SHAPE_WITH_TEXT" | "CODE_BLOCK" | "WIDGET" | "EMBED" | "LINK_UNFURL" | "MEDIA" | "TABLE" | "SLOT" | "INTERACTIVE_SLIDE_ELEMENT";
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
