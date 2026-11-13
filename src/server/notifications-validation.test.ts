import { describe, expect, it } from "vitest";
import { isValidConditionNode, isValidNotificationConfig } from "./notifications.js";

describe("canonical notification schema v1", () => {
  const comparison = {
    type: "comparison",
    source: { type: "logic-variable", variableId: "logic-id-123", expectedType: "boolean" },
    condition: { operator: "equals", value: true },
  };

  it("accepts a valid condition tree with stable Logic IDs, groups, duration and schedule", () => {
    expect(isValidConditionNode({
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

  it("accepts an empty schedule draft and rejects an invalid empty draft", () => {
    expect(isValidConditionNode({ type: "schedule", configured: false, weekdays: [] })).toBe(true);
    expect(isValidConditionNode({ type: "schedule", configured: false, weekdays: [1] })).toBe(false);
    expect(isValidConditionNode({ type: "schedule", configured: false, weekdays: [], startTime: "07:00" })).toBe(false);
  });

  it("rejects Logic names and malformed schedules", () => {
    expect(isValidConditionNode({
      ...comparison,
      source: { type: "logic-variable", name: "deur_open", expectedType: "boolean" },
    })).toBe(false);
    expect(isValidConditionNode({
      type: "schedule", weekdays: [1], startTime: "7:00", endTime: "20:00",
    })).toBe(false);
    expect(isValidConditionNode({
      type: "schedule", weekdays: [1], startTime: "07:00", endTime: "20:00",
      timeZone: "Mars/Olympus",
    })).toBe(false);
  });

  it("rejects duplicate duration IDs and condition trees exceeding maximum depth", () => {
    expect(isValidConditionNode({
      operator: "and",
      conditions: [
        { type: "duration", id: "same", durationMs: 1000, condition: comparison },
        { type: "duration", id: "same", durationMs: 2000, condition: comparison },
      ],
    })).toBe(false);
    let tree: unknown = comparison;
    for (let i = 0; i < 13; i++) tree = { type: "duration", id: `d-${i}`, durationMs: 1000, condition: tree };
    expect(isValidConditionNode(tree)).toBe(false);
  });


  it("accepts all six comparison operators with compatible source types", () => {
    const numberSource = { type: "logic-variable", variableId: "number-id", expectedType: "number" };
    for (const operator of ["equals", "notEquals", "lessThan", "lessThanOrEqual", "greaterThan", "greaterThanOrEqual"]) {
      expect(isValidConditionNode({ type: "comparison", source: numberSource, condition: { operator, value: 10 } })).toBe(true);
    }
    expect(isValidConditionNode({
      type: "comparison",
      source: { type: "logic-variable", variableId: "bool-id", expectedType: "boolean" },
      condition: { operator: "notEquals", value: false },
    })).toBe(true);
    expect(isValidConditionNode({
      type: "comparison",
      source: { type: "logic-variable", variableId: "bool-id", expectedType: "boolean" },
      condition: { operator: "greaterThanOrEqual", value: 1 },
    })).toBe(false);
  });

  it("accepts NOT and weekday nodes and rejects malformed versions", () => {
    expect(isValidConditionNode({ type: "not", condition: comparison })).toBe(true);
    expect(isValidConditionNode({ type: "not", condition: { type: "not", condition: comparison } })).toBe(true);
    expect(isValidConditionNode({ type: "weekday", weekdays: [1, 3, 5] })).toBe(true);
    expect(isValidConditionNode({ type: "weekday", weekdays: [] })).toBe(false);
    expect(isValidConditionNode({ type: "weekday", weekdays: [1, 1] })).toBe(false);
    expect(isValidConditionNode({ type: "weekday", weekdays: [7] })).toBe(false);
  });

  it("validates notification metadata and requires the single canonical schemaVersion 1", () => {
    const valid = {
      schemaVersion: 1, id: "front-door", title: "Voordeur open",
      message: "De voordeur staat open", severity: "warning", enabled: true,
      condition: comparison,
    };
    expect(isValidNotificationConfig(valid)).toBe(true);
    expect(isValidNotificationConfig({ ...valid, schemaVersion: 2 })).toBe(false);
    expect(isValidNotificationConfig({
      ...valid,
      source: comparison.source,
      condition: { operator: "equals", value: true },
    })).toBe(false);
    expect(isValidNotificationConfig(null)).toBe(false);
    expect(isValidNotificationConfig({ ...valid, message: 42 })).toBe(false);
    expect(isValidNotificationConfig({ ...valid, enabled: "yes" })).toBe(false);
  });

  it("enforces comparison types against their source", () => {
    const booleanSource = { type: "logic-variable", variableId: "bool-id", expectedType: "boolean" };
    const numberSource = { type: "logic-variable", variableId: "number-id", expectedType: "number" };
    expect(isValidConditionNode({ type: "comparison", source: booleanSource, condition: { operator: "lessThan", value: 10 } })).toBe(false);
    expect(isValidConditionNode({ type: "comparison", source: booleanSource, condition: { operator: "equals", value: 1 } })).toBe(false);
    expect(isValidConditionNode({ type: "comparison", source: numberSource, condition: { operator: "equals", value: true } })).toBe(false);
    expect(isValidConditionNode({ type: "comparison", source: numberSource, condition: { operator: "greaterThan", value: 10 } })).toBe(true);
    expect(isValidConditionNode({ type: "comparison", source: booleanSource, condition: { operator: "equals", value: true } })).toBe(true);
  });
});
