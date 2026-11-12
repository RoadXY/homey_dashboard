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


## Vertalingen laden tijdens runtime (12 november 2026)

- Vertaalcatalogi zijn niet langer onderdeel van de frontend-build. De client haalt bij het starten de talenregistratie en de bijbehorende JSON-bestanden op via `GET /api/locales/registry` en `GET /api/locales/:file`.
- De productiecompose mount `./src/client/locales` vanaf de Ubuntu-projectmap read-only op `/app/locales` in de container. De backend leest de bestanden rechtstreeks uit deze map.
- Een nieuwe taal toevoegen bestaat nu uit het plaatsen van het vertaalbestand en het toevoegen van een item aan `languages.json`. Daarna is alleen een containerrestart en een browser-/tabletreload nodig; een Docker-image rebuild is niet nodig.
- Deze architectuur vereist wel een eenmalige deployment van de nieuwe applicatiecode en Compose-mount. De eerstvolgende update na deze commit moet dus nog met het normale updatescript worden gebouwd. Daarna kunnen taalbestanden onafhankelijk van de image worden aangepast.
- Het volume is read-only in de container; wijzigingen worden op de Ubuntu-host gedaan. Alleen JSON-bestanden met toegestane locale-bestandsnamen worden via de API beschikbaar gesteld.
- De endpointvalidatie, werking van de bind mount en volledige Docker-build moeten op Ubuntu nog worden getest. Tot die validatie is afgerond, geldt de runtime-taaluitbreiding als geïmplementeerd maar nog niet operationeel bevestigd.


## Vertalingen onderbrengen in bestaand persistent datavolume (12 november 2026)

De eerdere aanpak met een aparte bind mount vanaf `src/client/locales` is vervangen. De gebruiker wees erop dat de productiecontainer al het named volume `dashboard_data` op `/app/data` gebruikt. De vertalingen zijn daarom ondergebracht in dat bestaande volume.

- Definitieve runtime-locatie: `/app/data/locales` (in Docker named volume `homey_dashboard_dashboard_data`).
- Bij de image-build worden de standaardbestanden uit `src/client/locales` gekopieerd naar `/app/default-locales`.
- Bij containerstart maakt de backend `/app/data/locales` aan en kopieert alleen ontbrekende standaardbestanden. Bestaande bestanden worden nooit overschreven; eigen vertalingen blijven dus behouden bij herstarts en image-updates.
- De productiecompose heeft geen aparte locale-bind-mount meer. De API leest registry en vertalingen uit `DATA_DIR/locales` en stuurt `Cache-Control: no-store` mee.
- Een nieuwe taal toevoegen of een vertaling wijzigen vereist alleen het bijwerken van JSON-bestanden in het bestaande volume en een containerrestart; geen Docker-image rebuild.
- Voor het plaatsen/bijwerken van bestanden vanaf Ubuntu kan `docker cp` worden gebruikt naar `/app/data/locales/` in de dashboardcontainer. De Engelstalige `src/client/locales/README.txt` beschrijft de werkwijze.
- Eenmalige implementatie/deployment van deze wijziging vereist wel een Docker-build zodat de runtimebestanden en initialisatiecode beschikbaar zijn.
- Nog te valideren op Ubuntu: initialisatie van de bestanden in het bestaande volume, API-responses, containerrestart en behoud van aangepaste bestanden.


## i18n-afbakening voor Homey- en gebruikerslabels (12 november 2026)

De gebruiker heeft verduidelijkt dat de labels in de screenshot `OUTSIDE · WEATHER`, `Living room`, `Kitchen`, `Sem` en `Bram` geen vaste interfacevertalingen zijn. Deze waarden komen uiteindelijk uit Homey of worden handmatig door de gebruiker ingesteld. Daarom horen ze niet in de i18n-catalogi.

- De genoemde labels zijn uit `nl.json` en `en.json` verwijderd.
- De huidige voorbeeldlabels worden in de dashboardcomponent als niet-vertaalde waarden getoond; dit is een tijdelijke weergave totdat de dynamische Homey-/gebruikersconfiguratiebron wordt aangesloten.
- Weercondities zoals Cloudy/Bewolkt en vaste interface-elementen zoals Feels like/Gevoel blijven wel i18n-vertalingen, omdat dit door de applicatie bepaalde interface-/presentatietekst is.
- Bij toekomstige mapping van Homey-ruimtes en handmatige labels worden de bronwaarden ongewijzigd weergegeven, ongeacht de dashboardtaal.


