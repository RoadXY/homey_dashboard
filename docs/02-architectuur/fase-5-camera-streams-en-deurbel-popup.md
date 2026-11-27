# Fase 5 – Live camerastreams en deurbel-popup

**Status:** onderzoeksresultaat en architectuurvoorbereiding. De Homey-route is op 27 november 2026 in de praktijk aangetoond, en er staat een diagnosepagina. De gebruikersfunctionaliteit (camera-tegels, deurbel-popup) is nog niet gebouwd.
**Datum:** 11 november 2026, bijgewerkt 27 november 2026
**Branch:** phase_1_foundation

## Doel en uitgangspunt

Bij een deurbel-event toont het dashboard op de tablet automatisch een popup met live videobeeld. Optioneel staat er een afzonderlijke actie bij, zoals een knop om een deur te ontgrendelen.

**Vast uitgangspunt van de gebruiker:** het dashboard haalt de deurbelmelding en camerastream via Homey. Er komt voor deze functie geen rechtstreekse koppeling vanuit de dashboardcontainer met UniFi of andere externe camerafabrikanten. De bestaande camera-integratie in Homey mag intern van een externe fabrikant afkomstig zijn; de dashboardarchitectuur praat uitsluitend met Homey en eventueel een eigen Homey-app.

Een eigen Homey-app mag worden onderzocht als adapter/brug wanneer de standaard Homey-integratie of Homey API niet voldoende functionaliteit aanbiedt. Ook dan blijft Homey de centrale integratiegrens.

## Wat de officiële Homey-documentatie bevestigt

### Camera-video in Homey

De officiële Homey Apps SDK documenteert camera-video-ondersteuning:
- Een Homey-app kan aangeven dat een device een videostream aanbiedt.
- De app registreert de stream bij het device via `Device.setCameraVideo()`.
- Ondersteunde streamtypen omvatten WebRTC, RTSP, RTMP, HLS en DASH.
- Homey Pro (2023–2026) ondersteunt automatische omzetting/proxying naar WebRTC vanaf Homey Pro firmware v12.12.0. Hierdoor kunnen camera's ook via de Homey Web App en buiten het lokale netwerk worden bekeken.
- Voor de genoemde Web App-ondersteuning vermeldt Homey Mobile App v9.7.1 als minimumversie; voor onze eigen tabletwebsite is dit geen directe afhankelijkheid.

Bronnen:
- Homey Apps SDK – Videos: https://apps.developer.homey.app/advanced/videos
- Homey ManagerVideos API: https://apps-sdk-v3.developer.homey.app/ManagerVideos.html
- Homey nieuws – Camera streaming in Homey Web App: https://homey.app/en-at/news/camera-streaming-now-available-in-the-homey-web-app/
- Homey Apps SDK – Web API: https://apps.developer.homey.app/advanced/web-api

### Wat nog niet is bewezen

De documentatie beschrijft hoe een Homey-app een stream aan een Homey-device kan koppelen en hoe Homey-frontends deze kunnen tonen. Dit bewijst op zichzelf niet:
- dat een externe Node.js-client via de bestaande `homey-api`-client de reeds in Homey beschikbare camerastream kan ophalen en afspelen;
- dat de standaard Homey Web API alle benodigde stream-/WebRTC-signaleringsgegevens voor een eigen website beschikbaar stelt;
- dat een eigen Homey-app de stream van een camera-device dat door een ándere Homey-app wordt beheerd zomaar kan uitlezen of doorgeven.

De gedocumenteerde ManagerVideos-methoden (`createVideo...`, `getVideo`, `unregisterVideo`) horen bij de Homey Apps SDK-context (`this.homey.videos`). We mogen niet aannemen dat deze methoden ook als consumer-API voor onze externe dashboardbackend beschikbaar zijn.

**Conclusie (11 november):** Homey ondersteunt camera-video in zijn eigen platform. De officieel ondersteunde route om die stream vanuit onze eigen dashboardwebsite te consumeren is nog niet vastgesteld. Dit is het centrale technische onderzoekspunt. Gebruik geen ongedocumenteerde interne Homey-endpoints als productiebasis.

> **Bijgewerkt 27 november 2026:** de bovenstaande open punten zijn onderzocht en grotendeels beantwoord. Zie de volgende sectie.

## Praktijkverificatie 27 november 2026

