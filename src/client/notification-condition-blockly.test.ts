import { describe, expect, it } from "vitest";
import {
  comparisonValueFromBlockly,
  durationNodeFromBlockly,
  durationNodeToBlockly,
  sourceFromKey,
  sourceKeyFromNode,
} from "./notification-condition-blockly";

const catalog = {
  devices: [
    { id: "device-123", capabilities: [{ id: "measure_temperature", type: "number" as const }, { id: "alarm_contact", type: "boolean" as const }] },
  ],
  variables: [
    { id: "logic-co2", type: "number" as const },
    { id: "logic-window", type: "boolean" as const },
  ],
};

describe("Blockly Homey source conversion", () => {
  it("resolves a device capability by stable IDs and converts it back to a key", () => {
    const source = sourceFromKey("device:device-123:measure_temperature", catalog);
    expect(source).toEqual({
      type: "device-capability",
      deviceId: "device-123",
      capabilityId: "measure_temperature",
      expectedType: "number",
    });
    expect(sourceKeyFromNode(source)).toBe("device:device-123:measure_temperature");
  });

  it("resolves a Logic variable by stable ID", () => {
    const source = sourceFromKey("logic:logic-window", catalog);
    expect(source).toEqual({ type: "logic-variable", variableId: "logic-window", expectedType: "boolean" });
    expect(sourceKeyFromNode(source)).toBe("logic:logic-window");
  });

  it("rejects missing and malformed source keys instead of guessing", () => {
    expect(sourceFromKey("device:missing:measure_temperature", catalog)).toBeNull();
    expect(sourceFromKey("device:device-123", catalog)).toBeNull();
    expect(sourceFromKey("logic:missing", catalog)).toBeNull();
    expect(sourceFromKey("logic:logic-co2", null)).toBeNull();
  });

  it("parses numeric and boolean comparison values according to the source datatype", () => {
    const numeric = sourceFromKey("logic:logic-co2", catalog)!;
    const boolean = sourceFromKey("logic:logic-window", catalog)!;
    expect(comparisonValueFromBlockly(numeric, "greaterThanOrEqual", "1000")).toBe(1000);
    expect(comparisonValueFromBlockly(boolean, "notEquals", "false")).toBe(false);
    expect(() => comparisonValueFromBlockly(numeric, "lessThan", "not-a-number")).toThrow();
    expect(() => comparisonValueFromBlockly(numeric, "equals", " ")).toThrow();
    expect(() => comparisonValueFromBlockly(boolean, "greaterThan", "true")).toThrow();
    expect(() => comparisonValueFromBlockly(boolean, "equals", "yes")).toThrow();
  });
});

describe("Blockly duration conversion", () => {
  it("round-trips an active duration and preserves its stable ID", () => {
    const original = { type: "duration", id: "duration-stable-1", durationMs: 300000, condition: { type: "weekday", weekdays: [1, 2] } };
    const block = durationNodeToBlockly(original);
    expect(block).toEqual({
      blockType: "homey_condition_duration",
      minutes: 5,
      child: original.condition,
      id: "duration-stable-1",
    });
    expect(durationNodeFromBlockly("new-block-id", block.id, block.minutes, block.child, false)).toEqual(original);
  });

  it("round-trips an inactive duration as duration(not(condition))", () => {
    const child = { type: "comparison", source: { type: "logic-variable", variableId: "logic-window" }, condition: { operator: "equals", value: true } };
    const original = { type: "duration", id: "duration-inactive-2", durationMs: 600000, condition: { type: "not", condition: child } };
    const block = durationNodeToBlockly(original);
    expect(block).toEqual({
      blockType: "homey_condition_duration_inactive",
      minutes: 10,
      child,
      id: "duration-inactive-2",
    });
    expect(durationNodeFromBlockly("new-block-id", block.id, block.minutes, block.child, true)).toEqual(original);
  });

  it("uses a generated ID only for a newly created duration block", () => {
    expect(durationNodeFromBlockly("generated-id", null, 1, { type: "weekday", weekdays: [0] }, false)).toEqual({
      type: "duration",
      id: "generated-id",
      durationMs: 60000,
      condition: { type: "weekday", weekdays: [0] },
    });
  });

  it("rejects invalid duration values and missing children", () => {
    const child = { type: "weekday", weekdays: [1] };
    expect(() => durationNodeFromBlockly("id", null, 0, child, false)).toThrow();
    expect(() => durationNodeFromBlockly("id", null, 1441, child, false)).toThrow();
    expect(() => durationNodeFromBlockly("id", null, 5, null, false)).toThrow();
  });
});