## Weather condition input API – OpenAPI and Swagger UI (12 november 2026)

### Intended integration

The dashboard will expose a versioned write endpoint, `POST /api/v1/weather/condition`, for setting the current weather condition. It will be usable by a user/test client first and by a future Homey app later. The user selects a condition from a fixed supported list; arbitrary provider-specific strings are not accepted.

### Contract and documentation

- Define the request and response contract in an OpenAPI 3.x specification.
- Serve an interactive Swagger UI page from the dashboard backend so users can inspect and test the endpoint.
- Swagger UI is the interactive documentation client; OpenAPI is the source-of-truth API contract.
- The API request carries the canonical English enum code. Localized display labels belong in the dashboard i18n files and in the future Homey Flow dropdown; translated labels must never be sent as API values.

### Approved canonical condition codes

`sunny`, `mostly_sunny`, `partly_cloudy`, `cloudy`, `overcast`, `fog`, `drizzle`, `rain`, `heavy_rain`, `showers`, `thunderstorm`, `hail`, `snow`, `snow_showers`, `sleet`, `windy`.

Day/night is a separate display dimension and is not part of this condition enum.

### Authentication direction

Use named Bearer tokens managed through Settings. Store only a secure token hash, show the secret only once at creation, support revocation, never log token values, and initially scope tokens to the weather-condition write endpoint. Exact token scopes and storage implementation remain to be designed.

### Pending technical decisions

- Exact request body and response schema, including server-generated received timestamp.
- HTTP status codes and error format.
- Swagger UI route and whether it is enabled on all network interfaces or restricted to trusted LAN/admin access.
- Persistence model for the latest condition and behavior after restart.
- Expiry/staleness behavior when no update arrives, and whether a valid API update supersedes the current Homey capability mapping.
- Whether/how the legacy `GET /api/weather` response should expose the canonical condition and source metadata.

This section records the approved direction, not a claim that the endpoint, OpenAPI specification, Swagger UI or Homey app have already been implemented.


## OpenAPI coverage and published API documentation (12 November 2026)

### Coverage policy

Maintain one version-controlled OpenAPI 3.x specification for every HTTP API route implemented by the Fastify backend, including routes called only by the React frontend. Internal frontend/backend routes are documented and tagged `Dashboard UI (internal)`; this documents the real application contract but does not make those routes supported third-party integration APIs. External integration routes (for example the future Homey weather-condition write endpoint) are tagged separately and receive explicit compatibility/versioning expectations.

Document request and response schemas, required headers, authentication, success/error status codes, and representative examples. Include health, settings, system status, Homey read endpoints, weather, notifications, locale endpoints, and the SSE endpoint. For `GET /api/events`, document the HTTP stream plus event names/payload schemas in the OpenAPI description and supporting event-stream documentation.

### Repository and GitHub Pages

- Keep the canonical specification in the repository, proposed path: `docs/api/openapi.yaml`.
- Publish a searchable static Swagger UI site with GitHub Pages, loading that version-controlled specification.
- GitHub Pages is suitable for browsing and sharing API documentation. Its `Try it out` feature is not guaranteed to reach a private LAN dashboard: HTTPS-to-HTTP mixed-content restrictions, browser CORS, and Private Network Access can block requests. Do not weaken API security or expose the dashboard publicly just to make GitHub Pages Try it out work.
- For live testing against the LAN instance, use a Swagger UI served from the dashboard itself or another same-origin/trusted local client. Keep bearer-token secrets out of published examples and committed OpenAPI files.

### Weather condition integration

The future `POST /api/v1/weather/condition` is an externally consumable integration route and must be specified with the approved 16-value enum, bearer-token security, request/response schemas, validation errors, and server-generated received timestamp. The last valid condition remains active until another valid update is received; the dashboard does not apply a TTL or auto-expiry. The user owns the Homey Flow logic and its update cadence. The received timestamp may be retained as metadata and shown for diagnostics only.

### Current route inventory to document

The current Fastify backend routes include:

