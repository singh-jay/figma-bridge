import { BridgeError, fingerprint, utf8 } from "../protocol/index";
import type { PrototypeAction, PrototypeValue } from "../protocol/prototype";

export function variantOwner(
  node: BaseNode
): ComponentNode | InstanceNode | null {
  let current: BaseNode | null = node;
  while (current && current.type !== "PAGE") {
    if (current.type === "COMPONENT" || current.type === "INSTANCE")
      return current;
    current = current.parent;
  }
  return null;
}
export async function checkVariant(
  api: PluginAPI,
  source: BaseNode,
  destination: BaseNode
) {
  let owner = variantOwner(source);
  if (owner?.type === "INSTANCE") owner = await owner.getMainComponentAsync();
  if (
    !owner ||
    owner.type !== "COMPONENT" ||
    owner.parent?.type !== "COMPONENT_SET" ||
    destination.type !== "COMPONENT" ||
    destination.parent?.id !== owner.parent.id ||
    destination.id === owner.id
  )
    throw new BridgeError("CHANGE_TO_REQUIRES_SIBLING_VARIANT");
}

// Definitions are design-time dependencies, never live player variable values.
export class PrototypeDependencies {
  private entries = new Map<
    string,
    { data: Record<string, unknown>; current: () => Record<string, unknown> }
  >();
  constructor(private api: PluginAPI) {}
  private track(key: string, current: () => Record<string, unknown>) {
    const data = JSON.parse(JSON.stringify(current()));
    const previous = this.entries.get(key);
    if (previous && fingerprint(previous.data) !== fingerprint(data))
      throw new BridgeError("PROTOTYPE_RESOURCE_CHANGED");
    if (this.entries.size >= 50 && !previous)
      throw new BridgeError("PROTOTYPE_RESOURCE_BUDGET");
    const bytes =
      utf8(JSON.stringify(data)).length +
      [...this.entries]
        .filter(([id]) => id !== key)
        .reduce(
          (n, [, entry]) => n + utf8(JSON.stringify(entry.data)).length,
          0
        );
    if (bytes > 24000) throw new BridgeError("PROTOTYPE_RESOURCE_BUDGET");
    this.entries.set(key, { data, current });
  }
  private expanding = new Set<string>();
  async variable(id: string): Promise<Variable> {
    const item = await this.api.variables?.getVariableByIdAsync(id);
    if (!item || item.remote)
      throw new BridgeError("PROTOTYPE_VARIABLE_UNAVAILABLE");
    const alreadyRead = this.entries.has(`variable:${id}`);
    this.track(`variable:${id}`, () => ({
      id,
      name: item.name,
      resolvedType: item.resolvedType,
      variableCollectionId: item.variableCollectionId,
      valuesByMode: item.valuesByMode,
    }));
    if (this.expanding.has(id))
      throw new BridgeError("PROTOTYPE_VARIABLE_ALIAS_CYCLE");
    if (!alreadyRead) {
      this.expanding.add(id);
      try {
        await this.collection(item.variableCollectionId);
        for (const value of Object.values(item.valuesByMode)) {
          if (
            typeof value === "object" &&
            "type" in value &&
            value.type === "VARIABLE_ALIAS"
          ) {
            const alias = await this.variable(value.id);
            if (alias.resolvedType !== item.resolvedType)
              throw new BridgeError("PROTOTYPE_VALUE_TYPE_MISMATCH");
          }
        }
      } finally {
        this.expanding.delete(id);
      }
    }
    return item;
  }
  async collection(id: string) {
    const item = await this.api.variables?.getVariableCollectionByIdAsync(id);
    if (!item || item.remote)
      throw new BridgeError("PROTOTYPE_COLLECTION_UNAVAILABLE");
    this.track(`collection:${id}`, () => ({
      id,
      name: item.name,
      modes: item.modes,
      defaultModeId: item.defaultModeId,
    }));
    return item;
  }
  async value(data: PrototypeValue): Promise<string> {
    if (data.type === "VARIABLE_ALIAS") {
      const alias = data.value as { id: string };
      const variable = await this.variable(alias.id);
      if (variable.resolvedType !== data.resolvedType)
        throw new BridgeError("PROTOTYPE_VALUE_TYPE_MISMATCH");
    } else if (data.type === "EXPRESSION") {
      const value = data.value as {
        expressionFunction: string;
        expressionArguments: PrototypeValue[];
      };
      const types: string[] = [];
      for (const arg of value.expressionArguments)
        types.push(await this.value(arg));
      const op = value.expressionFunction;
      const unary = op === "NOT" || op === "NEGATE";
      if (types.length !== (unary ? 1 : 2))
        throw new BridgeError("EXPRESSION_ARITY_MISMATCH");
      let output: string;
      if (["AND", "OR", "NOT"].includes(op)) {
        if (types.some((t) => t !== "BOOLEAN"))
          throw new BridgeError("EXPRESSION_TYPE_MISMATCH");
        output = "BOOLEAN";
      } else if (["EQUALS", "NOT_EQUAL"].includes(op)) {
        if (types[0] !== types[1])
          throw new BridgeError("EXPRESSION_TYPE_MISMATCH");
        output = "BOOLEAN";
      } else if (op === "ADDITION" && types.every((t) => t === "STRING"))
        output = "STRING";
      else {
        if (types.some((t) => t !== "FLOAT"))
          throw new BridgeError("EXPRESSION_TYPE_MISMATCH");
        output = [
          "LESS_THAN",
          "LESS_THAN_OR_EQUAL",
          "GREATER_THAN",
          "GREATER_THAN_OR_EQUAL",
        ].includes(op)
          ? "BOOLEAN"
          : "FLOAT";
        if (
          op === "DIVISION" &&
          value.expressionArguments[1].type === "FLOAT" &&
          value.expressionArguments[1].value === 0
        )
          throw new BridgeError("EXPRESSION_DIVISION_BY_ZERO");
      }
      if (output !== data.resolvedType)
        throw new BridgeError("EXPRESSION_TYPE_MISMATCH");
    }
    return data.resolvedType;
  }
  verify() {
    for (const { data, current } of this.entries.values())
      if (fingerprint(data) !== fingerprint(current()))
        throw new BridgeError("PROTOTYPE_RESOURCE_CHANGED");
  }
  snapshots() {
    return [...this.entries.values()].map(({ data }) => data);
  }
}

