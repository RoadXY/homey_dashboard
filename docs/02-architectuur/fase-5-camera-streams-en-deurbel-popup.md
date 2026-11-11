# Fase 5 – Live camerastreams en deurbel-popup

**Status:** onderzoeksresultaat en architectuurvoorbereiding; geen implementatie.
**Datum:** 11 november 2026
**Branch:** phase_1_foundation

## Doel

Bij een deurbel-event toont het dashboard op de tablet automatisch een popup met live videobeeld. Optioneel staan er acties bij, zoals een knop om een deur te ontgrendelen. Dit is fase 5 en valt buiten de huidige implementatiescope.

## Onderzoeksresultaten Homey

### Homey ondersteunt live camera-video

De officiële Homey Apps SDK documenteert camera-video-ondersteuning:
- Een Homey-app kan aangeven dat een device een videostream aanbiedt.
- De app registreert de stream bij het device via Device.setCameraVideo().
- Ondersteunde streamtypen omvatten WebRTC, RTSP, RTMP, HLS en DASH.
- Homey Pro (2023–2026) ondersteunt automatische omzetting/proxying naar WebRTC vanaf Homey Pro firmware v12.12.0. Hierdoor kunnen camera's ook via de Homey Web App en buiten het lokale netwerk worden bekeken.
- Voor de genoemde Web App-ondersteuning vermeldt Homey Mobile App v9.7.1 als minimumversie; voor onze eigen tabletwebsite is dit geen directe afhankelijkheid.

Bronnen:
- Homey Apps SDK – Videos: https://apps.developer.homey.app/advanced/videos
- Homey ManagerVideos API: https://apps-sdk-v3.developer.homey.app/ManagerVideos.html
- Homey nieuws – Camera streaming in Homey Web App: https://homey.app/en-at/news/camera-streaming-now-available-in-the-homey-web-app/

### Belangrijke beperking / nog onbewezen integratie

De Apps SDK-documentatie beschrijft hoe een Homey-app een camera-stream registreert en beschikbaar stelt aan Homey-frontends. Dit bewijst niet dat een externe Node.js-client via de bestaande Homey Web API of homey-api een reeds geregistreerde stream inclusief afspeel-/WebRTC-signaleringsgegevens kan ophalen.

De gedocumenteerde ManagerVideos-methoden (createVideo..., getVideo, unregisterVideo) horen bij de Homey Apps SDK-context (this.homey.videos). We mogen niet aannemen dat deze methoden ook als consument-API voor onze externe dashboardbackend beschikbaar zijn.

**Conclusie:** Homey kan cameravideo aan zijn eigen platform aanbieden en automatisch naar WebRTC omzetten, maar de ondersteunde externe consumptieroute voor onze eigen dashboardwebsite is nog niet bewezen. Dit moet vóór implementatie met een concrete camera, Homey-firmware en API-client worden gevalideerd. Gebruik geen ongedocumenteerde interne Homey-endpoints als productiebasis.

## Voorgestelde gebruikerservaring

1. De deurbel detecteert een druk en Homey activeert een event/Flow.
2. Homey meldt dit aan de dashboardbackend via de beveiligde fase-4 event-integratie of een aparte, versiebeheerde eventroute.
3. De backend valideert afzender, eventtype, apparaatidentiteit en payload.
4. De backend verkrijgt op een ondersteunde manier een tijdelijke stream-/sessieconfiguratie.
5. De tablet ontvangt via SSE een event dat een deurbel-popup moet openen.
6. De browser opent een popup en speelt de stream af met een browsergeschikte speler, waarschijnlijk WebRTC.
7. De popup sluit na gebruikersactie of configureerbare timeout; bij verbindingsverlies wordt een duidelijke status getoond.
8. Optioneel kan een afzonderlijke, geautoriseerde actieknop worden getoond, bijvoorbeeld deur ontgrendelen.

SSE wordt uitsluitend gebruikt om het popup-/UI-event naar de browser te sturen. De videomedia zelf loopt via een geschikte media-transportverbinding, bij voorkeur WebRTC, niet als SSE-berichten.

## Mogelijke technische routes

### Route A – Homey levert stream via een ondersteunde externe API

- Homey blijft eigenaar van de camera-integratie en streamtoegang.
- Dashboardbackend verkrijgt via een officieel ondersteunde interface een tijdelijke streamreferentie en eventuele WebRTC-signaleringsgegevens.
- De browser speelt de stream af.
- Voordeel: Homey verzorgt compatibiliteit/proxying en mogelijk externe bereikbaarheid.
- Open punt: er is nog geen geverifieerde publieke consumer-API gevonden die dit voor een externe homey-api-client ondersteunt.

### Route B – Rechtstreeks streamen vanaf de camera

