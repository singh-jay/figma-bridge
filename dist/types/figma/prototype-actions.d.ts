import type { PrototypeAction, PrototypeValue } from "../protocol/prototype";
export declare function variantOwner(node: BaseNode): ComponentNode | InstanceNode | null;
export declare function checkVariant(api: PluginAPI, source: BaseNode, destination: BaseNode): Promise<void>;
export declare class PrototypeDependencies {
    private api;
    private entries;
    constructor(api: PluginAPI);
    private track;
    private expanding;
    variable(id: string): Promise<Variable>;
    collection(id: string): Promise<VariableCollection>;
    value(data: PrototypeValue): Promise<string>;
    verify(): void;
    snapshots(): Record<string, unknown>[];
}
export declare function checkActions(api: PluginAPI, node: BaseNode, actions: PrototypeAction[], deps: PrototypeDependencies, checkDestination: (source: BaseNode, destination: BaseNode, navigation: string) => void | Promise<void>): Promise<void>;
export declare function flattenActions(actions: any[]): {
    entries: {
        action: any;
        actionIndex: number;
        actionPath: string;
        conditional: boolean;
    }[];
    truncated: boolean;
};
