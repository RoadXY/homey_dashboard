# Homey Dashboard

Monorepository for the Homey Dashboard product: the Docker-hosted dashboard for Homey Pro 2023 and its companion Homey app.

## Repository layout

- `docker/` — dashboard website, API, Dockerfile, Compose files and Node.js project.
- `homey-app/` — Homey Pro app (drivers, Flow cards and app assets).
- `docs/` — shared project, architecture, API, developer and user documentation.
- `.github/` — repository-wide CI and documentation workflows.

The Docker application is the only component that serves the dashboard website. The Homey app is a separate integration client for the container's public API; it does not contain a second dashboard.

## Development

Run dashboard commands from `docker/`:

```bash
cd docker
npm ci
npm run dev
```

Build and test with `npm run typecheck`, `npm test` and `npm run build`.

For local Compose development, run from the repository root:

```bash
docker compose -f docker/compose.yaml up --build
```

The root `.env.example` is the template for a private root-level `.env`. Never commit secrets.

## Production deployment

The production Compose file is `docker/compose.prod.yaml`. The production environment file remains at repository root and is referenced as `../.env`. The Compose project name is explicitly `homey_dashboard` to preserve the existing production named volume `homey_dashboard_dashboard_data`.

The Ubuntu update script on the production host uses branch `phase_1_foundation`; its Compose file setting must be changed to `docker/compose.prod.yaml` as part of the server rollout. Do not deploy the new layout until the repository CI is green and the Compose configuration has been checked against the existing volume.

All implementation and documentation changes are integrated directly on `phase_1_foundation`.
