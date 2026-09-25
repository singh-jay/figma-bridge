import { BridgeError, parse, tools, bytesHash } from "../protocol/index";
export async function readResources(api: PluginAPI, input: unknown) {
  const args = parse(tools.read_resources.schema, input),
    variables: unknown[] = [],
    collections: unknown[] = [],
    styles: unknown[] = [],
    components: unknown[] = [];
  const seen = new Set<string>(),
    collectionIds = new Set<string>(),
    queue = [...args.variableIds];
  for (let i = 0; i < queue.length && seen.size < 50; i++) {
    const id = queue[i];
    if (seen.has(id)) continue;
    seen.add(id);
    const item = await api.variables.getVariableByIdAsync(id);
    if (!item || item.remote) {
      variables.push({ id, unavailable: true });
      continue;
    }
    variables.push({
      id,
      name: item.name,
      resolvedType: item.resolvedType,
      variableCollectionId: item.variableCollectionId,
      valuesByMode: item.valuesByMode,
      scopes: item.scopes,
      codeSyntax: item.codeSyntax,
    });
    collectionIds.add(item.variableCollectionId);
    for (const value of Object.values(item.valuesByMode))
      if (
        typeof value === "object" &&
        "type" in value &&
        value.type === "VARIABLE_ALIAS" &&
        !seen.has(value.id)
      )
        queue.push(value.id);
  }
  for (const id of collectionIds) {
    const c = await api.variables.getVariableCollectionByIdAsync(id);
    collections.push(
      c
        ? { id, name: c.name, modes: c.modes, defaultModeId: c.defaultModeId }
        : { id, unavailable: true }
    );
  }
  for (const id of args.styleIds) {
    const s = await api.getStyleByIdAsync(id);
    if (!s || s.remote) {
      styles.push({ id, unavailable: true });
      continue;
    }
    const data: Record<string, unknown> = { id, name: s.name, type: s.type };
    for (const field of [
      "paints",
      "effects",
      "layoutGrids",
      "fontName",
      "fontSize",
      "lineHeight",
      "letterSpacing",
      "paragraphSpacing",
      "textCase",
      "textDecoration",
      "boundVariables",
    ])
      if (field in s)
        data[field] = (s as unknown as Record<string, unknown>)[field];
    styles.push(data);
  }
  for (const id of args.componentIds) {
    const c = await api.getNodeByIdAsync(id);
    components.push(
      (c?.type === "COMPONENT" || c?.type === "COMPONENT_SET") && !c.remote
        ? {
            id,
            name: c.name,
            componentPropertyDefinitions: (c.parent?.type === "COMPONENT_SET"
              ? c.parent
              : c
            ).componentPropertyDefinitions,
            componentSetId:
              c.parent?.type === "COMPONENT_SET" ? c.parent.id : null,
            children: c.children.map((n) => n.id),
          }
        : { id, unavailable: true }
    );
  }
  const pendingVariableIds = [...new Set(queue.filter((id) => !seen.has(id)))];
  return {
    variables,
    collections,
    styles,
    components,
    complete: pendingVariableIds.length === 0,
    pendingVariableIds,
  };
}
export class Exports {
  private bytes?: Uint8Array;
  private id = 0;
  constructor(private api: PluginAPI) {}
  async dispatch(method: string, input: Record<string, unknown>) {
    if (method === "export_release") {
      this.bytes = undefined;
      return { released: true };
    }
    if (method === "export_chunk") {
      if (input.exportId !== String(this.id) || !this.bytes)
        throw new BridgeError("EXPORT_EXPIRED");
      const index = Number(input.index);
      if (
        !Number.isInteger(index) ||
        index < 0 ||
        index * 65536 >= this.bytes.length
      )
        throw new BridgeError("INVALID_CHUNK");
      return {
        index,
        data: this.api.base64Encode(
          this.bytes.slice(index * 65536, (index + 1) * 65536)
        ),
      };
    }
    const args = parse(tools.export.schema, input),
      node = await this.api.getNodeByIdAsync(args.nodeId);
    if (!node || !("exportAsync" in node))
      throw new BridgeError("NOT_EXPORTABLE");
    let bytes: Uint8Array, mime: string;
    if (args.format === "IMAGE") {
      if (!args.imageHash) throw new BridgeError("IMAGE_HASH_REQUIRED");
      const paints = [
        ...("fills" in node && Array.isArray(node.fills) ? node.fills : []),
        ...("strokes" in node ? node.strokes : []),
      ];
      if (
        !paints.some(
          (p) => p.type === "IMAGE" && p.imageHash === args.imageHash
        )
      )
        throw new BridgeError("IMAGE_NOT_ON_NODE");
      const image = this.api.getImageByHash(args.imageHash);
      if (!image) throw new BridgeError("IMAGE_NOT_FOUND");
      bytes = await image.getBytesAsync();
      mime = "application/octet-stream";
    } else {
      const bounds =
        ("absoluteRenderBounds" in node ? node.absoluteRenderBounds : null) ??
        ("absoluteBoundingBox" in node ? node.absoluteBoundingBox : null);
      if (
        !bounds ||
        bounds.width * args.scale > 16000 ||
        bounds.height * args.scale > 16000 ||
        bounds.width * bounds.height * args.scale ** 2 > 16_000_000
      )
        throw new BridgeError("EXPORT_DIMENSION_LIMIT");
      bytes = await node.exportAsync(
        args.format === "PNG"
          ? { format: "PNG", constraint: { type: "SCALE", value: args.scale } }
          : { format: "SVG" }
      );
      mime = args.format === "PNG" ? "image/png" : "image/svg+xml";
    }
    if (bytes.length > 10 * 1024 * 1024)
      throw new BridgeError("EXPORT_TOO_LARGE");
    this.bytes = bytes;
    this.id++;
    return {
      exportId: String(this.id),
      bytes: bytes.length,
      chunks: Math.ceil(bytes.length / 65536),
      sha256: bytesHash(bytes),
      mime,
    };
  }
}
