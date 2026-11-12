# API-documentatiecontrole

Controle uitgevoerd: 12 november 2026  
Branch: `phase_1_foundation`

## Resultaat

De backendroutes in `src/server/index.ts` zijn vergeleken met de HTTP-operaties in `docs/api/openapi.yaml`.

- 28 API-operaties gevonden in de backend.
- 28 API-operaties opgenomen in OpenAPI.
- Geen ontbrekende operaties.
- Geen niet-bestaande extra operaties in OpenAPI.
- De Swagger UI HTML-bestanden in `docs/api/index.html` en `public/api-docs/index.html` zijn identiek.
- Beide Swagger UI-pagina's laden de OpenAPI-specificatie relatief als `./openapi.yaml`.
- De canonieke OpenAPI-specificatie en de Docker-kopie zijn na synchronisatie identiek.

## Gevonden afwijking en herstel

De realtime synchronisatie voor instellingen was al geïmplementeerd in de backend, maar het SSE-event `settings-updated` ontbrak in:
- `docs/api/openapi.yaml`
- `docs/api/events.md`

Dit is hersteld. De documentatie beschrijft nu dat het event wordt verzonden na een geslaagde opslag via:
- `POST /api/settings/general`
- `POST /api/settings/dashboard-actions`

De eventdata bevat `section` (`general` of `quick-actions`) en `updatedAt` (ISO 8601). Het event bevat geen instellingenpayload of geheime waarden.

## Canonieke bestanden en distributie

- Canonieke OpenAPI: `docs/api/openapi.yaml`
- OpenAPI voor de lokale Docker Swagger UI: `public/api-docs/openapi.yaml`
- Swagger UI HTML voor GitHub Pages: `docs/api/index.html`
- Swagger UI HTML voor de lokale Docker Swagger UI: `public/api-docs/index.html`
- SSE-uitleg: `docs/api/events.md`

Bij wijzigingen aan de API moeten de canonieke OpenAPI-specificatie en de Docker-kopie synchroon blijven. De README in deze map beschrijft deze afspraak.

## Validatiegrens

De routevergelijking en bestandsvergelijkingen zijn uitgevoerd op de GitHub-bestanden. De CI-workflow bevat een Redocly lint-stap (`npx --yes @redocly/cli lint docs/api/openapi.yaml`) gevolgd door de applicatiebuild. Tijdens deze controle is geen nieuwe Docker-build of lokale Swagger UI-runtime-test op de Ubuntu-server uitgevoerd. Controleer de GitHub Actions-run voor het definitieve resultaat van de automatische lint- en buildstappen.
