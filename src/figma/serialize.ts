type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };
type JsonObject = { [key: string]: JsonValue };

type ExportResolvers = {
  getStyleById(id: string): Promise<BaseStyle | null>;
  getVariableById(id: string): Promise<Variable | null>;
  getVariableCollectionById(id: string): Promise<VariableCollection | null>;
};

export type SelectionExportSource = {
  document: { id: string; name: string };
  page: { id: string; name: string };
};

type ExportState = {
  assets: JsonObject[];
  nodeCount: number;
  styleIds: Set<string>;
  variableIds: Set<string>;
};

const GEOMETRY_FIELDS = [
  "x",
  "y",
  "width",
  "height",
  "rotation",
  "relativeTransform",
  "absoluteTransform",
  "absoluteBoundingBox",
  "absoluteRenderBounds",
  "targetAspectRatio",
  "constraints",
  "minWidth",
  "maxWidth",
  "minHeight",
  "maxHeight",
] as const;

const LAYOUT_FIELDS = [
  "layoutMode",
  "layoutWrap",
  "layoutSizingHorizontal",
  "layoutSizingVertical",
  "layoutAlign",
  "layoutGrow",
  "layoutPositioning",
  "primaryAxisSizingMode",
  "counterAxisSizingMode",
  "primaryAxisAlignItems",
  "counterAxisAlignItems",
  "counterAxisAlignContent",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "itemSpacing",
  "counterAxisSpacing",
  "itemReverseZIndex",
  "strokesIncludedInLayout",
  "clipsContent",
  "overflowDirection",
  "gridRowCount",
  "gridColumnCount",
  "gridRowGap",
  "gridColumnGap",
  "gridColumnsSizing",
  "gridRowsSizing",
  "gridColumnAnchorIndex",
  "gridRowAnchorIndex",
  "gridColumnSpan",
  "gridRowSpan",
] as const;

const APPEARANCE_FIELDS = [
  "opacity",
  "blendMode",
  "isMask",
  "maskType",
  "fills",
  "strokes",
  "strokeWeight",
  "strokeTopWeight",
  "strokeRightWeight",
  "strokeBottomWeight",
  "strokeLeftWeight",
  "strokeAlign",
  "strokeCap",
  "strokeJoin",
  "dashPattern",
  "miterLimit",
  "cornerRadius",
  "topLeftRadius",
  "topRightRadius",
  "bottomRightRadius",
  "bottomLeftRadius",
  "cornerSmoothing",
  "effects",
  "backgrounds",
  "layoutGrids",
  "fillStyleId",
  "strokeStyleId",
  "effectStyleId",
  "gridStyleId",
] as const;

const TEXT_FIELDS = [
  "characters",
  "fontName",
  "fontSize",
  "fontWeight",
  "textCase",
  "textDecoration",
  "textAlignHorizontal",
  "textAlignVertical",
  "textAutoResize",
  "textTruncation",
  "maxLines",
  "paragraphIndent",
  "paragraphSpacing",
  "listSpacing",
  "hangingPunctuation",
  "hangingList",
  "lineHeight",
  "letterSpacing",
  "leadingTrim",
  "textWrap",
  "autoRename",
  "hyperlink",
  "textStyleId",
] as const;

const VECTOR_ASSET_TYPES = new Set<SceneNode["type"]>([
  "BOOLEAN_OPERATION",
  "ELLIPSE",
  "LINE",
  "POLYGON",
  "STAR",
  "VECTOR",
]);

function normalized(
  value: unknown,
  state: ExportState,
  key?: string,
  seen = new WeakSet<object>()
): JsonValue | undefined {
  if (value === null || typeof value === "boolean" || typeof value === "number")
    return value;
  if (typeof value === "string") {
    if (key?.endsWith("StyleId") && value.length > 0) state.styleIds.add(value);
    return value;
  }
  if (typeof value === "symbol") return { $figma: "mixed" };
  if (typeof value === "bigint") return String(value);
  if (typeof value !== "object") return undefined;
  if (seen.has(value)) return { $figma: "circular" };
  seen.add(value);
  if (Array.isArray(value)) {
    const items: JsonValue[] = [];
    for (const item of value) {
      const result = normalized(item, state, undefined, seen);
      if (result !== undefined) items.push(result);
    }
    seen.delete(value);
    return items;
  }
  const record = value as Record<string, unknown>;
  if (record.type === "VARIABLE_ALIAS" && typeof record.id === "string")
    state.variableIds.add(record.id);
  const result: JsonObject = {};
  for (const [childKey, childValue] of Object.entries(record)) {
    const child = normalized(childValue, state, childKey, seen);
    if (child !== undefined) result[childKey] = child;
  }
  seen.delete(value);
  return result;
}

