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
5. Controleer `http://localhost:5173/api/health` voor de backendstatus via de Vite-proxy. De backendpoort `3000` wordt niet op de Ubuntu-host gepubliceerd; deze blijft intern in de container en kan daardoor naast bijvoorbeeld Grafana op hostpoort 3000 draaien.

De Vite-ontwikkelinterface wordt op hostpoort `5173` gepubliceerd voor toegang vanaf het lokale netwerk. De backendpoort `3000` wordt niet op de host gepubliceerd en blijft intern in de container. Beperk netwerktoegang tot vertrouwde apparaten via de bestaande netwerk-/firewallregels. De productiepoort is een voorlopige standaard en moet vóór deployment worden afgestemd op de serveromgeving.

## Belangrijke aandachtspunten

- De eerste Compose-configuratie gebruikt een development target en is bedoeld voor lokale ontwikkeling.
- `compose.prod.yaml` wordt gestart met `docker compose -f compose.prod.yaml up -d --build`.
- Een lockfile wordt gegenereerd en gecommit zodra de eerste dependency-installatie en build lokaal succesvol zijn gevalideerd.
- De Homey API-key wordt nog niet gebruikt en mag niet in frontendconfiguratie worden opgenomen.
- De eerste scaffold is geen afgeronde dashboardrelease; Homey-integratie, persistent configuratiebeheer, SSE en functionele dashboardcomponenten volgen later.


## Ubuntu-server: vaste projectlocatie

De afgesproken projectlocatie op de Ubuntu-server is `~/opt/homey_dashboard` (oftewel `$HOME/opt/homey_dashboard`). Gebruik deze map als werkdirectory voor alle onderstaande Git- en Docker Compose-commando's. De locatie is een hostpad; binnen de Docker-container blijft de applicatiemap `/app`.

Voorbeeld:

```bash
cd "$HOME/opt/homey_dashboard"
git pull
docker compose up --build -d
```

Na een nieuwe SSH-sessie moet eerst naar deze projectmap worden gegaan voordat `git pull`, `docker compose ps` of `docker compose logs` wordt uitgevoerd.


## Poortconflict met bestaande services (11 november 2026)
- Ubuntu-hostpoort `3000` is al in gebruik door Grafana. Daarom wordt de backendpoort `3000` niet langer op de host gepubliceerd.
- De backend blijft intern bereikbaar op `127.0.0.1:3000` binnen de dashboardcontainer. Vite routeert `/api`-verzoeken intern door naar de backend.
- Alleen de Vite-ontwikkelinterface wordt voorlopig op `127.0.0.1:5173` van de host gepubliceerd.
- De healthcheck tijdens ontwikkeling loopt via `http://localhost:5173/api/health`; poort `3000` hoeft niet rechtstreeks vanaf Ubuntu bereikbaar te zijn.


## LAN-toegang ontwikkelinterface (11 november 2026)
- Voor testen vanaf een andere computer/tablet wordt Vite-poort `5173` gepubliceerd op de hostinterfaces (`5173:5173`).
- De ontwikkelinterface is daarmee bereikbaar via het LAN-adres van Ubuntu, bijvoorbeeld `http://10.7.10.8:5173`.
- Backendpoort `3000` blijft uitsluitend intern in de container; API-verzoeken lopen via de Vite-proxy.
- Dit is een tijdelijke ontwikkelinstelling. Voor productie wordt toegang via de beoogde reverse proxy/HTTPS en passende netwerkbeperkingen ingericht.


## Eerste succesvolle start op Ubuntu (11 november 2026)
- De eerste Docker-ontwikkelomgeving is succesvol gestart op de Ubuntu-server in `/opt/homey_dashboard`.
- De frontend is vanaf een andere machine op het LAN bereikbaar via `http://10.7.10.8:5173`.
- De browser toont de scaffoldpagina en de status **Backend online**; daarmee is de frontend-naar-backend health-check bevestigd.
- Hostpoort `3000` blijft vrij voor de bestaande Grafana-installatie; de dashboardbackend gebruikt poort `3000` uitsluitend intern in de container.
- De Vite-ontwikkelinterface wordt voorlopig op hostpoort `5173` gepubliceerd. Dit is een ontwikkelconfiguratie, nog geen productie-/tablet-deployment.
- Volgende technische stap: de basisintegratie met Homey Pro 2023 voorbereiden en daarna de eerste echte dashboardcomponenten bouwen volgens de goedgekeurde fase-1A-scope.


## Homey Pro 2023 – eerste lokale API-integratie

De backend bevat een eerste read-only adapter op basis van de officiële `homey-api` Node.js-client. Deze gebruikt `HomeyAPI.createLocalAPI({ address, token })` voor de lokale Homey-verbinding. De API-key blijft uitsluitend in het lokale `.env`-bestand op Ubuntu en wordt nooit naar de frontend gestuurd of in Git opgenomen.

### Lokale configuratie

Voeg aan `/opt/homey_dashboard/.env` toe:

```dotenv
HOMEY_ADDRESS=http://<IP-ADRES-VAN-HOMEY>
HOMEY_API_KEY=<LOKALE-HOMEY-API-KEY>
```

Gebruik het daadwerkelijke IP-adres van Homey Pro 2023 dat vanaf de Docker-host/container bereikbaar is. De voorbeeldwaarden uit `.env.example` zijn placeholders en mogen niet letterlijk worden gebruikt.

