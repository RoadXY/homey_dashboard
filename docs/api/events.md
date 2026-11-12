# Dashboard Server-Sent Events

Endpoint: `GET /api/events`

The endpoint returns a `text/event-stream` response. Each event's `data` field contains JSON.

| Event | Purpose | Data |
|---|---|---|
| `ready` | Initial connection state | `{ homey, connectedAt }` |
| `homey-update` | Homey realtime update | Homey update payload |
| `homey-connected` | Homey connection established | Connection payload |
| `homey-disconnected` | Homey connection lost | Connection payload |

A comment heartbeat is sent every 20 seconds. The browser reconnects using the native EventSource behavior.
