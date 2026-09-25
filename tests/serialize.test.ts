import { describe, expect, test } from "bun:test";

import { buildSelectionExport } from "../src/figma/serialize";
import { MockNode } from "./fixtures/figma-mock";

function node(type: string, name: string) {
  const value = new MockNode(type);
  value.name = name;
  value.locked = false;
  return value;
}

describe("selected layer JSON export", () => {
  test("serializes hierarchy, layout, styling, components, variables and asset references", async () => {
    const root = node("FRAME", "Checkout · desktop");
    root.layoutMode = "VERTICAL";
    root.paddingLeft = 24;
    root.itemSpacing = 16;
    root.boundVariables = {
      itemSpacing: { type: "VARIABLE_ALIAS", id: "VariableID:spacing" },
    };

    const image = node("RECTANGLE", "venue-photo");
    image.fills = [
      { type: "IMAGE", imageHash: "image-hash", scaleMode: "FILL" },
    ];
    image.exportSettings = [
      { format: "PNG", suffix: "@2x", constraint: { type: "SCALE", value: 2 } },
    ];
    root.appendChild(image);

    const icon = node("VECTOR", "arrow-right");
    icon.fills = [
      {
        type: "SOLID",
        color: { r: 1, g: 0, b: 0 },
        boundVariables: {
          color: { type: "VARIABLE_ALIAS", id: "VariableID:primary" },
        },
      },
    ];
    root.appendChild(icon);

    const text = node("TEXT", "title");
    text.characters = "Confirm booking";
    text.textStyleId = "StyleID:heading";
    text.getStyledTextSegments = () => [
      {
        characters: "Confirm booking",
        start: 0,
        end: 15,
        fontName: { family: "Nunito", style: "Bold" },
        fontSize: 24,
        fontWeight: 700,
        textDecoration: "NONE",
        textCase: "ORIGINAL",
        lineHeight: { unit: "PIXELS", value: 32 },
        letterSpacing: { unit: "PIXELS", value: 0 },
        fills: [],
        textStyleId: "StyleID:heading",
        fillStyleId: "",
        listOptions: { type: "NONE" },
        listSpacing: 0,
        indentation: 0,
        paragraphIndent: 0,
        paragraphSpacing: 0,
        hyperlink: null,
        boundVariables: {},
      },
    ];
    root.appendChild(text);

    const set = node("COMPONENT_SET", "Button");
    set.key = "button-set-key";
    set.remote = false;
    const main = node("COMPONENT", "variant=primary, size=md");
    main.key = "button-key";
    main.remote = false;
    set.appendChild(main);
    const instance = main.createInstance();
    instance.name = "confirm-button";
    instance.locked = false;
    instance.componentProperties = {
      variant: { type: "VARIANT", value: "primary" },
    };
    root.appendChild(instance);

    const variables = new Map<string, Variable>([
      [
        "VariableID:spacing",
        {
          id: "VariableID:spacing",
          name: "--spacing-4",
          key: "spacing-key",
          variableCollectionId: "CollectionID:tokens",
          resolvedType: "FLOAT",
          remote: false,
          description: "",
          hiddenFromPublishing: false,
          scopes: ["GAP"],
          codeSyntax: { WEB: "var(--spacing-4)" },
          valuesByMode: { Desktop: 16 },
        } as unknown as Variable,
      ],
      [
        "VariableID:primary",
        {
          id: "VariableID:primary",
          name: "--primary",
          key: "primary-key",
          variableCollectionId: "CollectionID:tokens",
          resolvedType: "COLOR",
          remote: false,
          description: "",
          hiddenFromPublishing: false,
          scopes: ["ALL_FILLS"],
          codeSyntax: { WEB: "var(--primary)" },
          valuesByMode: {
            Desktop: { type: "VARIABLE_ALIAS", id: "VariableID:terracotta" },
          },
        } as unknown as Variable,
      ],
      [
        "VariableID:terracotta",
        {
          id: "VariableID:terracotta",
          name: "--oc-p-terracotta-500",
          key: "terracotta-key",
          variableCollectionId: "CollectionID:tokens",
          resolvedType: "COLOR",
          remote: false,
          description: "",
          hiddenFromPublishing: false,
          scopes: ["ALL_FILLS"],
          codeSyntax: { WEB: "var(--oc-p-terracotta-500)" },
          valuesByMode: { Desktop: { r: 0.72, g: 0.29, b: 0.2, a: 1 } },
        } as unknown as Variable,
      ],
    ]);
    const collection = {
      id: "CollectionID:tokens",
      name: "Omni Care · Semantic",
      key: "collection-key",
      remote: false,
      defaultModeId: "Desktop",
      modes: [{ modeId: "Desktop", name: "Desktop" }],
      hiddenFromPublishing: false,
    } as unknown as VariableCollection;
    const style = {
      id: "StyleID:heading",
      name: "Heading/Large",
      key: "heading-key",
      type: "TEXT",
      remote: false,
      description: "",
    } as unknown as BaseStyle;

    const exported = await buildSelectionExport(
      root as unknown as SceneNode,
      {
        document: { id: "0:0", name: "Omni Care" },
        page: { id: "1:1", name: "Customer UI · StyleX contract" },
      },
      {
        getStyleById: async (id) => (id === style.id ? style : null),
        getVariableById: async (id) => variables.get(id) ?? null,
        getVariableCollectionById: async (id) =>
          id === collection.id ? collection : null,
      },
      "2026-09-19T00:00:00.000Z"
    );

    expect(exported.schema).toBe("figma-bridge.selection");
    expect(exported.source.selection).toEqual({
      id: root.id,
      name: root.name,
      type: "FRAME",
    });
    expect(exported.stats).toEqual({
      nodes: 5,
      variables: 3,
      variableCollections: 1,
      styles: 1,
      assetReferences: 3,
    });
    expect(exported.variableCollections[0].name).toBe("Omni Care · Semantic");
    expect(exported.variables.map((variable) => variable.name)).toEqual([
      "--spacing-4",
      "--primary",
      "--oc-p-terracotta-500",
    ]);
    expect(exported.styles[0].name).toBe("Heading/Large");
    expect(exported.assets.map((asset) => asset.kind)).toEqual([
      "image-fill",
      "export-setting",
      "suggested-export",
    ]);

    type ExportedNode = {
      appearance?: { fills: Array<{ imageHash?: string }> };
      children: ExportedNode[];
      component?: { mainComponent: Record<string, unknown> };
      layout?: Record<string, unknown>;
      text?: {
        segments: Array<{ fontName: { family: string; style: string } }>;
      };
    };
    const exportedRoot = exported.root as unknown as ExportedNode;
    expect(exportedRoot.layout).toMatchObject({
      layoutMode: "VERTICAL",
      paddingLeft: 24,
      itemSpacing: 16,
    });
    expect(exportedRoot.children[0].appearance?.fills[0].imageHash).toBe(
      "image-hash"
    );
    expect(exportedRoot.children[2].text?.segments[0].fontName).toEqual({
      family: "Nunito",
      style: "Bold",
    });
    expect(exportedRoot.children[3].component?.mainComponent).toEqual({
      id: main.id,
      name: main.name,
      key: "button-key",
      remote: false,
      componentSet: {
        id: set.id,
        name: "Button",
        key: "button-set-key",
        remote: false,
      },
    });
    expect(() => JSON.stringify(exported)).not.toThrow();
  });
});
