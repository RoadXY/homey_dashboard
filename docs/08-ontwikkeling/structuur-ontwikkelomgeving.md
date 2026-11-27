# Repository structure and local development

The repository is a monorepo with separate application boundaries:

```text
homey_dashboard/
├── docker/       # Dashboard frontend, backend, Node project and container files
├── homey-app/    # Companion Homey Pro app
├── docs/         # Shared product and developer documentation
├── .github/      # Repository-wide workflows
├── .env.example  # Non-secret environment template
├── .gitignore
├── README.md
└── LICENSE
```

## Dashboard project

The Node.js project root is `docker/`. Run npm commands from that directory:

```bash
cd docker
npm ci
npm run dev
npm run typecheck
npm test
npm run build
```

The Docker build context is also `docker/`; its `.dockerignore` is stored in that directory.

The local Compose file can be started from the repository root:

```bash
docker compose -f docker/compose.yaml up --build
```

The Compose file resolves its build context and bind mounts relative to `docker/`. Its `env_file: ../.env` points to the private environment file at repository root.

## Production deployment

Use `docker/compose.prod.yaml` for the host-network production deployment. The optional bridge alternative is `docker/compose.prod.bridge.yaml`. Both declare the explicit Compose project name `homey_dashboard` and use the same `dashboard_data` named volume. This preserves the existing production volume name `homey_dashboard_dashboard_data`.

The production environment file remains at `/opt/homey_dashboard/.env` on the Ubuntu host. It is not moved into Git or into the Docker project directory. The update script must invoke `docker/compose.prod.yaml` from the repository root.

## Homey app

The `homey-app/` directory is the separate Homey Pro app project. It will own its app manifest, drivers, Flow cards, assets and app-specific build/test configuration. It calls the Docker dashboard's public API and does not serve the dashboard website.

## Documentation

All shared documentation remains under `docs/`. Source-code references in documentation should use paths relative to the document, such as `../../docker/src/server/` from documents in a first-level docs subdirectory.
