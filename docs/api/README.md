# Homey Dashboard API documentation

- `openapi.yaml` is the version-controlled API contract.
- `index.html` loads Swagger UI to provide a searchable, interactive API reference.
- `events.md` documents the Server-Sent Events stream.

The specification covers all HTTP routes currently implemented by the Fastify backend, including routes used only by the dashboard frontend. Internal routes are tagged accordingly and are not automatically supported third-party integration contracts.

## GitHub Pages

The repository workflow publishes this folder to GitHub Pages when changes are pushed to `phase_1_foundation`. In repository settings, configure **Pages → Build and deployment → Source: GitHub Actions**.

Swagger UI is intended primarily for browsing and searching. Its "Try it out" feature may not reach a dashboard running on a private LAN because of browser HTTPS, CORS and Private Network Access restrictions. Never put real Bearer tokens in the repository or published examples.

## Weather condition API

- `GET /api/v1/weather/conditions`: list canonical codes.
- `POST /api/v1/weather/conditions`: set the persistent current condition using `Authorization: Bearer <WEATHER_API_TOKEN>` and JSON `{"condition":"cloudy"}`.

The last valid condition remains active until replaced. The dashboard does not apply a TTL; the Homey Flow owner controls update cadence.

## Weather API token management

Named Bearer tokens are created and revoked from the PIN-protected Settings screen. Each token is scoped to weather-condition writes. The server stores only a SHA-256 hash; the full token is returned once at creation and cannot be retrieved later. The Settings API requires the short-lived `x-settings-session` header. Revocation takes effect immediately.

The initial `WEATHER_API_TOKEN` environment variable remains temporarily accepted for backward compatibility. After creating and testing a managed token, remove that legacy variable from the private `.env` file and restart the container.