- `GET /api/health/live`, `GET /api/health/ready`, `GET /api/health`
- `GET /api/homey/status`, `POST /api/homey/connect`, `GET /api/homey/readings`, `GET /api/homey/logic`, `GET /api/homey/inventory`
- `POST /api/settings/unlock`, `GET /api/settings/language`, `GET /api/settings/general`, `POST /api/settings/general`
- `GET /api/locales/registry`, `GET /api/locales/{file}`
- `GET /api/system/status`
- `GET /api/events` (Server-Sent Events)
- `GET /api/weather`, `GET /api/notifications`

This is the inventory observed in `src/server/index.ts` on 12 November 2026; it must be refreshed when routes are added, removed or changed. The weather write endpoint is planned, not yet implemented.


## Implementatie OpenAPI, Swagger UI en weercondities API (12 november 2026)

### OpenAPI en Swagger UI

- De centrale specificatie staat in docs/api/openapi.yaml (OpenAPI 3.1.0) en beschrijft alle huidige Fastify HTTP-routes, inclusief interne frontend/backend-routes.
- docs/api/index.html laadt Swagger UI 5 vanaf unpkg en toont de specificatie als doorzoekbare documentatie.
- docs/api/events.md beschrijft de SSE-eventnamen en stream.
- .github/workflows/pages.yml publiceert de inhoud van docs/api naar GitHub Pages bij wijzigingen. De workflow voert eerst Redocly lint uit op de OpenAPI-specificatie.
- Eenmalige repository-instelling: GitHub → Settings → Pages → Build and deployment → Source: GitHub Actions.
- GitHub Pages is bedoeld voor lezen/zoeken. Try it out tegen een LAN-server is niet gegarandeerd door HTTPS/CORS/Private Network Access.

### Weercondities API

- Geïmplementeerd: GET /api/v1/weather/conditions retourneert de toegestane lijst; POST /api/v1/weather/conditions schrijft de actuele conditie.
- Request: { "condition": "cloudy" }. Alleen de volgende canonieke codes worden geaccepteerd: sunny, mostly_sunny, partly_cloudy, cloudy, overcast, fog, drizzle, rain, heavy_rain, showers, thunderstorm, hail, snow, snow_showers, sleet, windy.
- POST vereist Authorization: Bearer <token>. De token wordt via WEATHER_API_TOKEN uit de lokale .env gelezen. De code vergelijkt SHA-256-digests met een timing-safe vergelijking; het token wordt niet in de datafolder opgeslagen of gelogd.
- Als WEATHER_API_TOKEN ontbreekt, antwoordt de write-route met HTTP 503. Ontbrekende/ongeldige Bearer-token geeft HTTP 401; onbekende conditie HTTP 400.
- De laatst ontvangen conditie wordt opgeslagen in DATA_DIR/weather/condition.json en blijft actief tot een volgende geldige update. Er is bewust geen TTL/automatische vervaltijd; de gebruiker beheert updatefrequentie in Homey Flow.
- GET /api/weather geeft een API-ingestelde conditie voorrang op de bestaande Homey-capabilitymapping. Als nog geen API-conditie is opgeslagen, blijft de Homey-mapping de fallback.
- De dashboardweergave gebruikt i18n-labels voor de 16 canonieke codes in Nederlands en Engels. De bestaande legacy Homey-mapping wordt compatibel vertaald naar canonieke codes.
- De bestaande Settings POST is aanvullend beveiligd met de korte instellingen-sessieheader; OpenAPI beschrijft deze beveiliging.

### Eenmalige configuratie en validatie

- Voeg lokaal in .env een sterke willekeurige waarde toe als WEATHER_API_TOKEN; genereer bijvoorbeeld met openssl rand -hex 32. Deel of commit deze waarde nooit.
- Docker-build/redeploy is nodig om deze nieuwe code te installeren. De actuele conditie zelf blijft in het bestaande persistente datavolume staan.
- Nog te valideren op de Ubuntu-server: Docker-build, healthcheck, GET lijst, POST met geldige token, POST zonder/ongeldige token, afwijzen onbekende enum, persistentie na containerrestart en weergave op dashboard.
- De toekomstige Homey-app is niet onderdeel van deze implementatie.


### Runtime-vertalingen: standaardkeys bijwerken zonder gebruikersvertalingen te overschrijven