- De camera biedt zelf RTSP/HLS/WebRTC of een ander browsergeschikt formaat.
- Een media gateway of browsercomponent kan zo nodig RTSP/HLS naar WebRTC omzetten.
- Voordeel: niet afhankelijk van een niet-gedocumenteerde Homey stream-consumerinterface.
- Nadelen: extra netwerk-/authenticatiebeheer, camera-compatibiliteit en mogelijk een extra container/service. RTSP kan niet rechtstreeks door de meeste browsers worden afgespeeld.
- Homey kan parallel de deurbeltrigger en automatisering verzorgen.

### Route C – Eigen Homey-app als adapter

- Een eigen Homey-app kan via de Apps SDK een camera-stream registreren of een gebeurtenis via de Homey Web API aanbieden.
- De Homey Web API van een app kan eigen REST-routes en realtime-events exposen.
- Dit is bruikbaar als adapter voor events en mogelijk voor een door de app beheerde camera-integratie.
- Het is niet bewezen dat een eigen app zonder meer de videostream van een ander bestaand camera-device kan overnemen of doorgeven. Dat moet apart worden onderzocht.
- Bron: Homey Apps SDK – Web API: https://apps.developer.homey.app/advanced/web-api

## Deur openen – beveiligingsuitgangspunt

De videostream en de deuropenactie moeten twee afzonderlijke functies blijven.
- Een deur ontgrendelen is een beveiligingsgevoelige actie en mag nooit automatisch volgen uit alleen het deurbel-event of het openen van de popup.
- De gebruiker moet expliciet op een ontgrendelknop drukken.
- De actie vereist een afzonderlijke autorisatiecontrole, bevestigingsdialoog en auditlog.
- Toon de knop alleen als een passend slot/apparaat is geconfigureerd en de backend de actie als ondersteund heeft gevalideerd.
- Een stream die niet beschikbaar is, mag de bediening niet onbedoeld activeren.
- De deurstatus moet na de opdracht opnieuw uit Homey worden gelezen; een geaccepteerde opdracht is niet hetzelfde als bewezen ontgrendeling.

## Architectuurvoorwaarden die nu al gelden

- Fase 4 event-envelope en beveiligde Homey-naar-dashboard-ingang moeten uitbreidbaar zijn met een eventtype zoals doorbell.ring.
- Eventpayload bevat een stabiele Homey-device-ID, event-ID, tijdstip en optionele camera-/deurconfiguratiereferentie. Geen permanente camera-credentials of streamgeheimen in het event.
- Externe API-documentatie gebruikt OpenAPI 3.1; eventpayloads krijgen gedeelde JSON Schema's.
- De browser ontvangt alleen tijdelijke, minimaal noodzakelijke stream-sessiegegevens. Camera-credentials blijven server-side.
- De video-popup is een aparte UI-component; het bestaande dashboard blijft zichtbaar op de achtergrond.
- De media-verbinding is gescheiden van SSE en de gewone REST API.
- De backend en tablet blijven binnen de bestaande VLAN-/firewallbeveiliging; benodigde videopoorten/protocollen worden pas na keuze van de streamroute bepaald.

## Onderzoeks- en testplan voor fase 5

1. Inventariseer merk/model deurbel, Homey-integratie/app en Homey Pro firmwareversie.
2. Bevestig dat het camera-device in Homey een live stream toont in de Homey Web App.
3. Onderzoek de officiële Homey Web API en homey-api of een externe client een stream-/sessie kan verkrijgen; geen interne endpoints als oplossing accepteren.
4. Als dit niet officieel ondersteund is, test Route B met de native camera-stream en eventueel een media gateway.
5. Test de stream in Chromium/Fully Kiosk op de Samsung Galaxy Tab A SM-T515, inclusief autoplay-/geluidsbeperkingen en schermrotatie.
6. Test netwerkverkeer tussen camera, Homey, Docker-host en tablet over de VLAN-grenzen.
7. Test herverbinden, timeouts, meerdere deurbel-events, popup sluiten en sessie-expiratie.
8. Test ontgrendelen als afzonderlijke expliciete actie met bevestiging, autorisatie, audit en statusverificatie.
9. Leg pas na een geslaagde praktijktest de definitieve streamroute vast.

## Fase-indeling

- Fase 4: beveiligde event-ingang vanuit Homey en dashboardmeldingen/geluid/presentatie-events.
- Fase 5: live camerastreams, deurbel-popup, tijdelijke mediasessies en optionele expliciete deurbediening.


## UniFi Protect als eerste camera-adapter (onderzoek 11 november 2026)

De gebruiker heeft aangegeven dat de huidige camera-/deurbelomgeving UniFi is. De architectuur blijft fabrikant-onafhankelijk: **UniFi Protect wordt de eerste concrete adapter**, niet de basis van de generieke dashboard-popup.

### Wat de documentatie bevestigt

