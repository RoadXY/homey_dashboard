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

The `settings-updated` event is emitted after a successful save to:

- `POST /api/settings/general`
- `POST /api/settings/dashboard-actions`

Dashboard clients listen for this event and reload the current dashboard data so tablets and other displays reflect settings saved from another computer. The event is a refresh notification; it does not include the settings payload or any secret values.

A comment heartbeat is sent every 20 seconds. Heartbeats are SSE comments, not named events, and can be ignored by clients.

The `notifications-updated` event is emitted after successful external Notifications API mutations and when an API notification reaches its expiry time. Dashboard clients refetch `GET /api/notifications` to receive the combined active Blockly and API notifications.