export async function checkActions(
  api: PluginAPI,
  node: BaseNode,
  actions: PrototypeAction[],
  deps: PrototypeDependencies,
  checkDestination: (
    source: BaseNode,
    destination: BaseNode,
    navigation: string
  ) => void | Promise<void>
) {
  for (const action of actions) {
    if (action.type === "NODE") {
      const destination = await api.getNodeByIdAsync(action.destinationId);
      if (!destination || destination.removed)
        throw new BridgeError("PROTOTYPE_NODE_NOT_FOUND");
      await checkDestination(node, destination, action.navigation);
    } else if (action.type === "SET_VARIABLE") {
      const target = await deps.variable(action.variableId);
      if ((await deps.value(action.variableValue)) !== target.resolvedType)
        throw new BridgeError("PROTOTYPE_VALUE_TYPE_MISMATCH");
    } else if (action.type === "SET_VARIABLE_MODE") {
      const collection = await deps.collection(action.variableCollectionId);
      if (
        !collection.modes.some((mode) => mode.modeId === action.variableModeId)
      )
        throw new BridgeError("PROTOTYPE_MODE_NOT_FOUND");
    } else if (action.type === "CONDITIONAL") {
      for (const block of action.conditionalBlocks) {
        if (
          block.condition &&
          (await deps.value(block.condition)) !== "BOOLEAN"
        )
          throw new BridgeError("CONDITION_MUST_BE_BOOLEAN");
        await checkActions(api, node, block.actions, deps, checkDestination);
      }
    }
  }
}

// Bounded even for unsupported/native future reaction structures.
export function flattenActions(actions: any[]) {
  const entries: {
    action: any;
    actionIndex: number;
    actionPath: string;
    conditional: boolean;
  }[] = [];
  let truncated = false;
  const visit = (
    list: any[],
    prefix: string,
    rootIndex: number,
    conditional: boolean,
    depth: number
  ) => {
    for (const [index, action] of list.entries()) {
      if (entries.length >= 128 || depth > 4) {
        truncated = true;
        return;
      }
      const path = prefix ? `${prefix}/${index}` : String(index);
      const actionIndex = prefix ? rootIndex : index;
      entries.push({ action, actionIndex, actionPath: path, conditional });
      if (
        action?.type === "CONDITIONAL" &&
        Array.isArray(action.conditionalBlocks)
      ) {
        for (const [blockIndex, block] of action.conditionalBlocks.entries()) {
          if (entries.length >= 128) {
            truncated = true;
            return;
          }
          const branchPath = `${path}/branch/${blockIndex}`;
          entries.push({
            action: {
              type: "CONDITIONAL_BRANCH",
              condition: block.condition ?? null,
            },
            actionIndex,
            actionPath: branchPath,
            conditional: true,
          });
          if (Array.isArray(block.actions))
            visit(block.actions, branchPath, actionIndex, true, depth + 1);
        }
        if (
          action.conditionalBlocks.every((b: any) => b.condition !== undefined)
        ) {
          if (entries.length >= 128) {
            truncated = true;
            return;
          }
          entries.push({
            action: { type: "CONDITIONAL_BRANCH", condition: null },
            actionIndex,
            actionPath: `${path}/else`,
            conditional: true,
          });
        }
      }
    }
  };
  visit(actions, "", 0, false, 0);
  return { entries, truncated };
}
