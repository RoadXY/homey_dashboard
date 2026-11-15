# Runtime Architecture, Configuration and Security

**Status:** technical reference based on the implementation on `phase_1_foundation`  
**Last reviewed:** 15 November 2026

This document records implementation details that are useful when maintaining, debugging or extending the dashboard. It describes the current code, not a proposal for future behavior.

## 1. Technology and build

The current project uses:

| Area | Current implementation |
|---|---|
| Runtime | Node.js 24 (package engine: >=24 and <27) |
| Backend | TypeScript, Fastify 5 |
| Frontend | React 19, Vite 7 |
| Homey integration | `homey-api` 3.21.x |
| Blockly | Blockly 12.3.x |
| Tests | Vitest 3 |
| Container | Multi-stage Docker build based on Node 24 Bookworm Slim |

Useful package scripts:

- `npm run dev` — starts the API and Vite development server.
- `npm run build` — builds the frontend and compiles the server TypeScript.
- `npm start` — starts `dist/server/index.js`.
- `npm run typecheck` — runs the TypeScript project checks.
- `npm test` — runs the Vitest suite.

Run the relevant checks after code changes. A successful TypeScript build does not replace tests or a live Homey/Docker verification.

## 2. Container and runtime layout

The production Dockerfile uses two stages:

1. **Build stage:** installs dependencies and runs `npm run build`.
2. **Runtime stage:** installs production dependencies only and copies the compiled output, notification configuration and default locale files.

The runtime process runs as the unprivileged `node` user. The application listens on `HOST` (default `0.0.0.0`) and `PORT` (default `3000`).

The production Compose configuration:

- builds the `runtime` target;
- maps host port `5173` to container port `3000`;
- mounts the named `dashboard_data` volume at `/app/data`;
- restarts the service unless it is stopped.

The development Compose file is different: it runs the development scripts, mounts the source tree and exposes Vite on port `5173`. Do not treat its volume and port configuration as the production deployment model.

## 3. Environment variables

| Variable | Purpose | Notes |
|---|---|---|
| `HOMEY_ADDRESS` | Local Homey address | Configure in the private `.env` file. |
| `HOMEY_API_KEY` | Homey Web API credential | Secret; never commit or log it. |
| `SETTINGS_PIN` | PIN protecting Settings access | Configure a unique value outside Git. |
| `DATA_DIR` | Persistent application data directory | Defaults to `./data`; production uses `/app/data`. |
| `HOST` | Backend bind address | Defaults to `0.0.0.0`. |
| `PORT` | Backend port | Defaults to `3000`. |
| `WEATHER_API_TOKEN` | Legacy static token compatibility | Keep secret; managed tokens are preferred. |

Use `.env.example` only as a template. Never put real credentials, tokens, session keys or personal data in repository configuration files.

## 4. Homey connection lifecycle

The Homey integration is centralized in `src/server/homey.ts`.

- The backend creates a local Homey API client with `HomeyAPI.createLocalAPI({ address, token })`.
- The API key is used server-side; the browser does not connect directly to Homey.
- The initial connection reads devices and zones and records a snapshot with state `not-connected`, `connecting`, `online` or `offline`.
- Concurrent callers share the same in-progress connection promise.
- Connection failures are recorded in the Homey snapshot. A later request can attempt to reconnect.
- Device, Logic, Flow and capability reads are performed by backend functions; the browser calls dashboard API endpoints instead.

Homey being offline does not mean the dashboard process itself has stopped. Keep Homey connectivity separate from container health and service availability.

## 5. Realtime data path

The current realtime path is:

1. The backend connects Homey's Devices and Logic realtime managers.
2. It subscribes to capability updates for the dashboard's configured device IDs using `makeCapabilityInstance()`.
3. It listens for Logic manager events: `variable.update`, `variable.create` and `variable.delete`.
4. The backend emits updates through `GET /api/events` using Server-Sent Events (SSE).
5. The browser uses the native `EventSource` API and refreshes the relevant dashboard snapshots after events.

SSE event names currently include:

- `ready`
- `homey-update`
- `homey-connected`
- `homey-disconnected`
- `settings-updated`
- `notifications-updated`

Operational details:

- The server sends an SSE keepalive comment every 20 seconds.
- A backend watchdog checks the Homey Devices and Logic manager connections every 15 seconds and attempts to restore subscriptions.
- Existing subscriptions and Logic handlers are cleaned up before being registered again.
- The frontend debounces event-triggered refreshes by approximately 150 ms.
- The initial page load still fetches a full snapshot.
- Native EventSource reconnect behavior restores the browser stream after network interruptions.

SSE is server-to-browser only. It is not an inbound command channel. User actions use HTTP requests to backend routes.

The realtime implementation is documented in more detail in [Realtime dashboard updates](../03-dashboard/realtime-updates.md).

## 6. Health checks and observability

The backend exposes:

| Endpoint | Meaning |
|---|---|
| `GET /api/health/live` | The dashboard process responds. |
| `GET /api/health/ready` | The dashboard process reports ready. |
| `GET /api/health` | Backwards-compatible aggregate response, including Homey state. |
| `GET /api/homey/status` | Homey connection snapshot. |
| `GET /api/system/status` | Homey state/language, service version, uptime, host memory and data-volume storage information. |

The Docker HEALTHCHECK calls `/api/health/ready`. The live and ready routes do not verify Homey connectivity or every dashboard data source. A healthy container therefore does not guarantee that Homey is online.

The Fastify server is created with logging enabled. Keep logs useful for diagnosis, but never include API keys, Bearer tokens, Authorization headers, PINs or session secrets.

## 7. Persistent data and configuration ownership

