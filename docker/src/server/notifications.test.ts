import { describe, expect, it } from "vitest";
import { combineConditionResults, evaluateBlocklyVisibilityTimeout, isValidBlocklyNotificationTimeout, mergeNotificationConfigs, parseNotificationConfigJson } from "./notifications.js";

describe("combineConditionResults", () => {
  it("requires every child to be active for AND", () => {
    expect(combineConditionResults("and", [
      { state: "active" },
      { state: "active" },
    ])).toEqual({ state: "active" });
    expect(combineConditionResults("and", [
      { state: "active" },
      { state: "inactive" },
    ])).toEqual({ state: "inactive" });
  });

  it("requires at least one active child for OR", () => {
    expect(combineConditionResults("or", [
      { state: "inactive" },
      { state: "active" },
    ])).toEqual({ state: "active" });
    expect(combineConditionResults("or", [
      { state: "inactive" },
      { state: "inactive" },
    ])).toEqual({ state: "inactive" });
  });

  it("propagates unknown when the result cannot be determined", () => {
    expect(combineConditionResults("and", [
      { state: "active" },
      { state: "unknown", reason: "source_unavailable" },
    ])).toEqual({ state: "unknown", reason: "source_unavailable" });
    expect(combineConditionResults("or", [
      { state: "inactive" },
      { state: "unknown", reason: "source_missing" },
    ])).toEqual({ state: "unknown", reason: "source_missing" });
  });

  it("keeps a decisive false for AND and true for OR despite another unknown child", () => {
    expect(combineConditionResults("and", [
      { state: "inactive" },
      { state: "unknown", reason: "source_unavailable" },
    ])).toEqual({ state: "inactive" });
    expect(combineConditionResults("or", [
      { state: "active" },
      { state: "unknown", reason: "source_unavailable" },
    ])).toEqual({ state: "active" });
  });

  it("preserves the earliest pending duration deadline through nested condition groups", () => {
    expect(combineConditionResults("and", [
      { state: "active" },
      { state: "inactive", reevaluateAt: 8_000 },
      { state: "inactive", reevaluateAt: 6_000 },
    ])).toEqual({ state: "inactive", reevaluateAt: 6_000 });
  });
});

describe("parseNotificationConfigJson", () => {
  it("accepts normal JSON with a real trailing newline", () => {
    expect(parseNotificationConfigJson('[{"id":"test"}]\n')).toEqual([{ id: "test" }]);
  });

  it("repairs the literal escaped newline written by the previous serializer", () => {
    expect(parseNotificationConfigJson('[{"id":"test"}]\\n')).toEqual([{ id: "test" }]);
  });

  it("still rejects unrelated trailing data", () => {
    expect(() => parseNotificationConfigJson('[{"id":"test"}] garbage')).toThrow();
  });
});

describe("mergeNotificationConfigs", () => {
  const config = (id: string, title: string) => ({
    schemaVersion: 1 as const,
    id,
    title,
    notificationTitle: title,
    message: "",
    severity: "info" as const,
    enabled: true,
    condition: { type: "schedule" as const, configured: false as const, weekdays: [] as number[] },
  });

  it("keeps deleted default notifications out of the settings list", () => {
    const defaults = [config("default-a", "A"), config("default-b", "B")];
    expect(mergeNotificationConfigs(defaults, [], ["default-a"]).map((item) => item.id)).toEqual(["default-b"]);
  });

  it("allows saved notification overrides while preserving non-deleted defaults", () => {
    const defaults = [config("default-a", "Old title"), config("default-b", "B")];
    const saved = [config("default-a", "Updated title"), config("custom", "Custom")];
    expect(mergeNotificationConfigs(defaults, saved, []).map((item) => item.title)).toEqual(["Updated title", "B", "Custom"]);
  });
});


describe("Blockly notification visibility timeout", () => {
  it("accepts only the approved fixed timeout values", () => {
    expect(isValidBlocklyNotificationTimeout(60_000)).toBe(true);
    expect(isValidBlocklyNotificationTimeout(86_400_000)).toBe(true);
    expect(isValidBlocklyNotificationTimeout(90_000)).toBe(false);
    expect(isValidBlocklyNotificationTimeout("60000")).toBe(false);
  });

  it("starts a visibility window on the first active condition", () => {
    expect(evaluateBlocklyVisibilityTimeout("timeout-start-test", "active", 60_000, 1_000))
      .toEqual({ state: "active", nextEvaluationAt: 61_000 });
    expect(evaluateBlocklyVisibilityTimeout("timeout-start-test", "active", 60_000, 10_000))
      .toEqual({ state: "active", nextEvaluationAt: 61_000 });
  });

  it("keeps the notification visible when the condition becomes inactive before expiry", () => {
    evaluateBlocklyVisibilityTimeout("timeout-inactive-test", "active", 60_000, 1_000);
    expect(evaluateBlocklyVisibilityTimeout("timeout-inactive-test", "inactive", 60_000, 20_000))
      .toEqual({ state: "active", nextEvaluationAt: 61_000 });
  });

  it("does not restart the timer when the condition reactivates", () => {
    evaluateBlocklyVisibilityTimeout("timeout-reactivate-test", "active", 60_000, 1_000);
    evaluateBlocklyVisibilityTimeout("timeout-reactivate-test", "inactive", 60_000, 20_000);
    expect(evaluateBlocklyVisibilityTimeout("timeout-reactivate-test", "active", 60_000, 30_000))
      .toEqual({ state: "active", nextEvaluationAt: 61_000 });
  });

  it("hides the notification at the original expiry deadline", () => {
    evaluateBlocklyVisibilityTimeout("timeout-expiry-test", "active", 60_000, 1_000);
    expect(evaluateBlocklyVisibilityTimeout("timeout-expiry-test", "inactive", 60_000, 61_000))
      .toEqual({ state: "inactive" });
  });
});
