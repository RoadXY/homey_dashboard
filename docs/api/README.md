# Homey Dashboard API documentation

- `openapi.yaml` is the version-controlled API contract.
- `index.html` loads Swagger UI to provide a searchable, interactive API reference.
- `events.md` documents the Server-Sent Events stream, including `settings-updated` and `notifications-updated` refresh events.
- Keep `public/api-docs/openapi.yaml` synchronized with `openapi.yaml`; this is the specification served by the Docker-hosted Swagger UI.

The specification covers all HTTP routes currently implemented by the Fastify backend, including routes used only by the dashboard frontend. Internal routes are tagged accordingly and are not automatically supported third-party integration contracts.

## GitHub Pages

The repository workflow publishes this folder to GitHub Pages when changes are pushed to `phase_1_foundation`. A repository owner must first enable/save the Pages site manually: **Settings → Pages → Build and deployment → Source: GitHub Actions**. The workflow does not try to create or enable the Pages site through the Actions token, because GitHub denies that API operation for this repository.

Swagger UI is intended primarily for browsing and searching. Its "Try it out" feature may not reach a dashboard running on a private LAN because of browser HTTPS, CORS and Private Network Access restrictions. Never put real Bearer tokens in the repository or published examples.

## Weather condition API

- `GET /api/v1/weather/conditions`: list canonical codes.
- `POST /api/v1/weather/conditions`: set the persistent current condition using `Authorization: Bearer <WEATHER_API_TOKEN>` and JSON `{"condition":"cloudy"}`.

The last valid condition remains active until replaced. The dashboard does not apply a TTL; the Homey Flow owner controls update cadence.

## Weather API token management

Named Bearer tokens are created and revoked from the PIN-protected Settings screen. Each token is scoped to weather-condition writes. The server stores only a SHA-256 hash; the full token is returned once at creation and cannot be retrieved later. The Settings API requires the short-lived `x-settings-session` header. Revocation takes effect immediately.

The initial `WEATHER_API_TOKEN` environment variable remains temporarily accepted for backward compatibility. After creating and testing a managed token, remove that legacy variable from the private `.env` file and restart the container.

## Local Swagger UI

The Docker application also serves Swagger UI at `/api-docs/` from the same origin as the dashboard. Use this local page for live API testing against the Ubuntu-hosted container. Its OpenAPI copy is packaged from `public/api-docs/openapi.yaml`; keep it synchronized with the canonical `docs/api/openapi.yaml`.


## External notifications API

The approved design for external dashboard notifications is documented in [Meldingen-API – definitief ontwerp](../02-architectuur/meldingen-api.md). Planned routes are:

- `GET /api/v1/notifications`
- `POST /api/v1/notifications`
- `PATCH /api/v1/notifications/{id}`
- `DELETE /api/v1/notifications/{id}`

All routes reuse the existing Bearer-token validation. API notifications use a separate persistent store and are combined with existing dashboard notifications only for presentation. Optional expiry is supported. The origin is not exposed to the dashboard. Attempts to mutate a non-API notification return HTTP 403.

These endpoints are implemented in the backend. The automated tests cover the persistent storage, validation, partial updates, expiry and ownership behaviour. All valid managed Bearer tokens (and the temporary legacy `WEATHER_API_TOKEN`) are accepted. `source` is stored internally and omitted from public responses.