Getest tegen de echte Homey Pro (Early 2023, firmware 13.5.5) met een API-key met alleen leesrechten, via het `homey-api`-pakket (3.21.3) en de lokale Web API.

### Bevindingen

1. **Homey biedt een merkonafhankelijke consumer-API voor camera's.** De specificatie in `homey-api` bevat:
   - `ManagerImages` (**publiek**): `GET /api/manager/images/image`, en de beeldbytes op `GET /api/image/<id>`.
   - `ManagerVideos` (gemarkeerd als **`private`**): `getVideos`, `videoOffer(id, offer)`, `videoKeepAlive(id, streamId)` en `getVideoUrl(id)`. Alle operaties vragen alleen de scope `homey.device.readonly`. De client maakt ook private managers aan, dus `api.videos.videoOffer()` werkt in onze bestaande backendverbinding.
2. **Koppeling tussen device en media.** Elk device-object heeft `images[]` (met `imageObj.id` en `imageObj.url`) en `videos[]` (met `videoObj.id` en `videoObj.type`). Gevonden camera's:
   - Camera garage en Camera achtertuin (UniFi Protect-app): snapshot plus een RTSP-video.
   - Muur tablet (Fully Kiosk-app): alleen een snapshot.
   - `images` met `type: "media"` zijn albumhoezen van Chromecasts, geen camera's.
3. **Snapshots werken.** Een actuele JPEG van 2688×1520 (ongeveer 1 MB) in ongeveer 2 seconden. Let op: Homey levert `/api/image/<id>` ook **zonder token**; alleen de onvoorspelbare UUID beschermt het beeld.
4. **Live video werkt via WebRTC.** Homey Pro heeft een ingebouwde **go2rtc**-daemon. Een SDP-offer naar `videoOffer` levert `{ answerSdp, streamId }` op. Daarna loopt de media rechtstreeks van Homey naar de client, over **poort 8555** (UDP, met TCP als fallback). Gemeten resultaten:
   - de verbinding stond binnen ongeveer 2,8 seconden;
   - garage: alleen video binnengekomen;
   - achtertuin: H.265-video plus Opus-audio, ongeveer 3,4 Mbit/s;
   - een keep-alive elke 5 seconden werkt.
5. **Geen transcodering.** go2rtc pakt de stream alleen opnieuw in. Beide UniFi-camera's leveren **alleen H.265**.
   - Een offer zonder H.265 geeft `codecs not matched: video:H265 => video:VP8, …` (HTTP 500).
   - Een offer met alleen H.264 kan wel een verbinding opleveren, maar er komen dan geen videopakketten binnen.
   - De browser van de tablet moet dus H.265 via WebRTC ondersteunen, of de camera's moeten in UniFi Protect op H.264 ("Standard" in plaats van "Enhanced" encoding).
6. **`getVideoUrl` valt af.** Het geeft de ruwe RTSP-URL van de UniFi NVR terug, dus een directe fabrikantkoppeling. Dat is in strijd met het vaste uitgangspunt en wordt niet gebruikt.

### Beoordeling van de private API

`ManagerVideos` zit in Athoms eigen client, heeft nette scopes en wordt door de Homey Web App gebruikt, maar is niet publiek gedocumenteerd. Het is dus geen intern endpoint dat we hebben "gevonden", maar ook geen gegarandeerd contract.

Advies (nog niet als besluit vastgelegd): gebruik deze route, met de volgende maatregelen:
- alle aanroepen zitten in één module (`src/server/cameras.ts`);
- snapshots via de publieke `ManagerImages` blijven als fallback beschikbaar;
- na Homey-firmware-updates draaien we de diagnosepagina opnieuw.

### Gerealiseerd als voorbereiding

- `src/server/cameras.ts` met endpoints onder `/api/troubleshooting/`, allemaal beveiligd met de instellingen-PIN:
  - cameralijst;
  - snapshot-proxy;
  - WebRTC-offer;
  - keep-alive.
- Diagnosepagina `/troubleshooting/camera/`: codec-detectie, een live cameratest en een kopieerbaar rapport. Zie [Troubleshooting pages and Homey camera access](../10-ontwikkelaarshandleiding/troubleshooting-pages.md) en de [gebruikershandleiding](../09-gebruikershandleiding/troubleshooting.md).
- End-to-end geverifieerd met een WebRTC-testclient via de backend. Nog niet geverifieerd: afspelen in een echte browser en op de tablet.

## Voorgestelde gebruikerservaring