function readGroup(
  node: SceneNode,
  fields: readonly string[],
  state: ExportState
): JsonObject | undefined {
  const record = node as unknown as Record<string, unknown>;
  const result: JsonObject = {};
  for (const field of fields) {
    if (!(field in record)) continue;
    let value: unknown;
    try {
      value = record[field];
    } catch {
      continue;
    }
    const next = normalized(value, state, field);
    if (next !== undefined) result[field] = next;
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

function imageAssetReferences(
  node: SceneNode,
  property: "fills" | "strokes",
  state: ExportState
): JsonObject[] {
  const value = (node as unknown as Record<string, unknown>)[property];
  if (!Array.isArray(value)) return [];
  const references: JsonObject[] = [];
  for (const [index, paint] of value.entries()) {
    if (!paint || typeof paint !== "object") continue;
    const image = paint as Record<string, unknown>;
    if (image.type !== "IMAGE" || typeof image.imageHash !== "string") continue;
    const reference: JsonObject = {
      kind: "image-fill",
      property,
      index,
      imageHash: image.imageHash,
    };
    const scaleMode = normalized(image.scaleMode, state);
    if (scaleMode !== undefined) reference.scaleMode = scaleMode;
    references.push(reference);
  }
  return references;
}

function assetReferences(node: SceneNode, state: ExportState): JsonObject[] {
  const references = [
    ...imageAssetReferences(node, "fills", state),
    ...imageAssetReferences(node, "strokes", state),
  ];
  const record = node as unknown as Record<string, unknown>;
  if ("exportSettings" in record && Array.isArray(record.exportSettings)) {
    for (const [index, setting] of record.exportSettings.entries()) {
      const value = normalized(setting, state);
      if (value !== undefined)
        references.push({ kind: "export-setting", index, setting: value });
    }
  }
  if (
    VECTOR_ASSET_TYPES.has(node.type) &&
    references.every((reference) => reference.kind !== "export-setting")
  ) {
    references.push({ kind: "suggested-export", format: "SVG" });
  }
  for (const reference of references) {
    state.assets.push({
      nodeId: node.id,
      nodeName: node.name,
      nodeType: node.type,
      ...reference,
    });
  }
  return references;
}

async function componentData(
  node: SceneNode,
  state: ExportState
): Promise<JsonObject | undefined> {
  if (
    node.type !== "COMPONENT" &&
    node.type !== "COMPONENT_SET" &&
    node.type !== "INSTANCE" &&
    node.componentPropertyReferences === null
  )
    return undefined;
  const data = readGroup(
    node,
    [
      "key",
      "remote",
      "description",
      "documentationLinks",
      "variantProperties",
      "componentPropertyDefinitions",
      "componentProperties",
      "componentPropertyReferences",
      "overrides",
      "scaleFactor",
    ],
    state
  );
  if (node.type !== "INSTANCE") return data;
  let main: ComponentNode | null = null;
  try {
    main = await node.getMainComponentAsync();
  } catch {
    main = null;
  }
  if (!main) return data;
  const mainComponent: JsonObject = {
    id: main.id,
    name: main.name,
    key: main.key,
    remote: main.remote,
  };
  if (main.parent?.type === "COMPONENT_SET") {
    mainComponent.componentSet = {
      id: main.parent.id,
      name: main.parent.name,
      key: main.parent.key,
      remote: main.parent.remote,
    };
  }
  return { ...(data ?? {}), mainComponent };
}

function textData(
  node: TextNode,
  state: ExportState,
  maxText?: number
): JsonObject {
  const data = readGroup(node, TEXT_FIELDS, state) ?? {};
  const segments = node.getStyledTextSegments(
    [
      "fontName",
      "fontSize",
      "fontWeight",
      "textDecoration",
      "textCase",
      "lineHeight",
      "letterSpacing",
      "fills",
      "textStyleId",
      "fillStyleId",
      "listOptions",
      "listSpacing",
      "indentation",
      "paragraphIndent",
      "paragraphSpacing",
      "hyperlink",
      "boundVariables",
    ],
    0,
    maxText === undefined
      ? node.characters.length
      : Math.min(maxText, node.characters.length)
  );
  if (maxText !== undefined && node.characters.length > maxText) {
    data.characters = node.characters.slice(0, maxText);
    data.textTruncated = true;
    data.nextOffset = maxText;
  }
  const normalizedSegments = normalized(segments, state);
  if (normalizedSegments !== undefined) data.segments = normalizedSegments;
  return data;
}

async function serializeNode(
  node: SceneNode,
  state: ExportState,
  recursive = true
): Promise<JsonObject> {
  state.nodeCount += 1;
  const result: JsonObject = {
    id: node.id,
    name: node.name,
    type: node.type,
    visible: node.visible,
    locked: node.locked,
  };
  const geometry = readGroup(node, GEOMETRY_FIELDS, state);
  const layout = readGroup(node, LAYOUT_FIELDS, state);
  const appearance = readGroup(node, APPEARANCE_FIELDS, state);
  const bindings = normalized(node.boundVariables, state);
  const variableModes = normalized(node.explicitVariableModes, state);
  const component = await componentData(node, state);
  const assets = assetReferences(node, state);
  if (geometry) result.geometry = geometry;
  if (layout) result.layout = layout;
  if (appearance) result.appearance = appearance;
  if (
    bindings &&
    typeof bindings === "object" &&
    !Array.isArray(bindings) &&
    Object.keys(bindings).length > 0
  )
    result.boundVariables = bindings;
  if (
    variableModes &&
    typeof variableModes === "object" &&
    !Array.isArray(variableModes) &&
    Object.keys(variableModes).length > 0
  )
    result.explicitVariableModes = variableModes;
  if (node.type === "TEXT")
    result.text = textData(node, state, recursive ? undefined : 8192);
  if (component && Object.keys(component).length > 0)
    result.component = component;
  if (assets.length > 0) result.assetReferences = assets;
  if (recursive && "children" in node && node.children.length > 0)
    result.children = await Promise.all(
      node.children.map((child) => serializeNode(child, state))
    );
  return result;
}

async function resolveVariables(
  state: ExportState,
  resolvers: ExportResolvers
) {
  const variables: JsonObject[] = [];
  const collectionIds = new Set<string>();
  const resolvedIds = new Set<string>();
  const queue = [...state.variableIds];
  for (let index = 0; index < queue.length; index += 1) {
    const id = queue[index];
    if (resolvedIds.has(id)) continue;
    resolvedIds.add(id);
    const variable = await resolvers.getVariableById(id);
    if (!variable) {
      variables.push({ id, unavailable: true });
      continue;
    }
    collectionIds.add(variable.variableCollectionId);
    const valuesByMode = normalized(variable.valuesByMode, state);
    variables.push({
      id: variable.id,
      name: variable.name,
      key: variable.key,
      variableCollectionId: variable.variableCollectionId,
      resolvedType: variable.resolvedType,
      remote: variable.remote,
      description: variable.description,
      hiddenFromPublishing: variable.hiddenFromPublishing,
      scopes: normalized(variable.scopes, state) ?? [],
      codeSyntax: normalized(variable.codeSyntax, state) ?? {},
      valuesByMode: valuesByMode ?? {},
    });
    for (const discovered of state.variableIds) {
      if (!resolvedIds.has(discovered) && !queue.includes(discovered))
        queue.push(discovered);
    }
  }
  const collections: JsonObject[] = [];
  for (const id of collectionIds) {
    const collection = await resolvers.getVariableCollectionById(id);
    if (!collection) {
      collections.push({ id, unavailable: true });
      continue;
    }
    collections.push({
      id: collection.id,
      name: collection.name,
      key: collection.key,
      remote: collection.remote,
      defaultModeId: collection.defaultModeId,
      modes: normalized(collection.modes, state) ?? [],
      hiddenFromPublishing: collection.hiddenFromPublishing,
    });
  }
  return { collections, variables };
}

async function resolveStyles(state: ExportState, resolvers: ExportResolvers) {
  const styles: JsonObject[] = [];
  for (const id of state.styleIds) {
    const style = await resolvers.getStyleById(id);
    if (!style) {
      styles.push({ id, unavailable: true });
      continue;
    }
    const record = style as unknown as Record<string, unknown>;
    styles.push({
      id: style.id,
      name: style.name,
      key: style.key,
      type: String(record.type ?? "UNKNOWN"),
      remote: style.remote,
      description: style.description,
    });
  }
  return styles;
}

export async function buildSelectionExport(
  node: SceneNode,
  source: SelectionExportSource,
  resolvers: ExportResolvers,
  exportedAt = new Date().toISOString()
) {
  const state: ExportState = {
    assets: [],
    nodeCount: 0,
    styleIds: new Set(),
    variableIds: new Set(),
  };
  const root = await serializeNode(node, state);
  const { collections, variables } = await resolveVariables(state, resolvers);
  const styles = await resolveStyles(state, resolvers);
  return {
    schema: "figma-bridge.selection",
    version: 1,
    exportedAt,
    source: {
      ...source,
      selection: { id: node.id, name: node.name, type: node.type },
    },
    stats: {
      nodes: state.nodeCount,
      variables: variables.length,
      variableCollections: collections.length,
      styles: styles.length,
      assetReferences: state.assets.length,
    },
    variables,
    variableCollections: collections,
    styles,
    assets: state.assets,
    root,
  };
}

/** Shared per-node serializer: bridge traversal supplies its own budgets. */
export async function serializeBridgeNode(node: SceneNode) {
  const state: ExportState = {
    assets: [],
    nodeCount: 0,
    styleIds: new Set(),
    variableIds: new Set(),
  };
  const data = await serializeNode(node, state, false);
  return {
    data,
    variableIds: [...state.variableIds],
    styleIds: [...state.styleIds],
  };
}
