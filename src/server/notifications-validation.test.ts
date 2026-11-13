import { describe, expect, it } from "vitest";
import { isValidConditionNode, isValidConditionNodeV2, isValidNotificationConfig, normalizeNotificationConfig } from "./notifications.js";

describe("isValidConditionNode", () => {
  const leaf = {
    source: { type: "logic-variable", name: "deur_open", expectedType: "boolean" },
    condition: { operator: "equals", value: true },
  };

  it("accepts valid schedules, including a valid IANA timezone", () => {
    expect(isValidConditionNode({
      type: "schedule", weekdays: [1, 2, 3, 4, 5], startTime: "07:00",
      endTime: "20:00", timeZone: "Europe/Amsterdam",
    })).toBe(true);
  });

  it("rejects malformed times and unknown timezones", () => {
    expect(isValidConditionNode({
      type: "schedule", weekdays: [1], startTime: "7:00", endTime: "20:00",
    })).toBe(false);
    expect(isValidConditionNode({
      type: "schedule", weekdays: [1], startTime: "07:00", endTime: "20:00",
      timeZone: "Mars/Olympus",
    })).toBe(false);
  });

  it("rejects duplicate duration IDs", () => {
    expect(isValidConditionNode({
      operator: "and",
      conditions: [
        { type: "duration", id: "same", durationMs: 1000, condition: leaf },
        { type: "duration", id: "same", durationMs: 2000, condition: leaf },
      ],
    })).toBe(false);
  });

  it("rejects condition trees exceeding the maximum depth", () => {
    let tree: unknown = leaf;
    for (let i = 0; i < 13; i++) tree = { type: "duration", id: `d-${i}`, durationMs: 1000, condition: tree };
    expect(isValidConditionNode(tree)).toBe(false);
  });
});

describe("isValidNotificationConfig", () => {
  const valid = {
    schemaVersion: 1, id: "front-door", title: "Voordeur open",
    message: "De voordeur staat open", severity: "warning", enabled: true,
    condition: {
      source: { type: "logic-variable", name: "deur_open", expectedType: "boolean" },
      condition: { operator: "equals", value: true },
    },
  };

  it("accepts valid tree and legacy configurations", () => {
    expect(isValidNotificationConfig(valid)).toBe(true);
    expect(isValidNotificationConfig({
      ...valid,
      source: valid.condition.source,
      condition: valid.condition.condition,
    })).toBe(true);
  });

  it("rejects malformed config objects safely", () => {
    expect(isValidNotificationConfig(null)).toBe(false);
    expect(isValidNotificationConfig({ ...valid, message: 42 })).toBe(false);
    expect(isValidNotificationConfig({ ...valid, enabled: "yes" })).toBe(false);
  });

  it("rejects comparisons that do not match the source type", () => {
    const booleanSource = { type: "logic-variable", name: "deur_open", expectedType: "boolean" };
    const numberSource = { type: "logic-variable", name: "temperatuur", expectedType: "number" };

    expect(isValidConditionNode({
      source: booleanSource,
      condition: { operator: "lessThan", value: 10 },
    })).toBe(false);
    expect(isValidConditionNode({
      source: booleanSource,
      condition: { operator: "equals", value: 1 },
    })).toBe(false);
    expect(isValidConditionNode({
      source: numberSource,
      condition: { operator: "equals", value: true },
    })).toBe(false);
    expect(isValidConditionNode({
      source: numberSource,
      condition: { operator: "greaterThan", value: 10 },
    })).toBe(true);
    expect(isValidConditionNode({
      source: booleanSource,
      condition: { operator: "equals", value: true },
    })).toBe(true);
  });

  it("applies source/condition type validation to legacy configurations too", () => {
    expect(isValidNotificationConfig({
      ...valid,
      source: { type: "logic-variable", name: "temperatuur", expectedType: "number" },
      condition: { operator: "equals", value: true },
    })).toBe(false);
  });
});


describe("notification schema version 2", () => {
  const comparison = {
    type: "comparison",
    source: { type: "logic-variable", variableId: "logic-id-123", expectedType: "boolean" },
    condition: { operator: "equals", value: true },
  };

  it("accepts a version 2 tree with stable Logic IDs and composable nodes", () => {
    expect(isValidConditionNodeV2({
      operator: "and",
      conditions: [
        comparison,
        {
          type: "duration", id: "hold-door-open", durationMs: 60_000,
          condition: {
            type: "schedule", weekdays: [1, 2, 3, 4, 5],
            startTime: "07:00", endTime: "22:00", timeZone: "Europe/Amsterdam",
          },
        },
      ],
    })).toBe(true);
  });

  it("rejects legacy Logic names in version 2 and stable IDs in version 1", () => {
    expect(isValidConditionNodeV2({
      ...comparison,
      source: { type: "logic-variable", name: "deur_open", expectedType: "boolean" },
    })).toBe(false);
    expect(isValidConditionNode({
      ...comparison,
      source: { type: "logic-variable", variableId: "logic-id-123", expectedType: "boolean" },
    })).toBe(false);
  });

  it("accepts a version 2 notification config only with a condition tree", () => {
    expect(isValidNotificationConfig({
      schemaVersion: 2, id: "v2-rule", title: "V2 regel", message: "Test",
      severity: "info", enabled: true, condition: comparison,
    })).toBe(true);
    expect(isValidNotificationConfig({
      schemaVersion: 2, id: "v2-legacy", title: "Oud formaat", message: "Test",
      severity: "info", enabled: true,
      source: { type: "logic-variable", name: "deur_open", expectedType: "boolean" },
      condition: { operator: "equals", value: true },
    })).toBe(false);
  });

  it("normalizes legacy leaf and top-level source formats into explicit comparisons", () => {
    const legacyTree = {
      schemaVersion: 1 as const, id: "legacy-tree", title: "Legacy", message: "",
      severity: "warning" as const, enabled: true,
      condition: {
        operator: "and" as const,
        conditions: [{
          source: { type: "logic-variable" as const, name: "deur_open", expectedType: "boolean" as const },
          condition: { operator: "equals" as const, value: true },
        }],
      },
    };
    expect(normalizeNotificationConfig(legacyTree).condition).toEqual({
      operator: "and",
      conditions: [{
        type: "comparison",
        source: { type: "logic-variable", name: "deur_open", expectedType: "boolean" },
        condition: { operator: "equals", value: true },
      }],
    });

    const legacyLeaf = {
      schemaVersion: 1 as const, id: "legacy-leaf", title: "Legacy leaf", message: "",
      severity: "warning" as const, enabled: true,
      source: { type: "logic-variable" as const, name: "deur_open", expectedType: "boolean" as const },
      condition: { operator: "equals" as const, value: true },
    };
    expect(normalizeNotificationConfig(legacyLeaf).condition).toEqual({
      type: "comparison",
      source: legacyLeaf.source,
      condition: legacyLeaf.condition,
    });
  });
});