- Ubiquiti publiceert een officiële UniFi Protect API-documentatieportal.
- De portal documenteert WebSocket-updates, waaronder het ophalen van Protect-eventberichten.
- De camera-API documenteert het aanmaken en beheren van RTSPS-streams voor camera's.
- De API-documentatie beschrijft authenticatie met API-keys.
- De Home Assistant UniFi Protect-integratiedocumentatie bevestigt als aanvullende praktijkreferentie dat live camerafeeds via RTSPS worden aangeboden en dat deurbelringen als event met `event_type: ring` worden herkend.
- Diezelfde Home Assistant-documentatie maakt onderscheid tussen de publieke API-key-integratie en aanvullende lokale gebruikersauthenticatie. In de beschreven integratie vereisen bepaalde events, waaronder deurbelringen, een lokale gebruiker. Dit is een aandachtspunt om niet te verwarren met de officiële publieke API-capabilities: de exacte ondersteunde eventroute en permissies moeten rechtstreeks tegen de actuele UniFi Protect API worden gevalideerd.
- Home Assistant is uitsluitend een aanvullende referentie voor het gedrag van Protect; de dashboardcontainer krijgt geen runtime-afhankelijkheid van Home Assistant.

Bronnen:
- Ubiquiti officiële UniFi Protect API: https://developer.ui.com/protect
- Ubiquiti officiële poortenreferentie (pas netwerkvereisten bepalen nadat de streamroute gekozen is): https://help.ui.com/hc/en-us/articles/218506997-Required-Ports-Reference
- Home Assistant UniFi Protect-integratie (aanvullende implementatiereferentie, geen runtime-afhankelijkheid): https://www.home-assistant.io/integrations/unifiprotect

### Voorlopige voorkeursroute

1. De UniFi Protect-adapter ontvangt deurbel-events via de officieel ondersteunde Protect-event/WebSocket-interface, indien de benodigde ring-eventgegevens en autorisatie beschikbaar zijn.
2. De adapter koppelt het event aan een stabiele camera/device-ID en publiceert een generiek dashboard-event, bijvoorbeeld `doorbell.ring`.
3. De adapter vraagt via de officiële camera-API een RTSPS-stream aan of gebruikt een reeds actieve stream, afhankelijk van wat de API en camera ondersteunen.
4. Omdat een browser niet standaard RTSPS afspeelt, onderzoeken we een media-gateway die de stream omzet naar een browsergeschikt transport, bij voorkeur WebRTC. De gateway is alleen nodig als de tablet/browser de UniFi-stream niet rechtstreeks ondersteund kan afspelen.
5. De tablet krijgt via de bestaande SSE-laag alleen het signaal om de generieke popup te openen; de videomedia loopt apart van SSE.

### Nog te valideren vóór implementatie

- Welk UniFi Protect-consolemodel en welke Protect-softwareversie worden gebruikt.
- Exact deurbelmodel en of dit device in Protect livebeeld en ring-events aanbiedt.
- Of de officiële Protect API met een afzonderlijke, minimaal geprivilegieerde API-key zowel het benodigde ring-event als de stream lifecycle kan leveren.
- Of een ring-event via de gedocumenteerde WebSocket-interface binnenkomt zonder afhankelijk te zijn van Home Assistant of een ongedocumenteerde private API.
- Of RTSPS rechtstreeks door de gekozen browser-/tabletcombinatie kan worden gebruikt; anders welke media-gateway nodig is.
- Welke netwerkstromen tussen Protect-console, Docker-host en tablet noodzakelijk zijn. De gebruiker beheert VLAN- en firewallconfiguratie; concrete poorten/protocollen worden pas na de technische proef vastgelegd.

### Generiek ontwerp blijft leidend

De generieke dashboardlaag kent geen UniFi-specifieke eventvelden, API-authenticatie of stream-URL's. De UniFi-adapter vertaalt Protect-events naar het gedeelde eventcontract en levert tijdelijke streaminformatie via een interne backendinterface. Een toekomstige andere fabrikant krijgt een eigen adapter die hetzelfde contract implementeert. Camera-geheimen blijven server-side; tijdelijke streamtoegang wordt niet permanent in events of configuratiebestanden opgeslagen.

## Voorlopige conclusie

De gewenste ervaring is technisch aannemelijk. Homey Pro (2023) heeft platformondersteuning voor camerastreams en WebRTC-proxying vanaf firmware v12.12.0. De cruciale onzekerheid is of de bestaande Homey-camera-stream op een officieel ondersteunde manier door een externe dashboardbackend kan worden geconsumeerd. Dit blijft een expliciet fase-5-onderzoekspunt. Route A heeft de voorkeur als Homey hiervoor een gedocumenteerde consumer-API biedt; anders moet Route B worden geëvalueerd. Er is in deze fase geen code of Homey-configuratie gewijzigd.