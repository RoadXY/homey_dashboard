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


### Validatie statuslabel op Ubuntu (11 november 2026)
- De gebruiker heeft commit `b48e482` opgehaald en de dashboardcontainer herstart.
- `GET /api/homey/status` retourneerde HTTP 200 met `state: not-connected`, zonder foutmelding.
- Daarmee is de nieuwe initiële statusbenaming op de Ubuntu-server gevalideerd.


## Uitbreiding Homey-uitlezing: weer en Logic-gemiddelden (11 november 2026)
- `GET /api/homey/readings` leest voor het apparaat `Weer` nu alle relevante aanwezige weer-capabilities uit: temperatuur, gevoelstemperatuur, min/max, luchtvochtigheid, luchtdruk, bewolking, zicht, wind, neerslag, sneeuw, zonsopkomst/-ondergang en conditie/omschrijving.
- Voor de overige geselecteerde apparaten blijft de meetwaardenroute beperkt tot temperatuur en gevoelstemperatuur.
- Nieuw read-only endpoint: `GET /api/homey/logic`. Dit retourneert uitsluitend de twee dashboardgemiddelden `temperatuur_gemiddeld_keuken` en `temperatuur_gemiddeld_woonkamer`.
- Voor Logic-uitlezing is de Homey API-scope `homey.logic.readonly` vereist. De huidige API-key is eerder aangemaakt met alleen apparaat- en zonerechten; maak daarom een nieuwe API-key met de bestaande leesrechten plus Logic read-only en vervang lokaal alleen de waarde van `HOMEY_API_KEY` in `.env`. Deel de sleutel niet in chat of GitHub.
- De Homey Web API documenteert `api.logic.getVariables()` als read-only endpoint met scope `homey.logic.readonly`. Zie de [Homey API-referentie](https://athombv.github.io/node-homey-api/HomeyAPIV3Local.ManagerLogic.html).
- De uitbreiding wijzigt geen Homey-apparaten, Logic-waarden, Flows of instellingen.


## TypeScript-buildfout Homey Logic-integratie (11 november 2026)
- Tijdens de Docker-build op Ubuntu faalde `tsc -p tsconfig.server.json` in `src/server/homey.ts`.
- De geïnstalleerde `homey-api`-types vereisen bij `HomeyAPI.createLocalAPI()` expliciet de parameter `debug`; deze is op `null` gezet omdat de backend geen extra debugfunctie nodig heeft.
- De type-informatie van `api.logic.getVariables()` werd door TypeScript als `unknown` behandeld. De resultaten worden nu expliciet als lijst van Homey Logic-variabelen getypeerd voordat de twee toegestane variabelen worden gefilterd.
- Correctie vastgelegd in commit `88d5f33`.
- Validatie van de nieuwe Docker-build op Ubuntu staat nog open. De bestaande draaiende container is niet als succesvol bijgewerkt beschouwd zolang die build niet volledig slaagt.


## Docker healthcheck en applicatie-readiness (11 november 2026)
- Er zijn afzonderlijke API-endpoints toegevoegd: `GET /api/health/live` voor liveness en `GET /api/health/ready` voor readiness.
- Het bestaande `GET /api/health` blijft backwards-compatible en geeft daarnaast applicatiereadiness, uptime en de Homey-status als informatieve deelstatus terug.
- Docker controleert voortaan `/api/health/ready` met Node's ingebouwde `fetch`; hiervoor zijn geen extra tools zoals curl of wget in de container nodig.
- De ontwikkelservice in `compose.yaml` heeft een expliciete healthcheck (interval 30s, timeout 5s, 3 retries, startperiode 30s). De productie-runtime in `Dockerfile` gebruikt dezelfde endpoint en instellingen.
- Homey-bereikbaarheid is bewust geen voorwaarde voor Docker-health. Als Homey offline is, blijft de dashboardapplicatie beschikbaar en rapporteert alleen de Homey-deelstatus dit.
- Docker-healthstatus: `starting` tijdens de startperiode, daarna `healthy` bij succesvolle readiness-controles of `unhealthy` na opeenvolgende mislukte controles. De containerstatus (bijvoorbeeld `running` of `exited`) blijft hiervan een afzonderlijk gegeven.
- Codewijzigingen: `src/server/index.ts` (783faa1), `compose.yaml` (993d0c6), `Dockerfile` (7965bc6).
- Ubuntu-validatie met `docker compose ps`, `docker inspect` en de health-endpoints moet nog worden uitgevoerd.


### Validatie Docker-healthcheck op Ubuntu (11 november 2026)
- De gebruiker heeft commit `d01c0ca` opgehaald en de ontwikkelcontainer opnieuw gebouwd; de Docker-build is succesvol afgerond.
- `docker inspect` rapporteerde `Status=running Health=healthy` voor `homey_dashboard-dashboard-1`.
- `GET /api/health/live` retourneerde HTTP 200 met `status: ok`.
- `GET /api/health/ready` retourneerde HTTP 200 met `status: ready`.
- De healthcheck is daarmee op de Ubuntu-ontwikkelcontainer gevalideerd. Homey was na de containerstart nog `not-connected`; dit heeft de Docker-healthstatus niet beïnvloed, zoals ontworpen.
- Portainer-weergave is nog niet afzonderlijk gecontroleerd.

### Open punt Homey Logic-waarden
- `GET /api/homey/logic` vindt beide verwachte variabelen (`temperatuur_gemiddeld_woonkamer` en `temperatuur_gemiddeld_keuken`), maar retourneert voor beide `value: null`.
- De Homey Logic API-route werkt dus op naam/id-niveau, maar de werkelijke waarden zijn nog niet bevestigd. Dit punt blijft open voor nader onderzoek; `null` mag niet als een temperatuurwaarde worden geïnterpreteerd.


## Diagnose temperatuur-gemiddeldeflows (11 november 2026)
- De gebruiker heeft bevestigd dat de getoonde waarden `42` fictieve/testwaarden zijn; de twee Logic-variabelen bevatten in werkelijkheid `null`.
- De vier opgegeven flows zijn read-only opgehaald uit Homey. Alle vier zijn ingeschakeld en niet als broken gemarkeerd.
- Keuken:
  - `Temperatuur gemiddelde keuken – airco` (33d9edf8-53c9-43d8-a575-b33b43ad0b2e), trigger: `measure_temperature_changed` van het airco-apparaat.
  - `Temperatuur gemiddelde keuken – verwarming` (f2d76792-8507-4e7a-a794-1edf3a1a6511), trigger: `measure_temperature_changed` van het verwarmingsapparaat.
  - Beide schrijven naar Logic-variabele `temperatuur_gemiddeld_keuken` (0181a65b-2001-4d33-9e98-0ea9ecce2ade) met formule `(huidige variabele + Temperatuur) / 2`.
- Woonkamer:
  - `Temperatuur gemiddelde woonkamer – multisensor` (e32a05fd-adc9-4689-87d9-b340a1f71dcc), trigger: `measure_temperature_changed` van de multisensor.
  - `Temperatuur gemiddelde woonkamer – thermostaat` (eaf41103-3cf6-47b5-a6aa-339da845f15b), trigger: `measure_temperature_changed` van de thermostaat.
  - Beide schrijven naar Logic-variabele `temperatuur_gemiddeld_woonkamer` (15c95ed8-e341-41e4-b9f0-e897e5292d16) met formule `(huidige variabele + Temperatuur) / 2`.
- In de vier onderzochte flows is geen afwijkende doelvariabele of andere numerieke toewijzing aangetroffen.
- Diagnose: de formules lezen de bestaande gemiddelde variabele terug en delen door twee. Als de beginwaarde `null` is, levert deze berekening geen geldige numerieke startwaarde op. Dit is een waarschijnlijke verklaring voor het uitblijven van een bruikbare waarde; de exacte Homey-evaluatie van `null` in deze formule is nog niet apart getest.
- De triggers reageren op temperatuurwijzigingen. Daardoor kan de flow van de nog online sensor blijven draaien als de andere sensor offline is, mits de formule een ontbrekende/ongeldige beginwaarde veilig afhandelt.
- Terminologie: de huidige formule is een exponentieel voortschrijdend gemiddelde met een vaste weging van 50% (EMA-achtig), niet een tijdvenster-rolling-average.
- Er zijn geen Homey-flows, apparaten of Logic-variabelen gewijzigd. Herstelontwerp en eventuele aanpassing wachten op expliciete goedkeuring van de gebruiker.


## Tijdelijke veilige toestand temperatuur-gemiddelden (11 november 2026)
- De gebruiker heeft handmatig numerieke startwaarden ingesteld voor beide Logic-variabelen en de vier temperatuur-gemiddeldeflows uitgeschakeld om onbedoelde overschrijving tijdens ontwikkeling te voorkomen.
- Read-only controle via Homey Logic API bevestigt:
  - `temperatuur_gemiddeld_woonkamer`: type `number`, waarde `22`.
  - `temperatuur_gemiddeld_keuken`: type `number`, waarde `21`.
- Dit zijn handmatig ingestelde tijdelijke waarden en mogen niet als gevalideerde actuele kamertemperaturen worden beschouwd.
- De vier flows blijven uitgeschakeld totdat de berekeningslogica is herzien en expliciet door de gebruiker is goedgekeurd.
- De dashboardintegratie kan de variabelen nu als numerieke waarden uitlezen. De definitieve keuze tussen een 50/50 exponentieel voortschrijdend gemiddelde en een rolling average over een tijdvenster is nog niet gemaakt.


## Eerste hoofdschermimplementatie (11 november 2026)
- De gebruiker heeft akkoord gegeven om de eerste echte dashboardcomponenten te bouwen.
- `src/client/main.tsx` is vervangen: de scaffold-welkomstpagina maakt plaats voor een eerste dashboardlayout met klok/datum, Homey-status, weerkaart, vier temperatuurtegels en de acht afgesproken Quick Actions.
- De frontend haalt gegevens op via bestaande read-only endpoints: `/api/homey/status`, `/api/homey/readings` en `/api/homey/logic`.
- Verversing: klok elke seconde; Homey-gegevens elke 30 seconden.
- Temperatuurbronnen in deze eerste implementatie: woonkamer Multisensor, keuken Logic-gemiddelde, Temperatuur Sem en Temperatuur Bram. Ontbrekende waarden worden als een streepje weergegeven; er worden geen fictieve temperaturen ingevuld.
- `src/client/style.css` bevat de eerste donkere 40/60-layout, grote temperatuurtegels en responsive aanpassing voor kleinere viewports.
- Quick Actions zijn in deze stap alleen visuele placeholders met label "Binnenkort"; er worden geen Homey Flows gestart en geen apparaten bediend.
- De huidige UI toont nog geen meldingenpaneel. Dat is bewust buiten deze eerste hoofdschermstap gehouden.
- GitHub-commits: `e6456e4` (frontendstructuur) en `24dfbb5` (styling).
- Validatie: code is op GitHub bijgewerkt; een Docker-build en visuele controle op Ubuntu/tablet moeten nog worden uitgevoerd. De implementatie wordt dus nog niet als getest of afgerond beschouwd.



## Instellingenpagina General – eerste implementatie (12 november 2026)

De eerste instellingenpagina is toegevoegd aan `src/client/main.tsx` en `src/client/style.css` volgens de door de gebruiker aangewezen General-mockup. De toegang wordt gestart door de klokkaart op het hoofddashboard 850 ms ingedrukt te houden. De PIN wordt server-side gecontroleerd via `POST /api/settings/unlock`; de lokale `.env` moet hiervoor `SETTINGS_PIN` bevatten.

Nieuwe backendonderdelen:
- `src/server/settings.ts`: gevalideerde General-instellingen met persistente JSON-opslag onder `DATA_DIR` (standaard `/app/data`).
- `GET/POST /api/settings/general`: instellingen ophalen en opslaan.
- `GET /api/system/status`: Homey-status, dashboardversie, uptime, geheugen en opslag waar beschikbaar.

De productiecompose mount al het volume `dashboard_data:/app/data`, zodat instellingen containerrestarts overleven. De Homey-taal wordt nog niet uit de gebruikte API gelezen; de pagina maakt deze beperking zichtbaar in plaats van een detectie te veinzen.

**Validatie:** Docker-build en browser/tabletcontrole zijn nog niet uitgevoerd. Voer na het instellen van `SETTINGS_PIN` het bestaande updatescript uit en controleer de buildoutput voordat deze implementatie als werkend wordt beschouwd.


### Beveiligingsdetail instellingenroute

Na correcte PIN-invoer geeft de server een willekeurige sessietoken uit. De General-instellingen-API vereist deze token in de header `x-settings-session`; zonder geldige sessie geeft de API HTTP 401. De sessie verloopt na 30 minuten inactiviteit. De PIN zelf wordt uitsluitend server-side vergeleken met `SETTINGS_PIN` en wordt niet naar de browser teruggestuurd.

## Productiedeployment op Ubuntu – poort- en Compose-keuze (12 november 2026)

- De Ubuntu-host gebruikt poort 3000 al voor Grafana. De productiecontainer luistert intern op poort 3000, maar publiceert deze op hostpoort 5173 via `5173:3000`. Grafana blijft daardoor ongewijzigd bereikbaar op hostpoort 3000.
- Productie wordt gestart met `docker compose -f compose.prod.yaml up -d --build dashboard`. Gebruik hiervoor niet de standaard `docker compose up`, want dat kiest `compose.yaml` (de Vite-ontwikkelconfiguratie).
- Het updatescript `~/bin/homey-dashboard-update.sh` moet dezelfde productiecomposefile expliciet gebruiken voor configuratiecontrole, build/start en statuscontroles. Het script mag geen secrets afdrukken.
- Een bestaande container opnieuw aanmaken zonder `--build` kan een oude image hergebruiken; na Dockerfile- of applicatiewijzigingen moet de image opnieuw worden gebouwd.
- Validatie van de productiebuild en de readiness-endpoint op `http://localhost:5173/api/health/ready` staat nog open. De bestaande Grafana-container en Docker-volumes mogen tijdens herstel niet worden verwijderd of aangepast.


## General-instellingen vereenvoudigd en Homey-taaldetectie (12 november 2026)

- De General-pagina toont niet langer de Settings-knop rechtsboven, datum of tijd in de bovenbalk, of de titelhiërarchie `Settings > General`. De bestaande subtitel blijft behouden en is links uitgelijnd.
- De geheugen- en opslagregel onder System status is verwijderd. De overige systeemstatusregels blijven staan.
- Homey-taaldetectie gebruikt de read-only Homey Web API-methode `api.i18n.getOptionLanguage()` via de backend. De backend geeft alleen de gedetecteerde taalcode door in `GET /api/system/status`; de Homey API-key blijft server-side.
- Hiervoor vereist de Homey API-key de scope `homey.system.readonly`. Als deze scope ontbreekt, blijft de detectie onbekend en toont de instellingenpagina een permissiehint. Voeg de scope toe aan de lokale API-keyconfiguratie in Homey en werk uitsluitend de lokale `.env` bij; deel de sleutel niet.
- Deze stap maakt het uitlezen en tonen van de Homey-taal mogelijk. Volledige vertaling van alle dashboardteksten op basis van de automatische taalkeuze is een afzonderlijke vervolgstap en is hiermee nog niet gerealiseerd.
- Validatie van de Docker-build, daadwerkelijke taalcode uit Homey en weergave op de tablet staat nog open.


## Docker-build optimalisatie: bestandseigenaarschap (12 november 2026)

- De productiebuild van 12 november duurde circa 298 seconden; stap `RUN chown -R node:node /app` nam daarvan circa 281 seconden in beslag.
- De recursieve eigenaarswijziging is verwijderd. Runtimebestanden `dist` en `config` worden nu met `COPY --chown=node:node` gekopieerd.
- Alleen de schrijfbare datadirectory `/app/data` wordt aangemaakt en expliciet aan gebruiker `node` toegewezen. De applicatie blijft als niet-rootgebruiker `node` draaien.
- Verwachting: de buildstap wordt veel sneller doordat Docker geen volledige recursieve eigenaarswijziging over `/app` meer uitvoert. De precieze tijdwinst moet bij de volgende build worden gemeten.


## Nederlandse taaloptie voor General-instellingen (12 november 2026)

- De taalkeuze bevat nu expliciet `Nederlands` naast `Engels` en `Automatisch (Homey-taal)`.
- Bij expliciete keuze `nl-NL` wordt de General-instellingenpagina in het Nederlands getoond. Bij `automatic` wordt Nederlands gebruikt wanneer Homey-taaldetectie een taalcode beginnend met `nl` retourneert; anders blijft Engels de fallback.
- De General-pagina vertaalt navigatie, sectiekoppen, labels, statuswaarden, acties en de bevestiging bij niet-opgeslagen wijzigingen. De instelling wordt pas permanent opgeslagen via de bestaande knop Opslaan.
- De wijziging is bedoeld om de Nederlandse taalkeuze en Homey-automatische detectie op de instellingenpagina te testen. De rest van het hoofddashboard heeft al grotendeels Nederlandstalige labels; volledige centrale vertaalondersteuning voor alle dashboardcomponenten en weerteksten is nog niet gerealiseerd.
- Docker-build en visuele validatie van de nieuwe taaloptie op Ubuntu/tablet staan nog open.


## Centrale i18n-structuur en Engelse/Nederlandse UI (12 november 2026)

### Audit bestaande situatie
- De repository bevatte vóór deze wijziging geen centrale i18n-library of vertaalbestanden. De teksten stonden grotendeels inline in `src/client/main.tsx`.
- Bestaande JSON-bestanden onder `config/notifications` en `config/weather` zijn functionele configuratiebestanden, geen vertaalcatalogi.
- De eerdere taalkeuze vertaalde slechts een deel van de General-instellingenpagina. Dit was geen volledige websitebrede i18n-oplossing.

### Nieuwe implementatie
- Centrale vertaalcatalogi: `src/client/locales/nl.json` en `src/client/locales/en.json`.
- Gedeelde helper: `src/client/i18n.ts`, met `translate()` en `resolveLocale()`. Er is geen extra npm-dependency toegevoegd; de bestaande Vite/TypeScript-configuratie ondersteunt JSON-imports via `resolveJsonModule`.
- De vertaalcatalogi bevatten dezelfde 120 sleutels (gecontroleerd op sleutelpariteit); beide JSON-bestanden zijn als JSON geparseerd.
- De taalkeuze is beschikbaar voor de hele client. Een beperkt publiek endpoint `GET /api/settings/language` geeft alleen de opgeslagen taalvoorkeur terug, zodat het hoofddashboard dezelfde keuze kan gebruiken zonder de PIN-beveiligde algemene instellingen-API open te stellen.
- De hoofdinterface, quick actions, temperatuurtegels, meldingslabels en de bestaande meldingsinhoud, weerconditie-labels, PIN-scherm en General-instellingen gebruiken de centrale catalogi. Temperatuurdecimalen en datum/tijdnotatie volgen de gekozen taal.
- De bestaande `Restore defaults`-knop en bijbehorende ongebruikte handler zijn verwijderd.
- Het pictogram bij Datum en tijd is gewijzigd naar een klokteken (`◷`).
- Onbekende vertaalkeys vallen terug op Engels. De automatische keuze gebruikt Nederlands bij een Homey-taalcode die met `nl` begint; anders Engels.

### Bekende grenzen en validatie
- Homey-weerbeschrijvingen die als vrije tekst uit een apparaat komen, zijn brondata en kunnen nog in de Homey-taal verschijnen; de dashboardlabels en genormaliseerde weercondities zijn wel vertaald.
- Namen van apparaten/ruimtes en eventueel door gebruikers aangepaste meldingen blijven bron-/gebruikersdata en worden niet automatisch herschreven.
- De twee JSON-catalogi hebben dezelfde keys en zijn syntactisch geldige JSON. De TypeScript/Docker-build en visuele controle van alle schermen moeten nog op Ubuntu worden uitgevoerd; deze wijziging wordt daarom nog niet als build- of runtime-gevalideerd beschouwd.


## Handmatig uitbreidbare talenregistratie (12 november 2026)

- Beschikbare talen worden centraal geregistreerd in `src/client/locales/languages.json`. Dit bestand bevat de automatische-keuzelabeltekst, de fallbacktaal en per taal de instellingen-ID, zichtbare eigennaam, vertaalbestandsnaam en bijbehorende Homey-taalcodes.
- `src/client/i18n.ts` laadt de geregistreerde vertaalbestanden via Vite `import.meta.glob`. De taalkeuzelijst wordt rechtstreeks uit de registratie opgebouwd.
- Een nieuwe taal toevoegen vereist daarom alleen een nieuw vertaalbestand (bijvoorbeeld `de.json`) en een registratie-item in `languages.json`. De server accepteert geldige locale-ID's; de client biedt alleen geregistreerde talen in de keuzelijst aan.
- Homey automatische detectie vergelijkt de door Homey gerapporteerde taalcode met de `homeyCodes` van de geregistreerde talen. Bij geen overeenkomst wordt de geregistreerde fallbacktaal gebruikt.
- Engelstalige instructies voor het toevoegen van talen staan in `src/client/locales/README.txt`.
- Nieuwe JSON-bestanden worden tijdens de frontend-build opgenomen. Na toevoegen van een taal is een nieuwe Docker-build/deployment nodig; een containerherstart zonder rebuild is niet voldoende.
