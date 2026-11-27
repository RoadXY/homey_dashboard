/**
 * Homey camera access through Homey's own, vendor-neutral camera abstraction.
 *
 * Every Homey camera app (UniFi Protect, Reolink, Ring, ...) registers its
 * snapshot via `Device.setCameraImage()` and its stream via
 * `Device.setCameraVideo()`. Homey exposes those as:
 *
 * - `device.images[].imageObj` -> ManagerImages (public Web API), served at `/api/image/<id>`;
 * - `device.videos[].videoObj` -> ManagerVideos (marked *private* in the
 *   homey-api specification). Homey Pro converts RTSP/HLS/... streams to WebRTC
 *   with its built-in go2rtc daemon; `videoOffer` accepts a browser SDP offer
 *   and returns an SDP answer plus a `streamId` that must be kept alive.
 *
 * The dashboard never talks to the cameras or the camera vendor directly.
 * go2rtc does not transcode: the browser must support the camera's codec
 * (for example H.265) for WebRTC playback.
 */
import { getHomeyConnectionConfig, requireHomeyApi } from "./homey.js";

export type HomeyCameraVideo = { id: string; title: string; type: string };
export type HomeyCameraSnapshot = { id: string; title: string };
export type HomeyCamera = {
  deviceId: string;
  name: string;
  zoneId: string | null;
  available: boolean;
  snapshot: HomeyCameraSnapshot | null;
  videos: HomeyCameraVideo[];
};

