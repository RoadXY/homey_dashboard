# Technisch stackvoorstel – Homey Dashboard

**Status: technische stack goedgekeurd op 11 november 2026**  
**Datum: 11 november 2026**  
**Branch: phase_1_foundation**

## Doel

Een onderhoudbare, zelfstandige Docker-applicatie op de Ubuntu-server bouwen. De Samsung Galaxy Tab A toont uitsluitend de webinterface via Fully Kiosk Browser. De applicatie haalt gegevens op bij Homey Pro 2023 en voert alleen expliciet ingestelde gebruikersacties uit.

## Voorgestelde stack

| Onderdeel | Voorstel | Reden |
|---|---|---|
| Programmeertaal | TypeScript | Eén typeveilige taal voor frontend en backend |
| Frontend | React + Vite | Geschikt voor een responsive, componentgebaseerd dashboard; snelle ontwikkelcyclus |
| Backend | Node.js + Fastify | Lichtgewicht HTTP-server voor dashboard-API, instellingen en Homey-integratie |
| Homey-koppeling | Officiële homey-api Node.js-client, lokale API-key | Homey Pro 2023 ondersteunt lokale API-keys; de client biedt lokale verbinding en device-/Flow-functionaliteit |
| Frontend-updates | Server-Sent Events (SSE) als eerste kandidaat | Backend kan actuele statuswijzigingen naar de browser sturen; browser gebruikt REST voor acties |
| Configuratie | JSON-bestanden op een persistent Docker-volume | Leesbaar, eenvoudig te back-uppen en buiten de image te bewaren |
| Container | Multi-stage Docker-build, Node.js runtime op een Debian-slim basisimage | Kleine productie-image zonder buildtooling; brede compatibiliteit |
| Testen | Vitest en API-/integratietests | Testbare logica en regressiecontrole |

## Voorgestelde applicatieopbouw

Eén repository en één productiecontainer met twee logisch gescheiden delen:

1. **Frontend** – React-applicatie die door Vite wordt gebouwd naar statische bestanden.
2. **Backend** – Fastify-server die de frontend-bestanden serveert en de interne REST- en SSE-endpoints aanbiedt.
3. **Homey-adapter** – afzonderlijke backendmodule die authenticatie, verbinding, uitlezen van apparaten/capabilities en het starten van toegestane Flows verzorgt.
4. **Configuratielaag** – leest en valideert JSON-configuratie uit een persistent volume.
5. **Status/cache** – bewaart de laatst bekende waarden zodat het dashboard bij tijdelijk verlies van Homey niet leeg wordt.

De frontend krijgt nooit de Homey API-key. Alle Homey-verzoeken lopen via de backend.

## Voorgestelde communicatie

- Tablet/browser → dashboardcontainer: HTTP(S) naar de door de beheerder gekozen dashboardpoort.
- Frontend → backend: interne REST-endpoints voor configuratie en acties; SSE voor statusupdates.
- Backend → Homey Pro 2023: lokale Homey Web API via de officiële Node.js-client en een API-key.
- De exacte Homey-URL, bereikbaarheid, authenticatie en benodigde poorten worden op het daadwerkelijke netwerk getest. Er wordt geen poortnummer verondersteld of vooraf vastgelegd.
- De gebruiker beheert de VLAN-firewall en staat alleen de benodigde standaard Homey-communicatie toe.

## Docker- en opslagprincipes

- De productie-image bevat alleen runtimebestanden en gebouwde frontend-assets.
- De container draait bij voorkeur als niet-rootgebruiker.
- Configuratie en blijvende status staan in een gemount volume, niet in de image-laag.
- Secrets, waaronder de Homey API-key, worden via een lokaal env-bestand of Docker secrets aangeleverd en nooit in Git opgenomen.
- Een voorbeeld-env-bestand bevat uitsluitend namen en voorbeeldwaarden, nooit echte sleutels.
- Een health endpoint wordt voorzien voor container- en applicatiestatus.
- Logging gaat naar stdout/stderr zodat Docker logging kan verzamelen.
- De image wordt reproduceerbaar gebouwd met vastgelegde dependencyversies en lockfile.

## Eerste functionele scope (fase 1A)

- Klok en datum.
- Weerkaart.
- Vier temperatuurtegels: Woonkamer, Keuken, Sem en Bram.
- Homey- en dashboardserverstatus.
- Acht Quick Actions, uitgevoerd via Homey.
- Geen meldingenpaneel in fase 1A.

## Technische verificaties vóór definitieve implementatie

1. Bevestigen welke versie en API-mogelijkheden van homey-api geschikt zijn voor Homey Pro 2023.
2. Lokale verbinding vanuit de Docker-container over de VLAN-grens testen.
3. Benodigde Homey API-key permissies minimaal houden; alleen benodigde lees- en actiepermissies aanvragen.
4. Realtime device-updates en de reconnect-/offline-strategie testen.
5. Bevestigen dat de gewenste Flow-acties via de lokale API kunnen worden gestart.
6. Verversingsfrequenties afstemmen op API-gedrag en Homey-belasting.

## Nog niet besloten

- Technische validatie van React/Vite, Fastify, SSE en de Homey-koppeling in de beoogde runtime.
- Exacte Node.js-versie en dependencyversies.
- Definitieve dashboardpoort en eventuele reverse-proxy/HTTPS-opzet.
- Definitieve mappenstructuur en JSON-schema's.
- Exacte persistentie-indeling voor configuratie en laatst bekende waarden.
- Exacte Homey API-key permissies.
- Definitieve health-check-, backup- en updateprocedure.

## Bronnen

- Homey Support – [Create and use API Keys on Homey Pro](https://support.homey.app/hc/en-us/articles/8178797067292-Create-and-use-API-Keys-on-Homey-Pro)
- Homey Web API – [Documentation](https://api.developer.homey.app/)
- Homey Node.js API – [HomeyAPI reference](https://athombv.github.io/node-homey-api/HomeyAPI.html)

## Voortgang

Op 11 november 2026 heeft de gebruiker de voorgestelde technische stack goedgekeurd: TypeScript, React + Vite, Node.js + Fastify, de officiële homey-api-client, SSE als kandidaat voor statusupdates, JSON-configuratie op een persistent volume en een multi-stage Docker-build. De goedkeuring legt de gekozen richting vast; versies, Homey-permissies, netwerkdetails en operationele instellingen blijven afhankelijk van technische validatie.