Bij containerstart worden de standaardbestanden uit de image met de bestaande bestanden in DATA_DIR/locales samengevoegd. Voor taalcatalogi geldt: standaardkeys die nieuw zijn toegevoegd worden aangevuld; bestaande waarden van de gebruiker blijven leidend. Voor languages.json worden ontbrekende standaardtalen toegevoegd, terwijl reeds geregistreerde eigen talen behouden blijven. README.txt wordt alleen bij de eerste initialisatie gekopieerd. Hierdoor verschijnen ook nieuwe i18n-labels na een rebuild/restart in het persistente volume zonder bestaande vertalingen te overschrijven.


### CI-validatie en publicatiestatus (12 november 2026)

- GitHub Actions CI is succesvol afgerond op commit 5146b0ae: Redocly OpenAPI-lint geslaagd en npm run build geslaagd (Vite frontend + TypeScript backend).
- De GitHub Pages-publicatieworkflow start, maar stopt bij Configure GitHub Pages omdat voor de repository nog geen Pages-site is ingeschakeld/geconfigureerd. Na instelling via Repository Settings → Pages → Build and deployment → Source: GitHub Actions kan de publicatie opnieuw worden uitgevoerd.
- De endpoint is daarmee compile-/spec-validatie geslaagd, maar nog niet runtime-getest tegen de Ubuntu Docker-container. De daadwerkelijke POST-validatie en persistentiecontrole blijven open.


## Beheer van Weather API Bearer-tokens in Instellingen (12 november 2026)

- In de PIN-beveiligde General-instellingen is een sectie toegevoegd voor het aanmaken en intrekken van benoemde Weather API-tokens.
- Aanmaken: de gebruiker geeft een herkenbare naam op. De server genereert een cryptografisch willekeurige token met prefix hdy_ en retourneert het geheim uitsluitend in het antwoord op die ene create-call.
- Opslag: alleen SHA-256-hash, UUID, naam, aanmaakdatum en de laatste vier tekens worden bewaard in DATA_DIR/weather/tokens.json. Het bestand wordt met bestandsmodus 0600 geschreven. De lijst-API retourneert nooit de hash of het volledige geheim.
- Intrekken verwijdert de tokenhash direct uit het bestand; de token is daarna niet meer geldig.
- De beheer-API GET/POST /api/settings/weather-tokens en DELETE /api/settings/weather-tokens/{id} vereist de bestaande kortlevende x-settings-session uit de PIN-unlock.
- Weather-tokens zijn alleen bedoeld voor POST /api/v1/weather/conditions; ze geven geen toegang tot andere API-routes.
- De volledige token wordt na aanmaken eenmalig in de UI getoond met een kopieeractie. Bewaar deze direct in de Homey-integratie of wachtwoordmanager; opnieuw opvragen is niet mogelijk.
- De bestaande WEATHER_API_TOKEN uit .env wordt voorlopig nog als migratie-/compatibiliteitsroute geaccepteerd. Na het maken en testen van een beheerde token kan deze variabele lokaal uit .env worden verwijderd.
- Build- en OpenAPI-lintvalidatie zijn geslaagd in GitHub Actions op commit c9a3d826. Runtime-test van token aanmaken, autorisatie, intrekken en persistentie in Docker moet nog plaatsvinden.


### Swagger UI in de container en GitHub Pages-status (12 november 2026)

- Naast de statische GitHub Pages-documentatie wordt Swagger UI ook opgenomen in de Vite-public assets: public/api-docs/index.html en public/api-docs/openapi.yaml. Na deployment is de lokale documentatie beschikbaar op dezelfde host als het dashboard onder /api-docs/.
- De lokale Swagger UI gebruikt dezelfde-origin requests en is daardoor de aangewezen plek om de API op de Ubuntu-server te testen. De OpenAPI-specificatie in docs/api/openapi.yaml is de bron; de public/api-docs kopie moet bij contractwijzigingen worden bijgewerkt.
- GitHub Pages-publicatie is nog niet geslaagd. De log van run 43250294307 toont een 404 bij het ophalen van de Pages-site en daarna "Resource not accessible by integration" bij het aanmaken ervan, ondanks Pages: write in de workflowtoken. De Actions-integratie mag de Pages-site dus niet via de API aanmaken. De workflow probeert dit niet langer automatisch. Een repository-eigenaar moet de site eenmalig handmatig activeren via Repository Settings → Pages → Build and deployment → Source: GitHub Actions. Daarna kan de workflow opnieuw worden uitgevoerd.
- De tokenbeheer-UI, serverroutes en OpenAPI-contract zijn door CI-build en OpenAPI-lint gevalideerd. De Docker-runtime en tokenflow moeten nog op de Ubuntu-server worden getest.