export class CameraRequestError extends Error {
  constructor(message: string, readonly statusCode: number) {
    super(message);
  }
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_SDP_LENGTH = 100_000;
const MAX_STREAM_ID_LENGTH = 200;
const SNAPSHOT_TIMEOUT_MS = 15_000;

type DeviceMediaEntry = {
  type?: unknown;
  id?: unknown;
  title?: unknown;
  imageObj?: { id?: unknown; url?: unknown };
  videoObj?: { id?: unknown; type?: unknown };
};

function asEntries(value: unknown): DeviceMediaEntry[] {
  return Array.isArray(value) ? value.filter((entry) => entry && typeof entry === "object") as DeviceMediaEntry[] : [];
}

function cameraImageEntry(device: Record<string, unknown>): DeviceMediaEntry | undefined {
  return asEntries(device.images).find((entry) =>
    entry.type === "camera" && typeof entry.imageObj?.id === "string" && typeof entry.imageObj?.url === "string");
}

/** Derive the camera list from Homey devices: every device with a video or a camera-type image. */
export function listCamerasFromDevices(devices: Record<string, unknown>): HomeyCamera[] {
  return Object.values(devices).flatMap((value) => {
    if (!value || typeof value !== "object") return [];
    const device = value as Record<string, unknown>;
    const videos = asEntries(device.videos).flatMap((entry) => {
      const id = entry.videoObj?.id;
      if (typeof id !== "string") return [];
      return [{
        id,
        title: typeof entry.title === "string" ? entry.title : "Video",
        type: typeof entry.videoObj?.type === "string" ? entry.videoObj.type : "unknown",
      }];
    });
    const image = cameraImageEntry(device);
    if (!videos.length && !image) return [];
    return [{
      deviceId: String(device.id),
      name: typeof device.name === "string" ? device.name : "Camera",
      zoneId: typeof device.zone === "string" ? device.zone : null,
      available: device.available !== false,
      snapshot: image ? {
        id: String(image.imageObj!.id),
        title: typeof image.title === "string" ? image.title : "Snapshot",
      } : null,
      videos,
    }];
  }).sort((a, b) => a.name.localeCompare(b.name));
}

/** Validate a browser SDP offer before forwarding it to Homey. */
export function validateSdpOffer(offer: unknown): string {
  if (typeof offer !== "string" || !offer.startsWith("v=0") || offer.length > MAX_SDP_LENGTH) {
    throw new CameraRequestError("Invalid SDP offer.", 400);
  }
  return offer;
}

export function validateStreamId(streamId: unknown): string {
  if (typeof streamId !== "string" || !streamId || streamId.length > MAX_STREAM_ID_LENGTH || !/^[\w.:-]+$/.test(streamId)) {
    throw new CameraRequestError("Invalid streamId.", 400);
  }
  return streamId;
}

type HomeyVideosManager = {
  videoOffer(opts: { id: string; offer: string }): Promise<unknown>;
  videoKeepAlive(opts: { id: string; streamId: string }): Promise<unknown>;
};

async function getDevices(): Promise<Record<string, unknown>> {
  const api = await requireHomeyApi();
  return await api.devices.getDevices() as unknown as Record<string, unknown>;
}

export async function getHomeyCameras(): Promise<{ retrievedAt: string; cameras: HomeyCamera[] }> {
  return { retrievedAt: new Date().toISOString(), cameras: listCamerasFromDevices(await getDevices()) };
}

/** One camera device by Homey device id. Snapshot-only devices are returned with an empty `videos` list. */
export async function getHomeyCameraByDeviceId(deviceId: string): Promise<HomeyCamera> {
  if (!UUID_PATTERN.test(deviceId)) throw new CameraRequestError("Invalid device id.", 400);
  const devices = await getDevices();
  const device = devices[deviceId];
  if (!device) throw new CameraRequestError("Device not found.", 404);
  const [camera] = listCamerasFromDevices({ [deviceId]: device });
  if (!camera) throw new CameraRequestError("This device is not a camera.", 400);
  return camera;
}

/** Only video IDs that belong to a current Homey camera device may be used. */
async function assertKnownVideo(videoId: string): Promise<void> {
  if (!UUID_PATTERN.test(videoId)) throw new CameraRequestError("Invalid video id.", 400);
  const cameras = listCamerasFromDevices(await getDevices());
  if (!cameras.some((camera) => camera.videos.some((video) => video.id === videoId))) {
    throw new CameraRequestError("Video not found.", 404);
  }
}

function homeyErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** Forward a WebRTC offer to Homey (go2rtc) and return its answer. */
export async function createCameraWebRtcSession(videoId: string, offer: unknown): Promise<{ answerSdp: string; streamId: string }> {
  const sdp = validateSdpOffer(offer);
  await assertKnownVideo(videoId);
  const api = await requireHomeyApi();
  const videos = (api as unknown as { videos: HomeyVideosManager }).videos;
  let result: unknown;
  try {
    result = await videos.videoOffer({ id: videoId, offer: sdp });
  } catch (error) {
    // Homey's message contains useful go2rtc details such as "codecs not matched: video:H265 => ...".
    throw new CameraRequestError(homeyErrorMessage(error), 502);
  }
  const answer = result as { answerSdp?: unknown; streamId?: unknown } | null;
  if (typeof answer?.answerSdp !== "string" || typeof answer.streamId !== "string") {
    throw new CameraRequestError("Homey returned an unexpected WebRTC answer.", 502);
  }
  return { answerSdp: answer.answerSdp, streamId: answer.streamId };
}

export async function keepCameraWebRtcSessionAlive(videoId: string, streamId: unknown): Promise<void> {
  const id = validateStreamId(streamId);
  if (!UUID_PATTERN.test(videoId)) throw new CameraRequestError("Invalid video id.", 400);
  const api = await requireHomeyApi();
  const videos = (api as unknown as { videos: HomeyVideosManager }).videos;
  try {
    await videos.videoKeepAlive({ id: videoId, streamId: id });
  } catch (error) {
    throw new CameraRequestError(homeyErrorMessage(error), 502);
  }
}

/** Fetch the current camera snapshot of a device from Homey's ManagerImages. */
export async function getCameraSnapshot(deviceId: string): Promise<{ contentType: string; body: Buffer }> {
  if (!UUID_PATTERN.test(deviceId)) throw new CameraRequestError("Invalid device id.", 400);
  const devices = await getDevices();
  const device = devices[deviceId] as Record<string, unknown> | undefined;
  const image = device ? cameraImageEntry(device) : undefined;
  const url = image?.imageObj?.url;
  if (typeof url !== "string" || !url.startsWith("/api/image/")) {
    throw new CameraRequestError("This device has no camera snapshot.", 404);
  }
  const { address, token } = await getHomeyConnectionConfig();
  if (!address || !token) throw new CameraRequestError("Homey is not configured.", 503);
  let response: Response;
  try {
    response = await fetch(new URL(url, address), {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(SNAPSHOT_TIMEOUT_MS),
    });
  } catch (error) {
    throw new CameraRequestError("Snapshot request to Homey failed: " + homeyErrorMessage(error), 502);
  }
  if (!response.ok) throw new CameraRequestError(`Homey returned HTTP ${response.status} for the snapshot.`, 502);
  const contentType = response.headers.get("content-type") ?? "application/octet-stream";
  if (!contentType.startsWith("image/")) throw new CameraRequestError("Homey did not return an image.", 502);
  return { contentType, body: Buffer.from(await response.arrayBuffer()) };
}
