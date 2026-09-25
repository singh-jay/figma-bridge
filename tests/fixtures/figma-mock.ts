/**
 * Minimal in-memory stand-in for the Figma plugin API, used only by the smoke
 * test so the sync/build code paths execute outside Figma. It models the
 * subset of behaviour the plugin relies on (tree, variables, component
 * properties) and is deliberately permissive about styling properties.
 */

let idCounter = 0;
const nextId = () => `${++idCounter}:${idCounter}`;

export class MockNode {
  id = nextId();
  type: string;
  name = "";
  children: MockNode[] = [];
  parent: MockNode | null = null;
  visible = true;
  removed = false;
  width = 100;
  height = 100;
  x = 0;
  y = 0;
  fills: unknown[] = [];
  strokes: unknown[] = [];
  effects: unknown[] = [];
  layoutMode: string = "NONE";
  private _layoutSizingHorizontal = "FIXED";
  private _layoutSizingVertical = "FIXED";
  characters = "";
  fontName: unknown = null;
  componentPropertyReferences: Record<string, string> | null = null;
  boundVariables: Record<string, string> = {};
  description = "";
  vectorPaths: unknown[] = [];
  // ComponentSet / Component
  componentPropertyDefinitions: Record<
    string,
    { type: string; defaultValue: unknown }
  > = {};
  // Instance
  componentProperties: Record<string, { type: string; value: unknown }> = {};
  mainComponent: MockNode | null = null;
  [key: string]: unknown;

  constructor(type: string) {
    this.type = type;
  }

  get layoutSizingHorizontal() {
    return this._layoutSizingHorizontal;
  }

  set layoutSizingHorizontal(value: string) {
    this.assertSizing(value);
    this._layoutSizingHorizontal = value;
  }

  get layoutSizingVertical() {
    return this._layoutSizingVertical;
  }

  set layoutSizingVertical(value: string) {
    this.assertSizing(value);
    this._layoutSizingVertical = value;
  }

  private assertSizing(value: string) {
    if (
      value === "FILL" &&
      (!this.parent || this.parent.layoutMode === "NONE")
    ) {
      throw new Error(
        `Mock guard: "${this.name}" cannot use FILL sizing without an auto-layout parent`
      );
    }
    if (value === "HUG" && this.layoutMode === "NONE" && this.type !== "TEXT") {
      throw new Error(
        `Mock guard: "${this.name}" cannot HUG without auto layout`
      );
    }
  }

  set layoutGrow(value: number) {
    if (value > 0 && (!this.parent || this.parent.layoutMode === "NONE")) {
      throw new Error(
        `Mock guard: "${this.name}" cannot grow without an auto-layout parent`
      );
    }
    this._layoutGrow = value;
  }

  get layoutGrow() {
    return this._layoutGrow;
  }

  private _layoutGrow = 0;

  appendChild(child: MockNode) {
    if (child.parent)
      child.parent.children = child.parent.children.filter(
        (candidate) => candidate !== child
      );
    child.parent = this;
    this.children.push(child);
  }

  insertChild(index: number, child: MockNode) {
    if (child.parent)
      child.parent.children = child.parent.children.filter(
        (candidate) => candidate !== child
      );
    child.parent = this;
    this.children.splice(index, 0, child);
  }

  remove() {
    this.removed = true;
    if (this.parent)
      this.parent.children = this.parent.children.filter(
        (candidate) => candidate !== this
      );
  }

  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  resizeWithoutConstraints(width: number, height: number) {
    this.resize(width, height);
  }

  rescale(scale: number) {
    this.width *= scale;
    this.height *= scale;
  }

  setBoundVariable(field: string, variable: { id: string } | null) {
    if (variable) this.boundVariables[field] = variable.id;
    else delete this.boundVariables[field];
  }

  findAll(predicate: (node: MockNode) => boolean): MockNode[] {
    const out: MockNode[] = [];
    const walk = (node: MockNode) => {
      for (const child of node.children) {
        if (predicate(child)) out.push(child);
        walk(child);
      }
    };
    walk(this);
    return out;
  }

  findOne(predicate: (node: MockNode) => boolean): MockNode | null {
    return this.findAll(predicate)[0] ?? null;
  }

  async loadAsync() {
    return;
  }

  get defaultVariant() {
    return this.children[0];
  }

  addComponentProperty(name: string, type: string, defaultValue: unknown) {
    const key = `${name}#${nextId()}`;
    this.componentPropertyDefinitions[key] = { type, defaultValue };
    return key;
  }

  createInstance(): MockNode {
    const clone = cloneTree(this);
    clone.type = "INSTANCE";
    clone.mainComponent = this;
    const set =
      this.parent && this.parent.type === "COMPONENT_SET" ? this.parent : null;
    const properties: Record<string, { type: string; value: unknown }> = {};
    for (const [key, definition] of Object.entries(
      (set ?? this).componentPropertyDefinitions
    )) {
      properties[key] = {
        type: definition.type,
        value: definition.defaultValue,
      };
    }
    if (set) {
      for (const part of this.name.split(",")) {
        const [axis, value] = part.trim().split("=");
        if (axis && value) properties[axis] = { type: "VARIANT", value };
      }
    }
    clone.componentProperties = properties;
    pageOf(this)?.appendChild(clone);
    return clone;
  }

  async getMainComponentAsync(): Promise<MockNode | null> {
    return this.mainComponent;
  }

  detachInstance(): MockNode {
    const detached = cloneTree(this);
    detached.type = "FRAME";
    detached.mainComponent = null;
    if (this.parent) {
      const index = this.parent.children.indexOf(this);
      this.parent.insertChild(index, detached);
      this.remove();
    }
    return detached;
  }