The default data directory is `DATA_DIR`, falling back to `<working-directory>/data`. Production persists this directory through the `dashboard_data` Docker volume.

Current data files include:

| File/directory | Owner / purpose |
|---|---|
| `settings.json` | General dashboard settings, including language and notification timeout. |
| `dashboard-actions.json` | Quick Action configuration. |
| `notifications.json` | Blockly notification overrides. |
| `notifications.deleted.json` | IDs of removed default notification configurations. |
| `api-notifications.json` | External Notifications API records, separate from Blockly. |
| `measurement-tiles.json` | Measurement tile configuration. |
| `weather-settings.json` | Weather source mappings and icon preferences. |
| `weather/condition.json` | Last received canonical weather condition. |
| `weather/tokens.json` | Managed API token hashes and non-secret metadata. |
| `settings-session.key` | Persistent signing secret for Settings sessions. |
| `locales/` | Runtime language registry and translation dictionaries. |

Do not merge data files with different ownership boundaries. In particular, external API notifications and Blockly notification configuration have separate validation, lifecycle and storage code.

Several files are written with restrictive file permissions. The API notification writer uses a temporary file followed by an atomic rename and serializes writes through a queue. Do not assume every JSON writer uses the same concurrency strategy; preserve or improve the relevant module's existing guarantees when modifying persistence.

Back up the persistent data volume before destructive maintenance or migration. An image rebuild should not be used as a substitute for backing up user configuration.

## 8. Settings session security

Settings routes are protected by a PIN-based session implemented in `src/server/index.ts`.

- The PIN is read from `SETTINGS_PIN`.
- A successful unlock creates a signed cookie named `homey_settings`.
- The cookie payload contains an expiry timestamp and an HMAC-SHA256 signature.
- The signing key is generated as 48 random bytes and stored in `DATA_DIR/settings-session.key` with mode `0600`.
- The cookie is marked `HttpOnly` and `SameSite=Strict`.
- The idle session lifetime is 30 minutes; authenticated activity refreshes the expiry.
- Logout clears the cookie.

The current cookie construction does not add the `Secure` attribute. Before exposing the Settings interface through a public or untrusted network, review the TLS/reverse-proxy deployment and whether the cookie should be marked Secure. Do not change session behavior without testing browser and proxy compatibility.

The PIN is currently compared with the configured environment value. Do not log submitted PINs or include them in error responses.

## 9. Managed Bearer tokens

Managed tokens are implemented in `src/server/weather-tokens.ts` and are used by the external API authentication helper.

- A token is generated with 32 cryptographically random bytes and the `hdy_` prefix.
- The raw token is returned at creation time; the stored record contains a SHA-256 digest, not the raw secret.
- The token list exposes only non-secret metadata and the final four characters.
- Validation hashes the candidate and compares hashes using `timingSafeEqual`.
- Revocation removes the stored token record.
- The legacy `WEATHER_API_TOKEN` environment variable is also accepted by the existing compatibility path.

Treat the raw token as a secret. Do not store it in dashboard configuration, logs, screenshots or Git. The current token design does not implement per-token scopes; the approved initial behavior allows all valid managed tokens to use the Notifications API.

## 10. Localization implementation

Technical documentation in this repository is written in English. User-facing dashboard text is localized and can still be displayed in the user's selected language.

The current runtime localization implementation is a small custom translation module in `src/client/i18n.ts`; it is not currently based on i18next/react-i18next.

- The language registry is loaded from `/api/locales/registry`.
- Translation dictionaries are loaded from `/api/locales/:file`.
- English (`en`) is the configured fallback.
- Automatic mode maps the language reported by Homey to a registered dashboard locale.
- A manual dashboard language overrides automatic detection.
- Translation files are stored in the persistent `DATA_DIR/locales` directory.
- On startup, missing locale files are copied from the bundled defaults. Existing dictionaries are merged with defaults so newly introduced keys can be added while existing user values are retained.

When adding or changing visible UI text:

1. Add a stable translation key to both `src/client/locales/en.json` and `src/client/locales/nl.json`.
2. Keep the key and interpolation placeholders identical in both files.
3. Use the central translation function; do not hard-code user-facing strings in React components, validation, Blockly blocks, tooltips or accessibility labels.
4. Keep technical identifiers, JSON property names and API fields in English.
5. Check JSON validity and translation-key parity.

The architecture proposal mentions i18next as a possible choice, but the current implementation is the custom module described above. Update the architecture proposal if the project formally changes localization libraries.

## 11. Error reporting boundaries

Errors currently have feature-specific handling. Examples include:

- Quick Action execution errors in the transient red error area.
- Initial required Homey data failures near the clock.
- Notification retrieval failures represented inside the Notifications panel.
- Status polling and some measurement/weather refresh failures caught without a global error display.

The approved target is to centralize dashboard-related errors in the area above the Notifications panel. That broader routing is not yet implemented.

See [Central Dashboard Error Area](dashboard-error-messages.md) for the approved scope, current behavior, open decisions and code references.

## 12. Verification checklist

After changes to backend, configuration, persistence or realtime behavior:

- Run `npm run typecheck`.
- Run `npm test`.
- Run `npm run build`.
- Build and start the production Docker image.
- Verify `/api/health/ready` and `/api/homey/status` separately.
- Verify the persistent volume retains settings after container recreation.
- Verify Homey reconnect and SSE browser reconnection where relevant.
- Verify the feature against the actual Homey Pro when a live integration is involved.
- Inspect logs and confirm that no credentials or tokens are exposed.

Record which checks were actually run. Do not report a live Homey or Docker test as successful if only static code review was performed.