### Correctie Swagger UI-route (12 november 2026)

Bij runtime-controle bleek dat de catch-all SPA-fallback in Fastify /api-docs afhandelde als onbekende dashboardroute. Daarom zijn expliciete routes toegevoegd: /api-docs redirect naar /api-docs/ en /api-docs/ serveert dist/client/api-docs/index.html. De statische Swagger-bestanden, waaronder openapi.yaml, blijven via fastify-static beschikbaar. De routecorrectie moet nog door een nieuwe Docker-build en runtimecontrole worden bevestigd.


### Correctie opname Swagger-assets in Docker-build (12 november 2026)

De eerste runtime-fix gaf een 404-melding dat Swagger UI-assets ontbraken. Oorzaak: Vite gebruikt src/client als root en nam daardoor de repository-level public-map niet automatisch mee. vite.config.ts is aangepast met publicDir: ../../public zodat public/api-docs/index.html en public/api-docs/openapi.yaml in dist/client/api-docs terechtkomen. Na de CI-build moet de Docker-image opnieuw gebouwd en uitgerold worden; daarna moeten /api-docs/ en /api-docs/openapi.yaml runtime worden gecontroleerd.


### Kopieerfunctie Weather API-token (12 november 2026)

De kopieerknop gebruikte eerst uitsluitend navigator.clipboard.writeText. Dit is in browsers op een plain-HTTP LAN-adres vaak niet beschikbaar omdat de Clipboard API een secure context vereist. De knop gebruikt nu eerst de moderne Clipboard API en valt bij ontbreken/falen terug op een verborgen textarea met document.execCommand("copy"). De interface toont een gelokaliseerde succes- of foutmelding. Deze wijziging moet na deployment op het tablet/LAN-adres worden getest.


### Inline kopieerbevestiging voor Weather API-token (12 november 2026)

Na kopiëren toont de tokenkaart direct naast de knop een afgeronde statusmelding. Succes wordt groen weergegeven; een mislukte kopieerpoging rood. De meldingen gebruiken de bestaande i18n-sleutels settings.tokenCopySuccess en settings.tokenCopyError in nl.json en en.json, met aria-live statusfeedback. De melding wordt bij het starten van een nieuwe tokenactie gewist.


## Correctie – uitsluitend Weather API voor de conditie (12 november 2026)

De gebruiker heeft besloten dat de Weather API de enige bron voor de weergegeven weerconditie is. De eerdere Homey-capabilitymapping is volledig verwijderd uit de runtime en de configuratiefile is uit de repository verwijderd.

- `src/server/weather.ts` leest nu uitsluitend `DATA_DIR/weather/condition.json`; zonder opgeslagen conditie retourneert `GET /api/weather` `category: unknown`, `source: api` en `reason: condition_not_received`.
- De frontend gebruikt uitsluitend de canonieke API-code voor het i18n-label en weericoon. De Homey-tekstvelden `conditioncode_text` en `description` worden niet meer als fallback gebruikt.
- Homey blijft aanvullende weermeetwaarden leveren, waaronder temperatuur, gevoelstemperatuur en wind.
- De OpenAPI-beschrijving van `GET /api/weather` is aangepast naar de API-only bron.
- De ongebruikte vertaalkeys `weather.condition.clear` en `weather.condition.wind` zijn uit de standaard Nederlandse en Engelse catalogi verwijderd.
- Bij de eerstvolgende containerstart worden precies deze twee verouderde keys ook uit bestaande persistente locale-catalogi verwijderd; overige door de gebruiker aangepaste vertalingen blijven behouden.
- De oude mappingdocumentatie is vervangen door de actuele API-only werkwijze in `docs/03-dashboard/weather-mapping.md`.

De runtimewijziging moet nog via de productie-update worden uitgerold en op de Ubuntu-server worden getest. Na deployment toont het dashboard `Weer niet beschikbaar` / `Weather unavailable` totdat Homey of een andere integratie een geldige API-update verstuurt.
