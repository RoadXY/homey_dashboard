# Eerste applicatiebasis

**Status:** eerste scaffold toegevoegd; lokale build nog te valideren.

## Technische basis

- Node.js 24 LTS als container-runtime en buildomgeving.
- React + Vite frontend.
- Fastify 5 backend.
- Eén productiecontainer serveert de gebouwde frontend en backend.
- Docker Compose ontwikkelconfiguratie met Vite hot reload.
- Health endpoint: `/api/health`.
- Homey is in deze scaffold nog niet gekoppeld.

Node.js 24 is gekozen als LTS-lijn met brede compatibiliteit voor de gebruikte stack. De exacte patchversie staat vast in de Dockerfile en wordt periodiek gecontroleerd op security-updates.

## Bestanden

- `package.json`, `tsconfig.json`, `vite.config.ts`: TypeScript- en buildconfiguratie.
- `src/client/`: React-interface en basisstyling.
- `src/server/index.ts`: Fastify-server en health endpoint.
- `Dockerfile`: multi-stage build en non-root runtime.
- `compose.yaml`: lokale ontwikkelomgeving.
- `compose.prod.yaml`: productieprofiel.
- `.env.example`: niet-geheime voorbeeldinstellingen.

## Lokaal starten

1. Clone de repository en ga naar de projectmap.
2. Kopieer `.env.example` naar `.env`.
3. Start de ontwikkelomgeving met `docker compose up --build`.
4. Open `http://localhost:5173` voor de Vite-ontwikkelinterface.
5. Controleer `http://localhost:3000/api/health` voor de backendstatus.

De ontwikkelpoorten zijn uitsluitend aan localhost gebonden. De productiepoort is een voorlopige standaard en moet vóór deployment worden afgestemd op de serveromgeving.

## Belangrijke aandachtspunten

- De eerste Compose-configuratie gebruikt een development target en is bedoeld voor lokale ontwikkeling.
- `compose.prod.yaml` wordt gestart met `docker compose -f compose.prod.yaml up -d --build`.
- Een lockfile wordt gegenereerd en gecommit zodra de eerste dependency-installatie en build lokaal succesvol zijn gevalideerd.
- De Homey API-key wordt nog niet gebruikt en mag niet in frontendconfiguratie worden opgenomen.
- De eerste scaffold is geen afgeronde dashboardrelease; Homey-integratie, persistent configuratiebeheer, SSE en functionele dashboardcomponenten volgen later.
