import { describe, expect, it } from "vitest";
import { evaluateDurationGate, isScheduleActive } from "./notification-conditions.js";

describe("isScheduleActive", () => {
  const weekdays = [1, 2, 3, 4, 5, 6];
  const schedule = {
    weekdays,
    startTime: "07:00",
    endTime: "20:00",
    timeZone: "Europe/Amsterdam",
  };

  it("uses local wall-clock time and includes the start but excludes the end", () => {
    expect(isScheduleActive(schedule, new Date("2026-11-16T06:00:00.000Z"))).toBe(true);
    expect(isScheduleActive(schedule, new Date("2026-11-16T19:00:00.000Z"))).toBe(false);
    expect(isScheduleActive(schedule, new Date("2026-11-16T05:59:00.000Z"))).toBe(false);
  });

  it("supports a different Sunday start time", () => {
    const sunday = { weekdays: [0], startTime: "08:00", endTime: "20:00", timeZone: "Europe/Amsterdam" };
    expect(isScheduleActive(sunday, new Date("2026-11-15T07:00:00.000Z"))).toBe(true);
    expect(isScheduleActive(sunday, new Date("2026-11-15T06:59:00.000Z"))).toBe(false);
  });

  it("attributes an overnight interval to the day on which it starts", () => {
    const overnight = { weekdays: [1], startTime: "22:00", endTime: "07:00", timeZone: "Europe/Amsterdam" };
    expect(isScheduleActive(overnight, new Date("2026-11-16T22:30:00.000Z"))).toBe(true);
    expect(isScheduleActive(overnight, new Date("2026-11-17T05:30:00.000Z"))).toBe(true);
    expect(isScheduleActive(overnight, new Date("2026-11-17T07:00:00.000Z"))).toBe(false);
  });

  it("rejects invalid schedule definitions", () => {
    expect(() => isScheduleActive({ ...schedule, startTime: "7:00" }, new Date())).toThrow();
    expect(() => isScheduleActive({ ...schedule, endTime: "07:00" }, new Date())).toThrow();
  });
});

describe("evaluateDurationGate", () => {
  it("activates only after the child stayed active for the full duration", () => {
    const activeSince = new Map<string, number>();
    expect(evaluateDurationGate("rule:block", { state: "active" }, 5_000, 1_000, activeSince)).toEqual({ state: "inactive", reevaluateAt: 6_000 });
    expect(evaluateDurationGate("rule:block", { state: "active" }, 5_000, 5_999, activeSince)).toEqual({ state: "inactive", reevaluateAt: 6_000 });
    expect(evaluateDurationGate("rule:block", { state: "active" }, 5_000, 6_000, activeSince)).toEqual({ state: "active" });
  });

  it("resets the timer when the child becomes inactive or unknown", () => {
    const activeSince = new Map<string, number>();
    evaluateDurationGate("rule:block", { state: "active" }, 5_000, 1_000, activeSince);
    expect(evaluateDurationGate("rule:block", { state: "inactive" }, 5_000, 2_000, activeSince)).toEqual({ state: "inactive" });
    expect(activeSince.has("rule:block")).toBe(false);
    expect(evaluateDurationGate("rule:block", { state: "active" }, 5_000, 3_000, activeSince)).toEqual({ state: "inactive", reevaluateAt: 8_000 });
    expect(evaluateDurationGate("rule:block", { state: "unknown", reason: "source_unavailable" }, 5_000, 4_000, activeSince)).toEqual({ state: "unknown", reason: "source_unavailable" });
    expect(activeSince.has("rule:block")).toBe(false);
  });

  it("keeps the original deadline when the condition is checked repeatedly", () => {
    const activeSince = new Map<string, number>();
    const first = evaluateDurationGate("rule:block", { state: "active" }, 5_000, 1_000, activeSince);
    const second = evaluateDurationGate("rule:block", { state: "active" }, 5_000, 3_500, activeSince);
    expect(first.reevaluateAt).toBe(6_000);
    expect(second.reevaluateAt).toBe(6_000);
  });

  it("returns unknown for an invalid duration", () => {
    expect(evaluateDurationGate("rule:block", { state: "active" }, 0, 1_000, new Map())).toEqual({
      state: "unknown", reason: "duration_invalid",
    });
  });
});
