import { test, expect } from "bun:test";

import { readResources } from "../src/figma/resources";
test("variant definitions come from the component set and alias cycles terminate", async () => {
  const definitions = { label: { type: "TEXT", defaultValue: "Fixture" } };
  const component = {
    id: "variant",
    name: "Fixture",
    type: "COMPONENT",
    remote: false,
    parent: {
      id: "set",
      type: "COMPONENT_SET",
      componentPropertyDefinitions: definitions,
    },
    children: [],
    get componentPropertyDefinitions() {
      throw new Error("Variant getter unavailable");
    },
  };
  const api = {
    getNodeByIdAsync: async () => component,
    variables: {
      getVariableByIdAsync: async (id: string) => ({
        id,
        name: id,
        remote: false,
        variableCollectionId: "collection",
        valuesByMode: {
          default: { type: "VARIABLE_ALIAS", id: id === "a" ? "b" : "a" },
        },
      }),
      getVariableCollectionByIdAsync: async () => ({
        id: "collection",
        name: "Fixture",
        modes: [],
        defaultModeId: "default",
      }),
    },
  } as unknown as PluginAPI;
  const result = await readResources(api, {
    sessionId: "s",
    variableIds: ["a"],
    componentIds: ["variant"],
  });
  expect(result.variables).toHaveLength(2);
  expect(result.complete).toBe(true);
  expect(result.components[0]).toMatchObject({
    componentPropertyDefinitions: definitions,
    componentSetId: "set",
  });
});