  setProperties(values: Record<string, unknown>) {
    for (const [key, value] of Object.entries(values)) {
      if (!(key in this.componentProperties))
        throw new Error(`Unknown component property ${key} on ${this.name}`);
      this.componentProperties[key] = {
        ...this.componentProperties[key],
        value,
      };
    }
  }
}

function pageOf(node: MockNode): MockNode | null {
  let current: MockNode | null = node;
  while (current && current.type !== "PAGE") current = current.parent;
  return current;
}

function cloneTree(node: MockNode): MockNode {
  const copy = new MockNode(node.type);
  for (const [key, value] of Object.entries(node)) {
    if (key === "children" || key === "parent" || key === "id") continue;
    copy[key] = value;
  }
  for (const child of node.children) copy.appendChild(cloneTree(child));
  return copy;
}

export class MockVariable {
  id = nextId();
  valuesByMode: Record<string, unknown> = {};
  codeSyntax: Record<string, string> = {};
  scopes: string[] = [];
  description = "";
  removed = false;
  constructor(
    public name: string,
    public variableCollectionId: string,
    public resolvedType: string
  ) {}

  setValueForMode(modeId: string, value: unknown) {
    this.valuesByMode[modeId] = value;
  }

  setVariableCodeSyntax(platform: string, value: string) {
    this.codeSyntax[platform] = value;
  }

  remove() {
    this.removed = true;
  }
}

export class MockCollection {
  id = nextId();
  modes: Array<{ modeId: string; name: string }> = [
    { modeId: nextId(), name: "Mode 1" },
  ];
  constructor(public name: string) {}

  get defaultModeId() {
    return this.modes[0].modeId;
  }

  addMode(name: string) {
    const modeId = nextId();
    this.modes.push({ modeId, name });
    return modeId;
  }

  renameMode(modeId: string, name: string) {
    const mode = this.modes.find((candidate) => candidate.modeId === modeId);
    if (mode) mode.name = name;
  }
}

export function createFigmaMock(
  options: { fonts?: string[]; command?: string } = {}
) {
  const availableFonts = new Set(options.fonts ?? ["Nunito", "Inter"]);
  const collections: MockCollection[] = [];
  const variables: MockVariable[] = [];
  const root = new MockNode("DOCUMENT");
  const notifications: string[] = [];
  let currentPage: MockNode | null = null;

  const onPage = <T extends MockNode>(node: T): T => {
    figma.currentPage.appendChild(node);
    return node;
  };
  const figma = {
    command: options.command ?? "run-all",
    root,
    notifications,
    get currentPage() {
      if (!currentPage) {
        currentPage = new MockNode("PAGE");
        currentPage.name = "Page 1";
        root.appendChild(currentPage);
      }
      return currentPage;
    },
    createPage() {
      const page = new MockNode("PAGE");
      root.appendChild(page);
      return page;
    },
    async setCurrentPageAsync(page: MockNode) {
      currentPage = page;
    },
    createFrame: () => onPage(new MockNode("FRAME")),
    createNodeFromSvg: (svg: string) => {
      if (!svg.includes("<svg"))
        throw new Error("Mock guard: createNodeFromSvg expects SVG markup");
      const wrapper = new MockNode("FRAME");
      wrapper.resize(24, 24);
      const vector = new MockNode("VECTOR");
      wrapper.appendChild(vector);
      return onPage(wrapper);
    },
    createSection: () => {
      const section = new MockNode("SECTION");
      section.resizeWithoutConstraints = (w: number, h: number) =>
        section.resize(w, h);
      return onPage(section);
    },
    createComponent: () => onPage(new MockNode("COMPONENT")),
    createText: () => onPage(new MockNode("TEXT")),
    createRectangle: () => onPage(new MockNode("RECTANGLE")),
    createEllipse: () => onPage(new MockNode("ELLIPSE")),
    createVector: () => onPage(new MockNode("VECTOR")),
    combineAsVariants(nodes: MockNode[], parent: MockNode) {
      const set = new MockNode("COMPONENT_SET");
      parent.appendChild(set);
      for (const node of nodes) set.appendChild(node);
      return set;
    },
    async loadFontAsync(font: { family: string; style: string }) {
      if (!availableFonts.has(font.family))
        throw new Error(`Font ${font.family} ${font.style} unavailable`);
    },
    notify(message: string) {
      notifications.push(message);
    },
    closePlugin() {
      return;
    },
    viewport: { scrollAndZoomIntoView: () => undefined },
    variables: {
      async getLocalVariableCollectionsAsync() {
        return collections;
      },
      async getLocalVariablesAsync() {
        return variables.filter((variable) => !variable.removed);
      },
      createVariableCollection(name: string) {
        const collection = new MockCollection(name);
        collections.push(collection);
        return collection;
      },
      createVariable(name: string, collection: MockCollection, type: string) {
        if (!name.startsWith("--"))
          throw new Error(
            `Mock guard: variable name ${name} is not a StyleX key`
          );
        const variable = new MockVariable(name, collection.id, type);
        variables.push(variable);
        return variable;
      },
      createVariableAlias(variable: MockVariable) {
        return { type: "VARIABLE_ALIAS", id: variable.id };
      },
      setBoundVariableForPaint(
        paint: Record<string, unknown>,
        field: string,
        variable: MockVariable
      ) {
        return {
          ...paint,
          boundVariables: {
            [field]: { type: "VARIABLE_ALIAS", id: variable.id },
          },
        };
      },
    },
    _state: { collections, variables },
  };
  return figma;
}
