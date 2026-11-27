# Troubleshooting Pages and Homey Camera Access

**Status:** current implementation on `phase_1_foundation`
**Last reviewed:** 27 November 2026

This document describes the `/troubleshooting` area and the backend camera access it uses. The camera code is also the verified technical basis for the phase 5 camera/doorbell work; see [Phase 5 – live camera streams and doorbell popup](../02-architectuur/fase-5-camera-streams-en-deurbel-popup.md) for the research record and the open design decisions.

## 1. Purpose and design

`/troubleshooting` is a diagnostics area for administrators. The first tool, `/troubleshooting/camera/`, answers one question: *can this browser play the camera streams that Homey delivers?*

Design decisions:

- **Plain HTML, CSS and ES2017 JavaScript, no build step.** The pages live in `public/troubleshooting/`. Vite copies them unchanged into `dist/client/troubleshooting/`. They do not depend on the React dashboard, so they keep working when the dashboard itself is broken, and they run on older kiosk browsers.
- **English only.** The pages are a technical tool, not part of the localized dashboard UI, so they deliberately do not use the translation system in `src/client/i18n.ts`. This is an accepted exception to the localization rule in [Runtime Architecture](runtime-architecture-and-security.md#10-localization-implementation).
- **Extensible.** The hub page lists tools; each tool is a directory with its own `index.html`.

## 2. Routes

| Route | Served by | Notes |
|---|---|---|
| `/troubleshooting` | `src/server/index.ts` | Redirects to `/troubleshooting/` |
| `/troubleshooting/` | `public/troubleshooting/index.html` | Tool list plus server/Homey status from `/api/health` and `/api/homey/status` |
| `/troubleshooting/camera` | `src/server/index.ts` | Redirects to `/troubleshooting/camera/` |
| `/troubleshooting/camera/` | `public/troubleshooting/camera/index.html` + `camera.js` | Codec detection and live camera test |
| `/troubleshooting/troubleshooting.css` | `@fastify/static` | Shared stylesheet |

The HTML pages are registered explicitly in the `troubleshootingPages` map in `src/server/index.ts`, before `@fastify/static` and the SPA fallback. Without an explicit route the SPA fallback would return the dashboard's `index.html`. These routes only exist when `dist/client` exists (production build). In `npm run dev`, Vite serves the files from `public/`.

### Adding a troubleshooting tool

1. Create `public/troubleshooting/<tool>/index.html` (and optional scripts). Link `/troubleshooting/troubleshooting.css` and use absolute asset paths.
2. Add `"/troubleshooting/<tool>": "troubleshooting/<tool>/index.html"` to `troubleshootingPages` in `src/server/index.ts`.
3. Add a tile to the tool list in `public/troubleshooting/index.html`.
4. Protect any privacy-sensitive or state-changing backend endpoint with the settings session (`hasSettingsSession`).
5. Document the tool here and in the [User Guide](../09-gebruikershandleiding/troubleshooting.md).

## 3. How Homey exposes cameras

Verified against the live Homey Pro (Early 2023, firmware 13.5.5) on 27 November 2026.

Every Homey camera app registers media with Homey's own, vendor-neutral abstraction (`Device.setCameraImage()` / `Device.setCameraVideo()` in the Apps SDK). Through the Web API, every device object carries:

```jsonc
"images": [{ "type": "camera", "id": "snapshot", "title": "Camera garage",
             "imageObj": { "id": "<uuid>", "url": "/api/image/<uuid>", "lastUpdated": 1795069554774 } }],
"videos": [{ "type": "camera", "id": "snapshot", "title": "Camera garage Video",
             "videoObj": { "id": "<uuid>", "type": "rtsp", "options": { "demuxer": "h264" } } }]
```

`images` entries with `type: "media"` are album art (Chromecast and similar) and are not cameras.

| Homey manager | Web API | Status in `homey-api` 3.21.x |
|---|---|---|
| `ManagerImages` | `GET /api/manager/images/image`; image bytes at `GET /api/image/<id>` | Public |
| `ManagerVideos` | `getVideos`, `videoOffer(id, offer)`, `videoKeepAlive(id, streamId)`, `getVideoUrl(id)` | Manager marked **`private: true`**; operations require only `homey.device.readonly` |

The `homey-api` client generates managers for every entry in its bundled specification, including private ones, so `api.videos.videoOffer()` works at runtime. TypeScript types for it only exist in the private type definitions; `src/server/cameras.ts` uses a narrow local interface.

**Risk:** `ManagerVideos` is not publicly documented and may change in a Homey firmware update. Snapshots via `ManagerImages` are the stable, documented fallback.

### Live video: go2rtc and WebRTC

Homey Pro runs a built-in **go2rtc** daemon (visible in error stacks as `Go2rtcDaemon.webrtcOffer`). `videoOffer` takes a browser SDP offer and returns `{ answerSdp, streamId }`. Homey connects to the camera (RTSP in the UniFi Protect case) and forwards the media as WebRTC.

- **No transcoding.** go2rtc only repackages. The browser must support the camera's codec. If the offer contains no matching codec, Homey answers with HTTP 500, for example `codecs not matched: video:H265 => video:VP8, audio:OPUS`. If the offer lists only H.264 while the camera sends H.265, the connection can succeed but no video packets arrive.
- **Media path.** Media flows directly from Homey to the browser on port **8555** (UDP host candidate, TCP passive fallback, plus a STUN server-reflexive candidate). The dashboard backend only handles signalling.
- **Keep-alive.** The stream must be kept alive with `videoKeepAlive({ id, streamId })`. The page sends it every 5 seconds; a 5-second interval is verified to work, but the actual Homey timeout is unknown.
- **`getVideoUrl` is not used.** It returns the camera's raw stream URL (for UniFi: the NVR RTSP URL with an access token). Using it would mean talking to the camera vendor directly, which is outside the agreed architecture. It is never exposed to the browser.

Measured on 27 November 2026: both UniFi Protect cameras deliver **H.265 only**. The connection was established in about 2.8 seconds. The backyard camera delivered H.265 video and Opus audio at about 3.4 Mbit/s.

## 4. Backend implementation

`src/server/cameras.ts`:

- `listCamerasFromDevices(devices)` — pure function; returns every device with at least one `videoObj` or a `type: "camera"` image, sorted by name.
- `getHomeyCameras()` — camera list from the connected Homey.
- `getCameraSnapshot(deviceId)` — looks up the device's camera image URL, fetches it from the Homey address in the stored connection settings (`readHomeyConnectionConfig()`) with the Bearer token (15 s timeout) and returns the bytes. Only URLs starting with `/api/image/` are fetched.
- `createCameraWebRtcSession(videoId, offer)` — validates the SDP offer (must start with `v=0`, at most 100,000 characters), checks that the video ID belongs to a current camera device, then calls `api.videos.videoOffer`. Homey errors are returned with status 502 and their original message, because go2rtc's codec details are the key diagnostic.
- `keepCameraWebRtcSessionAlive(videoId, streamId)` — validates the ID formats and calls `api.videos.videoKeepAlive`. It deliberately skips the device lookup to keep the 5-second keep-alive cheap.

`src/server/homey.ts` exports `requireHomeyApi()` (connect-if-needed accessor) and `getHomeyConnectionConfig()` (normalized base URL and token from the stored Homey connection settings) for this module.

### API endpoints

All endpoints require the settings session cookie (`homey_settings`) and return `401` without it.

| Method and path | Result |
|---|---|
| `GET /api/troubleshooting/cameras` | `{ retrievedAt, cameras: [{ deviceId, name, zoneId, available, snapshot, videos: [{ id, title, type }] }] }` |
| `GET /api/troubleshooting/cameras/:deviceId/snapshot` | Image bytes (`Cache-Control: no-store`); 404 when the device has no camera image |
| `POST /api/troubleshooting/videos/:videoId/offer` | Body `{ offer }`, returns `{ answerSdp, streamId }`; 400 invalid offer, 404 unknown video, 502 Homey/go2rtc error |
| `POST /api/troubleshooting/videos/:videoId/keep-alive` | Body `{ streamId }`, returns `{ kept: true }`; 502 when Homey rejects it |

The endpoints are also documented in the [OpenAPI specification](../api/openapi.yaml) under the *Troubleshooting (internal)* tag.

### Security notes

- Camera images and streams are privacy-sensitive; therefore every camera endpoint requires the PIN session, unlike most read-only dashboard endpoints.
- The Homey API key never reaches the browser. The browser only receives SDP answers, which contain Homey's ICE candidates and DTLS fingerprint but no credentials.
- Homey serves `/api/image/<id>` **without authentication** (the unguessable UUID is the only protection). Never hand those Homey URLs to browsers; always proxy them through the backend.
- Only video IDs that belong to a current camera device are accepted for offers.

## 5. Browser-side test (`camera.js`)

1. **Codec detection** (no PIN needed): `RTCRtpReceiver.getCapabilities("video")`, `MediaCapabilities.decodingInfo({ type: "webrtc", ... })` for H.265 and H.264, `MediaSource.isTypeSupported()` and `<video>.canPlayType()` for HEVC. Only the WebRTC receiver capabilities are decisive for live streams; the others help explain results.
2. **Live test:** a receive-only `RTCPeerConnection` with video and audio transceivers. The codec mode uses `setCodecPreferences`: *Automatic* puts H.265 first, *H.265 only* and *H.264 only* restrict the offer. The page waits up to 2 seconds for ICE gathering (Homey's API has no trickle ICE), posts the offer, applies the answer, sends a keep-alive every 5 s and reads `getStats()` every second.
3. **Verdict:** success once `framesDecoded > 0`. It reports a failure for a `failed` connection (network or port 8555), for packets arriving without decoded frames after 8 s (decoder problem), or for no video packets at all (codec mismatch).
4. **Report:** a JSON summary without secrets for sharing. On plain-HTTP origins `navigator.clipboard` is unavailable; the page falls back to `document.execCommand("copy")`.

WebRTC playback works on plain-HTTP LAN origins. Chromium may hide local IP addresses behind mDNS candidates; this has not been a problem because Homey learns the browser's address from incoming connectivity checks.

## 6. Verification performed

On 27 November 2026, against the live Homey Pro:

- `npm run typecheck`, `npm test` (74 tests, including `src/server/cameras.test.ts`) and `npm run build` passed.
- Production build started locally: page routes, redirects, static assets, 401 without a session, the camera list (3 devices), a JPEG snapshot of about 1 MB, and input validation (400/404) were verified with curl.
- A WebRTC client (Node.js with `werift`) negotiated H.265 through `POST /api/troubleshooting/videos/:id/offer`, received video packets and kept the stream alive. A VP8-only offer returned 502 with the go2rtc codec message.
- **Not yet verified:** playback in a real browser, in particular Chromium/Fully Kiosk on the Samsung Galaxy Tab A SM-T515, and inside the Docker container.
