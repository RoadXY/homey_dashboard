# Central Dashboard Error Area

**Status:** user decision recorded; central expansion not yet implemented  
**Decision date:** 15 November 2026  
**Target branch:** `phase_1_foundation`

## 1. Purpose and scope

The red area directly above the dashboard's **Notifications** panel is the designated central presentation area for errors caused by using the dashboard.

An error belongs here when it affects dashboard operation or a dashboard action/request. Its origin may be the frontend, backend, network/API layer or Homey integration.

In scope:

- Errors while retrieving, processing or presenting dashboard data.
- Homey communication errors that prevent dashboard functionality.
- Quick Action execution failures.
- Homey Web API or driver errors returned as a result of a dashboard action or request.

Out of scope:

- Independent Homey app notifications and Homey timeline messages.
- Flow failures that occur outside the dashboard and are not returned by a dashboard action/request.
- Regular content in the Notifications panel, including Blockly, external API and system notifications intended as user notifications.

This is not a general Homey notification feed. The deciding criterion is whether the error is related to use or operation of the dashboard.

## 2. Current implementation vs. target

The current red presentation is rendered in `src/client/main.tsx` as `action-error-list`, above `notifications-panel`. Individual entries use `action-error`, `role="alert"` and a dismiss button.

At present, this area is populated only by temporary Quick Action execution errors. The broader central error area described in this document has not yet been implemented.

Other current error/status presentations:

- `loadError` and a non-online Homey state are shown as `connection-warning` near the clock.
- Quick Action status polling errors are swallowed; the last known status is retained.
- Notification loading failures are represented as an unknown/warning item in the Notifications panel, not in the Quick Action error area.
- Measurement tile and weather refresh failures can be silently ignored or represented as unavailable values, depending on the request path.

Moving or extending these error presentations into the central area remains future work.

## 3. Existing Quick Action error path

The relevant backend route is:

```http
POST /api/homey/quick-actions/:id/execute
```

The route in `src/server/index.ts` finds the saved Quick Action and invokes the implementation in `src/server/homey.ts`.

Supported operations:

- Start a Standard Flow using `triggerFlow`.
- Start an Advanced Flow using `triggerAdvancedFlow`.
- Set a device capability using `setCapabilityValue`.

Before execution, the backend checks Homey connectivity, action configuration, Flow existence/enabled state, device existence/availability, capability existence/setability and value validity. Numeric minimum/maximum values and enum options are validated.

The route returns an error object in the form `{ error: string }` for failures. Depending on the failure path, HTTP 404, 409 or 502 can be returned. The frontend reads the error text and adds a transient `system` notification to its local state.

### 3.1 Frontend lifecycle of current errors

- Errors are stored in React state as `transientNotifications`; they are not written to persistent server storage.
- Each error receives a client-generated ID and a client-side creation timestamp.
- The user can dismiss an active error manually.
- The global `notificationTimeout` setting controls automatic expiry. Its allowed values are `never`, 1, 2, 5, 10, 30, 60, 300, 900 or 1800 seconds. The default is `never`.
- The client retains at most the latest 50 transient entries.
- Dismissed and expired entries remain in the in-memory array but are no longer rendered as active.
- A page reload or browser restart clears these transient entries.

These details describe the existing Quick Action error implementation only. They are not yet approved requirements for every future category of dashboard error.

## 4. Other observed error-handling paths

The code currently handles failures differently depending on the feature:

| Feature/path | Current behavior |
|---|---|
| Initial Homey status/readings/Logic load | A failed required request sets `loadError`; a warning is shown near the clock. |
| Homey connection state | The Homey state is shown near the clock when it is not online. |
| Notifications API read for dashboard | A failed request creates a warning/unknown notification in the Notifications panel. |
| Quick Action status polling | Failure is caught; last known state is retained without a visible error. |
| Dashboard Quick Action list | Failure is caught and the action list becomes empty. |
| Measurement tile polling | Failure is caught without a visible error; previous data may remain. |
| Weather values/condition | Some request failures are caught and weather may become unknown or unavailable. |
| Settings API | Many routes return 400, 401, 403, 404, 500 or 503 with an `error` field; presentation depends on the calling settings component. |
| Homey source catalogs | Catalog routes return 503 when Homey data cannot be retrieved. |

Do not assume that every HTTP error currently reaches the red area. The frontend has several independent loading and error-handling paths.

## 5. Health and Homey connectivity are separate

The backend exposes `/api/health/live`, `/api/health/ready` and the backwards-compatible `/api/health` route. The live/ready responses describe the dashboard process; they do not require Homey to be online.

Homey connectivity is reported separately by `GET /api/homey/status`. This distinction is intentional: a running dashboard container can be healthy while Homey is temporarily unavailable.

The Docker health check calls `/api/health/ready`. It must not be interpreted as proof that Homey communication, every data source or every dashboard feature is working.

## 6. Design and implementation guidelines

1. Route dashboard-related errors through one recognizable frontend presentation layer above the Notifications panel.
2. Keep errors, warnings and normal statuses distinct. An unavailable device or missing measurement is not automatically a technical dashboard error.
3. Include Homey/driver errors only when they are returned from a dashboard action or request.
4. Treat Homey, driver and network response messages as untrusted text. Render them as text, never as HTML.
5. Where useful, record an internal category, source, timestamp and affected dashboard action.
6. Never log API tokens, Authorization headers or other secrets.
7. Keep the central error area separate from the regular Notifications engine and Notifications API.
8. Avoid duplicate reporting when a single failure is already represented through a dedicated status component; define a consistent policy as part of implementation.
9. Ensure errors remain understandable when translated. Technical detail can be retained in server logs while the user-facing message is localized.

## 7. Open design decisions

The following points have not been decided by the user and must not be silently treated as requirements:

- Whether identical errors should be deduplicated.
- Whether errors should expire automatically, require manual dismissal or support both.
- The maximum number of simultaneously visible errors.
- Which errors should show technical details and which should use friendly messages.
- Whether errors should survive a page refresh or container restart.
- Which non-fatal situations, such as temporarily missing measurements, count as errors rather than statuses.

## 8. Related source and documentation

- `src/client/main.tsx` — error presentation, transient notification state and Quick Action execution.
- `src/server/index.ts` — API routes, health endpoints, settings session and event stream.
- `src/server/homey.ts` — Homey connection, Flow execution, device/capability validation and realtime subscriptions.
- [Error inventory and user decision](../03-dashboard/homey-foutmeldingen.md)
- [Runtime architecture and security](runtime-architecture-and-security.md)
- [Project decision log](../01-project/besluitenlog.md)

## 9. Implementation status

The central error area is an approved user-facing design decision. The existing Quick Action error list is implemented, but expanding it to all relevant dashboard errors is not. Update this document when the implementation changes and preserve the distinction between current behavior and intended behavior.
