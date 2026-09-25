// src/figma/serialize.ts
var GEOMETRY_FIELDS = [
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
  "maxHeight"
];
var LAYOUT_FIELDS = [
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
  "gridRowSpan"
];
var APPEARANCE_FIELDS = [
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
  "gridStyleId"
];
var TEXT_FIELDS = [
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
  "textStyleId"
];
var VECTOR_ASSET_TYPES = /* @__PURE__ */ new Set([
  "BOOLEAN_OPERATION",
  "ELLIPSE",
  "LINE",
  "POLYGON",
  "STAR",
  "VECTOR"
]);
function normalized(value, state, key, seen = /* @__PURE__ */ new WeakSet()) {
  if (value === null || typeof value === "boolean" || typeof value === "number")
    return value;
  if (typeof value === "string") {
    if (key?.endsWith("StyleId") && value.length > 0) state.styleIds.add(value);
    return value;
  }
  if (typeof value === "symbol") return { $figma: "mixed" };
  if (typeof value === "bigint") return String(value);
  if (typeof value !== "object") return void 0;
  if (seen.has(value)) return { $figma: "circular" };
  seen.add(value);
  if (Array.isArray(value)) {
    const items = [];
    for (const item of value) {
      const result2 = normalized(item, state, void 0, seen);
      if (result2 !== void 0) items.push(result2);
    }
    seen.delete(value);
    return items;
  }
  const record = value;
  if (record.type === "VARIABLE_ALIAS" && typeof record.id === "string")
    state.variableIds.add(record.id);
  const result = {};
  for (const [childKey, childValue] of Object.entries(record)) {
    const child = normalized(childValue, state, childKey, seen);
    if (child !== void 0) result[childKey] = child;
  }
  seen.delete(value);
  return result;
}
function readGroup(node, fields, state) {
  const record = node;
  const result = {};
  for (const field of fields) {
    if (!(field in record)) continue;
    let value;
    try {
      value = record[field];
    } catch {
      continue;
    }
    const next = normalized(value, state, field);
    if (next !== void 0) result[field] = next;
  }
  return Object.keys(result).length > 0 ? result : void 0;
}
function imageAssetReferences(node, property, state) {
  const value = node[property];
  if (!Array.isArray(value)) return [];
  const references = [];
  for (const [index, paint] of value.entries()) {
    if (!paint || typeof paint !== "object") continue;
    const image = paint;
    if (image.type !== "IMAGE" || typeof image.imageHash !== "string") continue;
    const reference = {
      kind: "image-fill",
      property,
      index,
      imageHash: image.imageHash
    };
    const scaleMode = normalized(image.scaleMode, state);
    if (scaleMode !== void 0) reference.scaleMode = scaleMode;
    references.push(reference);
  }
  return references;
}
function assetReferences(node, state) {
  const references = [
    ...imageAssetReferences(node, "fills", state),
    ...imageAssetReferences(node, "strokes", state)
  ];
  const record = node;
  if ("exportSettings" in record && Array.isArray(record.exportSettings)) {
    for (const [index, setting] of record.exportSettings.entries()) {
      const value = normalized(setting, state);
      if (value !== void 0)
        references.push({ kind: "export-setting", index, setting: value });
    }
  }
  if (VECTOR_ASSET_TYPES.has(node.type) && references.every((reference) => reference.kind !== "export-setting")) {
    references.push({ kind: "suggested-export", format: "SVG" });
  }
  for (const reference of references) {
    state.assets.push({
      nodeId: node.id,
      nodeName: node.name,
      nodeType: node.type,
      ...reference
    });
  }
  return references;
}
async function componentData(node, state) {
  if (node.type !== "COMPONENT" && node.type !== "COMPONENT_SET" && node.type !== "INSTANCE" && node.componentPropertyReferences === null)
    return void 0;
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
      "scaleFactor"
    ],
    state
  );
  if (node.type !== "INSTANCE") return data;
  let main = null;
  try {
    main = await node.getMainComponentAsync();
  } catch {
    main = null;
  }
  if (!main) return data;
  const mainComponent = {
    id: main.id,
    name: main.name,
    key: main.key,
    remote: main.remote
  };
  if (main.parent?.type === "COMPONENT_SET") {
    mainComponent.componentSet = {
      id: main.parent.id,
      name: main.parent.name,
      key: main.parent.key,
      remote: main.parent.remote
    };
  }
  return { ...data ?? {}, mainComponent };
}
function textData(node, state, maxText) {
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
      "boundVariables"
    ],
    0,
    maxText === void 0 ? node.characters.length : Math.min(maxText, node.characters.length)
  );
  if (maxText !== void 0 && node.characters.length > maxText) {
    data.characters = node.characters.slice(0, maxText);
    data.textTruncated = true;
    data.nextOffset = maxText;
  }
  const normalizedSegments = normalized(segments, state);
  if (normalizedSegments !== void 0) data.segments = normalizedSegments;
  return data;
}
async function serializeNode(node, state, recursive = true) {
  state.nodeCount += 1;
  const result = {
    id: node.id,
    name: node.name,
    type: node.type,
    visible: node.visible,
    locked: node.locked
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
  if (bindings && typeof bindings === "object" && !Array.isArray(bindings) && Object.keys(bindings).length > 0)
    result.boundVariables = bindings;
  if (variableModes && typeof variableModes === "object" && !Array.isArray(variableModes) && Object.keys(variableModes).length > 0)
    result.explicitVariableModes = variableModes;
  if (node.type === "TEXT")
    result.text = textData(node, state, recursive ? void 0 : 8192);
  if (component && Object.keys(component).length > 0)
    result.component = component;
  if (assets.length > 0) result.assetReferences = assets;
  if (recursive && "children" in node && node.children.length > 0)
    result.children = await Promise.all(
      node.children.map((child) => serializeNode(child, state))
    );
  return result;
}
async function resolveVariables(state, resolvers) {
  const variables = [];
  const collectionIds = /* @__PURE__ */ new Set();
  const resolvedIds = /* @__PURE__ */ new Set();
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
      valuesByMode: valuesByMode ?? {}
    });
    for (const discovered of state.variableIds) {
      if (!resolvedIds.has(discovered) && !queue.includes(discovered))
        queue.push(discovered);
    }
  }
  const collections = [];
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
      hiddenFromPublishing: collection.hiddenFromPublishing
    });
  }
  return { collections, variables };
}
async function resolveStyles(state, resolvers) {
  const styles = [];
  for (const id of state.styleIds) {
    const style = await resolvers.getStyleById(id);
    if (!style) {
      styles.push({ id, unavailable: true });
      continue;
    }
    const record = style;
    styles.push({
      id: style.id,
      name: style.name,
      key: style.key,
      type: String(record.type ?? "UNKNOWN"),
      remote: style.remote,
      description: style.description
    });
  }
  return styles;
}
async function buildSelectionExport(node, source, resolvers, exportedAt = (/* @__PURE__ */ new Date()).toISOString()) {
  const state = {
    assets: [],
    nodeCount: 0,
    styleIds: /* @__PURE__ */ new Set(),
    variableIds: /* @__PURE__ */ new Set()
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
      selection: { id: node.id, name: node.name, type: node.type }
    },
    stats: {
      nodes: state.nodeCount,
      variables: variables.length,
      variableCollections: collections.length,
      styles: styles.length,
      assetReferences: state.assets.length
    },
    variables,
    variableCollections: collections,
    styles,
    assets: state.assets,
    root
  };
}
async function serializeBridgeNode(node) {
  const state = {
    assets: [],
    nodeCount: 0,
    styleIds: /* @__PURE__ */ new Set(),
    variableIds: /* @__PURE__ */ new Set()
  };
  const data = await serializeNode(node, state, false);
  return {
    data,
    variableIds: [...state.variableIds],
    styleIds: [...state.styleIds]
  };
}
export {
  buildSelectionExport,
  serializeBridgeNode
};