1. Een deurbel-event ontstaat in Homey.
2. Homey of een eigen Homey-app-adapter geeft een beveiligd, generiek event door aan de dashboardbackend.
3. De backend valideert afzender, eventtype, apparaatidentiteit en payload.
4. De backend verkrijgt via een officieel ondersteunde Homey-route tijdelijke stream-/sessiegegevens.
5. De tablet ontvangt via de bestaande SSE-laag het signaal om de deurbel-popup te openen.
6. De browser speelt de door Homey beschikbaar gestelde stream af, bij voorkeur via WebRTC als dat de ondersteunde Homey-route is.
7. De popup sluit na gebruikersactie of configureerbare timeout; bij verbindingsverlies wordt een duidelijke status getoond.
8. Optioneel kan een afzonderlijke, geautoriseerde actieknop worden getoond, bijvoorbeeld deur ontgrendelen.

SSE wordt uitsluitend gebruikt om het popup-/UI-event naar de browser te sturen. De videomedia zelf loopt via een geschikte media-transportverbinding en niet als SSE-berichten.

## Te onderzoeken Homey-routes

### Route A – Bestaande Homey-camera-integratie en officiële Homey-consumptieroute

- De bestaande Homey-camera-integratie blijft verantwoordelijk voor het camera-device en de stream.
- Dashboardbackend gebruikt uitsluitend een officieel ondersteunde Homey-interface om de stream of een tijdelijke afspeelsessie te verkrijgen.
- Homey blijft verantwoordelijk voor camera-integratie en eventuele omzetting/proxying.
- ~~Open punt: verifiëren of de bestaande Homey Web API / `homey-api` consumer-client deze stream- en sessiegegevens officieel beschikbaar stelt.~~ **Aangetoond (27 november 2026):** via `ManagerVideos.videoOffer` (private) en `ManagerImages` (publiek). Dit is de aanbevolen route.

### Route B – Eigen Homey-app als adapter

- Onderzoek een eigen Homey-app die het deurbel-event ontvangt of via een ondersteunde Homey-interface observeert en dit via de Homey Web API of een beveiligd eventcontract aan de dashboardbackend doorgeeft.
- Onderzoek afzonderlijk of deze app de camerastream kan aanbieden aan Homey en of zij toegang kan krijgen tot een camera-stream die door een andere Homey-app/device-driver wordt beheerd.
- De Apps SDK biedt camera-registratie via `Device.setCameraVideo()` en een Web API voor eigen routes/events.
- Het is niet bewezen dat een eigen app zonder meer de videostream van een bestaand device van een andere app kan overnemen. Als dit niet via ondersteunde Homey SDK-mogelijkheden kan, moet de app-integratiegrens opnieuw worden onderzocht; geen rechtstreekse fabrikant-API als stilzwijgende uitweg introduceren.
- **Stand 27 november 2026:** voor de camerastream zelf is route B niet nodig, want route A werkt. Een eigen Homey-app kan nog wel nuttig zijn voor het deurbel-event (fase 4-event-ingang).

### Route C – Homey Web App als referentie voor streamgedrag

- Gebruik de Homey Web App om te bevestigen dat Homey het camerabeeld voor het gekozen device daadwerkelijk kan tonen.
- Dit is een functionele referentie/test, geen beoogde afhankelijkheid of ingebedde Homey Web App in het dashboard.
- De tablet blijft uitsluitend onze eigen dashboardwebsite tonen.

## Deur openen – beveiligingsuitgangspunt

De videostream en de deuropenactie moeten twee afzonderlijke functies blijven.
- Een deur ontgrendelen mag nooit automatisch volgen uit alleen het deurbel-event of het openen van de popup.
- De gebruiker moet expliciet op een ontgrendelknop drukken.
- De actie vereist een afzonderlijke autorisatiecontrole, bevestigingsdialoog en auditlog.
- Toon de knop alleen als een passend slot/apparaat in Homey is geconfigureerd en de backend de actie als ondersteund heeft gevalideerd.
- Een stream die niet beschikbaar is, mag de bediening niet onbedoeld activeren.
- De deurstatus moet na de opdracht opnieuw uit Homey worden gelezen; een geaccepteerde opdracht is niet hetzelfde als bewezen ontgrendeling.

## Architectuurvoorwaarden

