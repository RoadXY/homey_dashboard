import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cameraPopupRealtime,
  closeCameraPopup,
  getActiveCameraPopup,
  getActiveCameraPopupVideoId,
  showCameraPopup,
  validateCameraPopupInput,
} from "./camera-popup.js";

const DEVICE_ID = "3443e053-b510-43e2-bbeb-918307ef27ce";
const VIDEO_ID = "c8ef9f29-2b74-4a89-9de5-0bf447d0ee9c";
const NOW = Date.parse("2026-11-27T15:00:00.000Z");

function validInput(overrides: Record<string, unknown> = {}) {
  return { title: "Achterdeur open", deviceId: DEVICE_ID, ...overrides };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  closeCameraPopup("api");
  cameraPopupRealtime.removeAllListeners();
  vi.useRealTimers();
});

describe("validateCameraPopupInput", () => {
  it("accepts a title and a camera device id, and keeps the optional fields", () => {
    expect(validateCameraPopupInput(validInput(), NOW)).toEqual({ title: "Achterdeur open", deviceId: DEVICE_ID });
    // 16:00:30+01:00 is 15:00:30Z, which is 30 seconds after the test clock.
    expect(validateCameraPopupInput(validInput({ sound: "doorbell", expiresAt: "2026-11-27T16:00:30+01:00" }), NOW))
      .toMatchObject({ sound: "doorbell", expiresAt: "2026-11-27T15:00:30.000Z" });
  });

  it("trims the title and rejects empty or overly long titles", () => {
    expect(validateCameraPopupInput(validInput({ title: "  Deurbel  " }), NOW).title).toBe("Deurbel");
    expect(() => validateCameraPopupInput(validInput({ title: "   " }), NOW)).toThrow("title must contain 1 to 120 characters");
    expect(() => validateCameraPopupInput(validInput({ title: "x".repeat(121) }), NOW)).toThrow("1 to 120");
  });

  it("rejects unknown fields and invalid device ids", () => {
    expect(() => validateCameraPopupInput(validInput({ cameraName: "garage" }), NOW)).toThrow("Unknown field(s): cameraName");
    expect(() => validateCameraPopupInput(validInput({ deviceId: "garage" }), NOW)).toThrow("deviceId must be");
    expect(() => validateCameraPopupInput(null, NOW)).toThrow("JSON object");
  });

  it("only accepts built-in sounds", () => {
    expect(() => validateCameraPopupInput(validInput({ sound: "siren" }), NOW)).toThrow("sound must be one of");
  });

  it("applies the same expiresAt rules as API notifications and caps the duration at 24 hours", () => {
    expect(() => validateCameraPopupInput(validInput({ expiresAt: "2026-11-27T15:00:30" }), NOW)).toThrow("timezone");
    expect(() => validateCameraPopupInput(validInput({ expiresAt: "2026-11-27T14:00:00Z" }), NOW)).toThrow("in the future");
    expect(() => validateCameraPopupInput(validInput({ expiresAt: "2026-11-29T15:00:00Z" }), NOW)).toThrow("within 24 hours");
  });
});

describe("camera popup state", () => {
  const camera = { cameraName: "Camera garage", videoId: VIDEO_ID };

  it("publishes the popup without exposing the internal video id", () => {
    const shown = showCameraPopup(validInput(), camera);
    expect(shown).toMatchObject({ title: "Achterdeur open", deviceId: DEVICE_ID, cameraName: "Camera garage", sound: null, expiresAt: null });
    expect(shown).not.toHaveProperty("videoId");
    expect(getActiveCameraPopup()).toEqual(shown);
    expect(getActiveCameraPopupVideoId()).toBe(VIDEO_ID);
  });

  it("replaces the current popup when a new event arrives", () => {
    const shown: unknown[] = [];
    cameraPopupRealtime.on("show", (popup) => shown.push(popup));
    const first = showCameraPopup(validInput({ title: "Eerste" }), camera);
    const second = showCameraPopup(validInput({ title: "Tweede" }), { cameraName: "Camera achtertuin", videoId: "13974d07-7abc-4479-bd3e-5e33b42de8a1" });
    expect(shown).toHaveLength(2);
    expect(second.id).not.toBe(first.id);
    expect(getActiveCameraPopup()?.title).toBe("Tweede");
    expect(getActiveCameraPopupVideoId()).toBe("13974d07-7abc-4479-bd3e-5e33b42de8a1");
  });

  it("closes only the matching popup when an id is given", () => {
    const closed: unknown[] = [];
    cameraPopupRealtime.on("closed", (event) => closed.push(event));
    const shown = showCameraPopup(validInput(), camera);
    expect(closeCameraPopup("dismissed", "00000000-0000-4000-8000-000000000000")).toBe(false);
    expect(getActiveCameraPopup()).not.toBeNull();
    expect(closeCameraPopup("dismissed", shown.id)).toBe(true);
    expect(closed).toEqual([expect.objectContaining({ id: shown.id, reason: "dismissed" })]);
    expect(getActiveCameraPopup()).toBeNull();
    expect(getActiveCameraPopupVideoId()).toBeNull();
  });

  it("closes automatically when expiresAt is reached", () => {
    const closed: unknown[] = [];
    cameraPopupRealtime.on("closed", (event) => closed.push(event));
    showCameraPopup(validInput({ expiresAt: new Date(NOW + 10_000).toISOString() }), camera);
    vi.advanceTimersByTime(9_999);
    expect(getActiveCameraPopup()).not.toBeNull();
    vi.advanceTimersByTime(1);
    expect(getActiveCameraPopup()).toBeNull();
    expect(closed).toEqual([expect.objectContaining({ reason: "expired" })]);
  });

  it("stays open without expiresAt until it is closed or replaced", () => {
    showCameraPopup(validInput(), camera);
    vi.advanceTimersByTime(60 * 60 * 1000);
    expect(getActiveCameraPopup()).not.toBeNull();
  });

  it("does not let the expiry timer of a replaced popup close its successor", () => {
    showCameraPopup(validInput({ expiresAt: new Date(NOW + 5_000).toISOString() }), camera);
    const second = showCameraPopup(validInput({ title: "Blijft staan" }), camera);
    vi.advanceTimersByTime(10_000);
    expect(getActiveCameraPopup()?.id).toBe(second.id);
  });
});