Maak in de Homey Web App via **Settings → API Keys → New API Key** een sleutel aan. Geef deze voor de eerste inventarisatie alleen leesrechten voor apparaten en zones (View devices / View zones). Geef geen apparaatbedienings- of Flow-startrechten in deze eerste read-only stap. Bewaar de sleutel direct; Homey toont hem na het aanmaken niet opnieuw. Een sleutel kan later worden ingetrokken.

Na aanpassen van `.env` moet de container opnieuw worden aangemaakt:

```bash
cd /opt/homey_dashboard
docker compose up -d --force-recreate
```

### Eerste endpoints

- `GET /api/homey/status`: verbindingsstatus en aantallen, zonder geheimen.
- `POST /api/homey/connect`: voert een nieuwe verbindingspoging uit.
- `GET /api/homey/inventory`: leest apparaat- en ruimtelijsten read-only uit.

De eerste implementatie maakt geen wijzigingen in Homey. Realtime-updates, apparaatbediening en Flows starten zijn nog niet geactiveerd.

### Beveiliging en netwerk

- Zet de echte API-key uitsluitend in `.env`; deel hem niet in chat, screenshots, shell-output of GitHub.
- Controleer dat `.env` door `.gitignore` wordt uitgesloten.
- De Homey API-key wordt alleen door de backend gelezen.
- Het exacte Homey-adres en de bereikbaarheid over de VLAN-grens moeten vanaf de Ubuntu-server worden getest. Er wordt geen poortnummer verondersteld.



## Eerste succesvolle Homey Pro 2023-verbinding (11 november 2026)
- De lokale Homey API-verbinding vanuit de Docker-backend is succesvol getest.
- `POST /api/homey/connect` retourneerde `state: online`.
- Homey rapporteerde 128 apparaten en 22 ruimtes.
- De backend health-check retourneert HTTP 200 via de Vite-proxy.
- De verbinding werkt over de VLAN-grens; de gebruikte API-key is alleen lokaal in `.env` opgeslagen.
- De verbindingstest is read-only; er zijn geen apparaten, Flows of Homey-instellingen gewijzigd.
- Volgende stap: de Homey-inventarisatie uitlezen en de exacte sensor/capability-ID's voor weer en de vier temperatuurtegels vaststellen.


## Herstel backend-startfout bij meetwaardenendpoint (11 november 2026)
- Na toevoeging van `GET /api/homey/readings` startte de Fastify-backend niet meer.
- De containerlogs toonden een esbuild-transformatiefout in `src/server/index.ts`: letterlijk opgeslagen `\\n`-tekens waren in de routecode terechtgekomen in plaats van echte regeleinden.
- Hierdoor kon Vite de API-proxy niet bereiken (`ECONNREFUSED 127.0.0.1:3000)); dit was geen Homey-netwerk- of API-keyprobleem.
- De routecode is gecorrigeerd in commit `6b14d15` op `phase_1_foundation`.
- Na ophalen van deze commit moeten de backendroutes opnieuw worden gecontroleerd via `/api/health`, `/api/homey/status` en `/api/homey/readings`.


## Eerste succesvolle uitlezing van Homey-meetwaarden (11 november 2026)
- Na herstel van de TypeScript-syntaxisfout geeft `GET /api/health` HTTP 200.
- `GET /api/homey/readings` geeft HTTP 200 en levert actuele waarden voor de geselecteerde apparaten.
- Geobserveerde waarden tijdens de test:
  - Multisensor woonkamer: 22,0 °C.
  - Woonkamer thermostaat: 20,4 °C.
  - Radiator keuken 1: 15,4 °C.
  - Radiator keuken 2: 16,1 °C.
  - Radiator keuken 3: 10,8 °C.
  - Temperatuur Sem: 16,5 °C.
  - Temperatuur Bram: 17,4 °C.
  - Weer: 5,5 °C; gevoelstemperatuur 3,5 °C.
- Voor de woonkamer is de multisensor voorlopig de voorkeursbron. Voor Sem en Bram zijn de gelijknamige temperatuursensoren de voorkeursbron.
- De drie keuken-radiatorwaarden worden niet als kamergemiddelde gekozen; eerst moet de Homey Logic-variabele `temperatuur_gemiddeld_keuken` onderzocht worden.
- Aandachtspunt: in dezelfde testsessie retourneerde `/api/homey/status` de status `not-configured`, terwijl `/api/homey/readings` meetwaarden kon uitlezen. Dit is een inconsistentie die vóór weergave van de Homey-status in de UI onderzocht moet worden.
- De uitlezing is read-only; er zijn geen Homey-apparaten, Flows of instellingen gewijzigd.


## Bevestiging Homey-status na eerste meetwaardenaanvraag (11 november 2026)
- Een vervolgaanvraag op `GET /api/homey/status` retourneerde `state: online`, `deviceCount: 128` en `zoneCount: 22`.
- De eerdere `not-configured`-status was de initiële toestand vóór de eerste aanvraag die de Homey-verbinding automatisch tot stand bracht; er is geen blijvende statusinconsistentie vastgesteld.


## Terminologie Homey-verbindingsstatus (11 november 2026)
- De initiële status en de status wanneer de Homey-configuratie ontbreekt gebruiken voortaan `not-connected` in plaats van `not-configured`.
- Reden: voor de dashboardgebruiker beschrijft `not-connected` duidelijker dat Homey op dat moment niet verbonden is; `not-configured` suggereerde ten onrechte dat de integratie niet ingericht was.
- De overige statussen blijven `connecting`, `online` en `offline`.
- Codewijziging: `src/server/homey.ts`, commit `475f85f`.