- Homey blijft de enige externe camera-/deurbelintegratiegrens voor het dashboard.
- Geen directe UniFi-, ONVIF-, RTSP-camera- of andere fabrikantkoppeling vanuit de dashboardcontainer als onderdeel van deze fase.
- Fase 4 event-envelope en beveiligde Homey-naar-dashboard-ingang moeten uitbreidbaar zijn met een generiek eventtype zoals `doorbell.ring`.
- Eventpayload bevat een stabiele Homey-device-ID, event-ID, tijdstip en optionele Homey-camera-/deurconfiguratiereferentie. Geen permanente credentials of streamgeheimen in het event.
- De browser ontvangt alleen tijdelijke, minimaal noodzakelijke stream-sessiegegevens. Homey- en camera-geheimen blijven server-side.
- De video-popup is een aparte UI-component; het bestaande dashboard blijft zichtbaar op de achtergrond.
- De media-verbinding is gescheiden van SSE en de gewone REST API.
- Netwerk- en firewallvereisten: de tablet moet Homey (`10.7.5.23`) bereiken op **poort 8555**, bij voorkeur UDP, met TCP als fallback. Dit is het WebRTC-mediapad van go2rtc. De dashboardbackend heeft alleen de bestaande HTTP-toegang tot Homey nodig. De gebruiker beheert VLAN- en firewallconfiguratie.
- Homey-afbeeldings-URL's (`/api/image/<id>`) worden nooit aan de browser gegeven, omdat Homey ze zonder authenticatie uitlevert. De backend stuurt ze door.

## Onderzoeks- en testplan voor fase 5

1. Bevestig dat het betreffende camera-device in Homey een live stream toont in de Homey Web App.
2. ✅ Noteer Homey Pro-firmwareversie en de gebruikte Homey-camera-integratie/app: firmware 13.5.5, UniFi Protect-app (`com.ubnt.unifiprotect`), streamtype RTSP, codec H.265.
3. ✅ Onderzoek de officiële Homey Web API en `homey-api` of een externe client een stream/sessie kan verkrijgen: ja, via `ManagerVideos.videoOffer` (zie praktijkverificatie).
4. Onderzoek of een eigen Homey-app de benodigde deurbel-events kan doorgeven. Toegang tot de stream via een eigen app is niet meer nodig.
5. Valideer dat de stream vanuit onze eigen website op Chromium/Fully Kiosk op de Samsung Galaxy Tab A SM-T515 kan worden afgespeeld, inclusief autoplay-/geluidsbeperkingen en schermrotatie. **Gebruik hiervoor `/troubleshooting/camera/`.** Kritiek punt: H.265-ondersteuning via WebRTC.
6. Test herverbinden, timeouts, meerdere deurbel-events, popup sluiten en sessie-expiratie.
7. Test ontgrendelen als afzonderlijke expliciete actie met bevestiging, autorisatie, audit en statusverificatie.
8. Leg pas na een geslaagde praktijktest de definitieve Homey-route vast.

## Fase-indeling

- Fase 4: beveiligde event-ingang vanuit Homey en dashboardmeldingen/geluid/presentatie-events.
- Fase 5: Homey-gebaseerde live camerastreams, deurbel-popup, tijdelijke mediasessies en optionele expliciete deurbediening.

## Voorlopige conclusie

De gewenste ervaring is technisch aannemelijk omdat Homey Pro (2023) platformondersteuning heeft voor camerastreams en WebRTC-proxying vanaf firmware v12.12.0. De cruciale onzekerheid is of de bestaande Homey-camera-stream op een officieel ondersteunde manier door een externe dashboardbackend kan worden geconsumeerd, eventueel via een eigen Homey-app als adapter. Dit blijft een expliciet fase-5-onderzoekspunt. Een directe integratie met UniFi of een andere camerafabrikant valt buiten de afgesproken scope. Er is in deze fase geen code of Homey-configuratie gewijzigd.

**Conclusie per 27 november 2026:** de cruciale onzekerheid is opgelost. De dashboardbackend kan camerabeeld van elk Homey-camera-device merkonafhankelijk ophalen:
- snapshots via `ManagerImages`;
- live video via WebRTC met `ManagerVideos`, zonder eigen Homey-app en zonder directe UniFi-koppeling.

Wat nu nog open is:
- of de tablet-browser H.265 via WebRTC afspeelt;
- netwerktoegang tot poort 8555;
- het afwegen van het risico dat `ManagerVideos` private is.

Op Homey is niets gewijzigd. De code beperkt zich tot de diagnose-endpoints en de diagnosepagina.
