# Dashboard Server-Sent Events

Endpoint: `GET /api/events`

The endpoint returns a `text/event-stream` response. Each named event's `data` field contains JSON. Clients should use the browser's native `EventSource` API, which reconnects automatically after a dropped connection. On every new connection the server sends `ready` first.

| Event | Purpose | Data |
|---|---|---|
| `ready` | Initial connection state | `{ homey, connectedAt }` |
| `homey-update` | Homey realtime update | Homey update payload |
| `homey-connected` | Homey connection established | Connection payload |
| `homey-disconnected` | Homey connection lost | Connection payload |
| `settings-updated` | Settings saved successfully on another client | `{ section, updatedAt }`; `section` is `general` or `quick-actions`, and `updatedAt` is an ISO 8601 timestamp |
| `notifications-updated` | An API notification was created, changed, deleted or expired | `{ updatedAt }`; ISO 8601 timestamp only, no notification content or source metadata |
| `camera-popup` | A camera popup is shown or replaced. Also sent right after `ready` when a popup is active, so a reloaded dashboard shows it again | `{ id, title, deviceId, cameraName, sound, shownAt, expiresAt }`; `sound` is `doorbell`, `alert`, `chime` or `null`; `expiresAt` is `null` when the popup stays open |
| `camera-popup-closed` | The active camera popup is closed | `{ id, reason, closedAt }`; `reason` is `api`, `dismissed` or `expired` |

The `camera-popup` and `camera-popup-closed` events are described in the [camera popup section](#camera-popup) below.

The `settings-updated` event is emitted after a successful save to:

- `POST /api/settings/general`
- `POST /api/settings/dashboard-actions`

Dashboard clients listen for this event and reload the current dashboard data so tablets and other displays reflect settings saved from another computer. The event is a refresh notification; it does not include the settings payload or any secret values.

A comment heartbeat is sent every 20 seconds. Heartbeats are SSE comments, not named events, and can be ignored by clients.

The `notifications-updated` event is emitted after successful external Notifications API mutations and when an API notification reaches its expiry time. Dashboard clients refetch `GET /api/notifications` to receive the combined active Blockly and API notifications.

## Camera popup

A camera popup is started by `POST /api/v1/camera-popup` (managed Bearer token) and closed by `DELETE /api/v1/camera-popup`, or by the dashboard screen itself. Only one popup is active; a new one replaces the current one. The popup shows the live feed of one Homey camera with video. The dashboard screen requests that feed from `POST /api/camera-popup/offer` and keeps it alive with `POST /api/camera-popup/keep-alive`. The dashboard requests only the feed of the active popup.

Built-in sounds are served from `/sounds/doorbell.wav`, `/sounds/alert.wav` and `/sounds/chime.wav`. Browsers can block autoplay, so a sound may not play on every display until the page has had user interaction.
