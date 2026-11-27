# Homey Dashboard Controller – Homey app

This is the companion Homey Pro app for the Homey Dashboard Docker application.

The Homey app is a separate TypeScript / Homey SDK v3 project. It connects to one or more dashboard containers through their documented HTTP API. The Docker application remains the only runtime that serves the dashboard website; this app does not contain a second dashboard frontend.

## Project structure

- `app.ts`, `api.ts`: app lifecycle, Flow-card handlers and app HTTP API handlers.
- `drivers/dashboard/`: dashboard device, pairing and mDNS discovery.
- `lib/dashboard-api/`: typed API client, error handling and generated OpenAPI types.
- `.homeycompose/`: source manifest and Flow/discovery definitions.
- `app.json`: generated Homey app manifest.
- `locales/`: English and Dutch translations.
- `assets/`: app and driver artwork.
- `api/openapi.yaml`: API contract used to generate the typed client.
- `.github/workflows/`: Homey app validation, publish and version workflows (these must be placed under the repository-root `.github/workflows/` to be discovered by GitHub Actions).

## Development

Run commands from this directory:

```bash
npm ci
npm run build
npm run lint
npm run generate:api
```

The Homey app is built and deployed independently from the Docker dashboard. It is not part of the Docker image build context.

## Deployment

The app is intended to be validated and published through the Homey app workflow, then installed/updated on Homey Pro using the Homey app release process. The Ubuntu dashboard host is not a deployment intermediary for the Homey app.
