/**
 * Camera popup events: an external caller (for example a Homey Flow) asks the
 * dashboard to show a live camera feed with a title.
 *
 * Rules:
 * - Only one popup is active. A new event replaces the current one.
 * - `expiresAt` is optional and follows the same rules as API notifications.
 *   Without it the popup stays open until it is dismissed or replaced.
 * - Only Homey cameras with live video can be used. Snapshot-only devices are rejected.
 * - The camera name comes from the Homey device name; the caller does not send it.
 * - `sound` is optional and must be one of the built-in sounds in `public/sounds`.
 */
import { EventEmitter } from "node:events";
import { randomUUID } from "node:crypto";
import { ApiNotificationValidationError, parseExpiry, validateText } from "./notifications-api.js";

export const CAMERA_POPUP_SOUNDS = ["doorbell", "alert", "chime"] as const;
export type CameraPopupSound = (typeof CAMERA_POPUP_SOUNDS)[number];

export const CAMERA_POPUP_MAX_DURATION_MS = 24 * 60 * 60 * 1000;

export type CameraPopupInput = {
  title: string;
  deviceId: string;
  expiresAt?: string;
  sound?: CameraPopupSound;
};

export type CameraPopup = {
  id: string;
  title: string;
  deviceId: string;
  cameraName: string;
  sound: CameraPopupSound | null;
  shownAt: string;
  expiresAt: string | null;
};

type ActiveCameraPopup = CameraPopup & { videoId: string };

export type CameraPopupCloseReason = "api" | "dismissed" | "expired";

const ALLOWED_KEYS = ["title", "deviceId", "expiresAt", "sound"] as const;
const DEVICE_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Emits "show" with a CameraPopup and "closed" with { id, reason, closedAt }. */
export const cameraPopupRealtime = new EventEmitter();

let active: ActiveCameraPopup | null = null;
let expiryTimer: ReturnType<typeof setTimeout> | null = null;

export function validateCameraPopupInput(body: unknown, now = Date.now()): CameraPopupInput {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new ApiNotificationValidationError("The request body must be a JSON object.");
  }
  const value = body as Record<string, unknown>;
  const unknown = Object.keys(value).filter((key) => !(ALLOWED_KEYS as readonly string[]).includes(key));
  if (unknown.length) throw new ApiNotificationValidationError("Unknown field(s): " + unknown.join(", ") + ".");

  const title = validateText(value.title, "title", 120);
  if (typeof value.deviceId !== "string" || !DEVICE_ID_PATTERN.test(value.deviceId)) {
    throw new ApiNotificationValidationError("deviceId must be the Homey device UUID of a camera.");
  }
  const expiresAt = parseExpiry(value.expiresAt, now);
  if (expiresAt && Date.parse(expiresAt) - now > CAMERA_POPUP_MAX_DURATION_MS) {
    throw new ApiNotificationValidationError("expiresAt must be within 24 hours.");
  }
  if (value.sound !== undefined && !(CAMERA_POPUP_SOUNDS as readonly unknown[]).includes(value.sound)) {
    throw new ApiNotificationValidationError("sound must be one of: " + CAMERA_POPUP_SOUNDS.join(", ") + ".");
  }
  return {
    title,
    deviceId: value.deviceId,
    ...(expiresAt ? { expiresAt } : {}),
    ...(value.sound !== undefined ? { sound: value.sound as CameraPopupSound } : {}),
  };
}

export function getActiveCameraPopup(now = Date.now()): CameraPopup | null {
  if (active && active.expiresAt && Date.parse(active.expiresAt) <= now) {
    closeCameraPopup("expired");
  }
  return active ? toPublic(active) : null;
}

/** The video a popup stream may use. Only the active popup's camera is reachable. */
export function getActiveCameraPopupVideoId(now = Date.now()): string | null {
  getActiveCameraPopup(now);
  return active ? active.videoId : null;
}

export function showCameraPopup(
  input: CameraPopupInput,
  camera: { cameraName: string; videoId: string },
): CameraPopup {
  clearExpiryTimer();
  const popup: ActiveCameraPopup = {
    id: randomUUID(),
    title: input.title,
    deviceId: input.deviceId,
    cameraName: camera.cameraName,
    sound: input.sound ?? null,
    shownAt: new Date().toISOString(),
    expiresAt: input.expiresAt ?? null,
    videoId: camera.videoId,
  };
  active = popup;
  if (popup.expiresAt) {
    const delay = Math.max(0, Date.parse(popup.expiresAt) - Date.now());
    expiryTimer = setTimeout(() => closeCameraPopup("expired", popup.id), delay);
    expiryTimer.unref();
  }
  const published = toPublic(popup);
  cameraPopupRealtime.emit("show", published);
  return published;
}

/** Closes the active popup, or the popup with `id` when given. Returns false when nothing matched. */
export function closeCameraPopup(reason: CameraPopupCloseReason, id?: string): boolean {
  if (!active || (id !== undefined && id !== active.id)) return false;
  const closedId = active.id;
  clearExpiryTimer();
  active = null;
  cameraPopupRealtime.emit("closed", { id: closedId, reason, closedAt: new Date().toISOString() });
  return true;
}

function clearExpiryTimer(): void {
  if (expiryTimer) clearTimeout(expiryTimer);
  expiryTimer = null;
}

function toPublic(popup: ActiveCameraPopup): CameraPopup {
  const { videoId: _videoId, ...publicPopup } = popup;
  return publicPopup;
}
