# Realtime dashboard updates

**Status:** implemented on `phase_1_foundation`; deploy/build and live Homey validation still required.  
**Date:** 11 November 2026

## Architecture

The dashboard no longer relies on a fixed 30-second refresh interval for Homey data.

1. The Node.js backend connects to Homey Pro through the existing `homey-api` local API client.
2. It connects the Homey Devices and Logic Socket.IO managers.
3. For the dashboard's configured device IDs, it creates read-only realtime capability subscriptions using `makeCapabilityInstance()`.
4. It listens for Logic manager events `variable.update`, `variable.create` and `variable.delete`.
5. Homey changes are broadcast from Fastify through `GET /api/events` using Server-Sent Events (SSE).
6. The browser's `EventSource` receives those events and refreshes the displayed Homey values and evaluated JSON notifications. Updates are briefly debounced (150 ms) to combine bursts.

Homey-to-backend uses Homey's Socket.IO realtime API; backend-to-browser uses SSE. The browser does not connect directly to Homey and the Homey API key remains server-side.

## Reconnection and lifecycle

- The browser's native EventSource reconnect behavior restores the SSE stream after a browser/network interruption.
- The backend sends an SSE keepalive comment every 20 seconds.
- A backend watchdog checks the Homey Devices and Logic manager connection states every 15 seconds and attempts to restore realtime subscriptions if either manager is disconnected.
- Capability subscriptions and Logic event handlers are cleaned up before they are registered again, to avoid duplicate listeners.
- On reconnect, the browser refreshes the dashboard state.
- The initial page load still requests a complete snapshot so the UI has values before the first change event.

## Scope and read-only guarantee

Realtime subscriptions cover the device IDs already used by the dashboard and all capabilities exposed by those devices. Logic events are listened to at manager level; the dashboard's existing read methods still select only configured Logic variables. No device capability is written, no Logic variable is changed, and no Homey Flow is started or edited.

## API endpoint

- `GET /api/events`: SSE stream with `ready`, `homey-update`, `homey-connected` and `homey-disconnected` events.

## Expected latency

Updates should normally reach the dashboard shortly after Homey emits the event, plus a 150 ms frontend debounce and the time required to retrieve the refreshed snapshot. This is near-real-time, not a hard latency guarantee. Homey devices and integrations may themselves publish values at different intervals.

## Validation checklist after deployment

1. Confirm `/api/events` stays open in the browser network panel and returns `text/event-stream`.
2. Change a dashboard device capability and verify the browser refreshes without waiting 30 seconds.
3. Change `dashboard_test_co2_melding` from false to true and verify the test notification appears.
4. Change it back to false and verify the notification disappears.
5. Temporarily interrupt Homey network access, restore it, and verify the backend reconnects and the dashboard refreshes.
6. Check backend logs for repeated subscription errors or duplicate events.

## Limitations / follow-up

- The Homey reconnect watchdog and SSE behavior are implemented but not yet exercised against the live Homey Pro.
- The backend currently refreshes the existing dashboard snapshot endpoints after an event; it does not yet send a minimal per-capability patch to the browser. This keeps the first realtime version simple and reuses the existing API/data mapping.
- If Homey manager reconnect behavior differs on the installed Homey firmware or `homey-api` version, adjust the watchdog after observing live logs.
