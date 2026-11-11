# Architectuur

## Hoofdcomponenten
- Homey Pro 2023: apparaten, sensoren, flows, moods en automatiseringen.
- Dashboardapplicatie: zelfstandige webapp voor presentatie en beperkte bediening.
- Docker op Ubuntu: host en runtime voor de dashboardapplicatie.
- Samsung Galaxy Tab A SM-T515: scherm in landscape.
- Fully Kiosk Browser: toont de dashboardwebsite; tablet bevat geen eigen dashboardlogica.

## Koppelingsprincipes
- Lokale Homey-verbinding heeft de voorkeur.
- API-key wordt gebruikt voor lokale authenticatie; geheimen horen niet in Git.
- Read-only apparaatontdekking tijdens configuratie; bediening alleen na expliciete gebruikersactie.
- Ondersteun directe apparaatbediening en Homey Flows.
- Toon bij verbindingsverlies laatst bekende waarden en een offline-indicator.

## Verversing
Doel voor belangrijke gegevens is 5 seconden, alleen als de Homey API dit ondersteunt en de belasting acceptabel blijft. Minder belangrijke gegevens krijgen een lager update-tempo. Dit moet technisch worden gevalideerd.

## Technisch stackvoorstel
De technische stack is op 11 november 2026 goedgekeurd en vastgelegd in [Technisch stackvoorstel](technisch-stackvoorstel.md): TypeScript, React + Vite, Node.js + Fastify, de officiële homey-api-client, SSE als kandidaat voor statusupdates, JSON-configuratie op een persistent volume en een multi-stage Docker-build. Concrete versies, Homey-permissies, netwerkdetails en operationele instellingen worden tijdens technische validatie vastgesteld.

## Nog te ontwerpen
Netwerkdiagram, definitieve API-keuze en SDK-versie, servicegrenzen, persistentie/cache, logging, health checks, backup/restore, secretsbeheer en foutafhandeling.

## Tweerichtingscommunicatie en API-grenzen (11 november 2026)

De gebruiker heeft bevestigd dat de applicatie uiteindelijk tweerichtingscommunicatie met Homey ondersteunt, met gescheiden verantwoordelijkheden:
- Homey → dashboard: read-only uitlezen van apparaten, capabilities en Logic-variabelen.
- Dashboard → Homey: door de gebruiker configureerbare Quick Actions voor directe apparaatacties of het starten van geselecteerde Homey Flows (fase 2).
- Homey/externe systemen → dashboard: beveiligde events voor onder meer meldingen, geluiden en visuele presentatieacties (fase 4).

De bestaande read-only gegevens- en meldingenfunctionaliteit blijft read-only. Bediening wordt een afzonderlijke backendfunctie met eigen validatie en autorisatie. De gebruiker beheert dynamisch welke apparaten/Flows aan Quick Actions worden gekoppeld; er komt dus geen statische lijst die vooraf alle toegestane apparaten en Flows vastlegt. De backend valideert bij configuratie en uitvoering of de geselecteerde bron en actie nog bestaan en ondersteund worden.

De tablet communiceert met de backend via HTTP API-verzoeken voor acties en SSE voor updates. SSE is alleen server-naar-client en wordt niet gebruikt als inkomend commandokanaal.

## Externe integratie-API en OpenAPI

Er komt een afzonderlijk, versiebeheerd API-contract voor gebruik door clients buiten de dashboardwebsite/container. **OpenAPI 3.1** wordt het formele contract; **Swagger UI** wordt de interactieve documentatie- en testinterface. Fastify-integratie via `@fastify/swagger` en `@fastify/swagger-ui` wordt tijdens implementatie gevalideerd. Interne website-endpoints worden niet automatisch onderdeel van de externe API.

Zie [Externe API – contract, documentatie en beheer](externe-api-openapi.md) voor de API-grenzen, voorlopige domeinen, beveiliging, versiebeheer, fase-indeling en implementatievolgorde.

## Fase 5: camerastreams en deurbel-popup

De gewenste deurbel-popup met livevideo en optionele expliciete deuropenactie is opgenomen als fase 5. Uitgangspunt is dat de dashboardcontainer uitsluitend via Homey met camera en deurbel communiceert; er komt geen rechtstreekse koppeling met UniFi of andere camerafabrikanten. Homey Pro ondersteunt camerastreams en WebRTC-proxying vanaf firmware v12.12.0, maar de officiële route om een bestaande Homey-camera-stream vanuit onze eigen dashboardwebsite te consumeren is nog niet aangetoond. Een eigen Homey-app mag als mogelijke adapter worden onderzocht. Zie [Fase 5 – Live camerastreams en deurbel-popup](fase-5-camera-streams-en-deurbel-popup.md) voor de Homey-routes, open onderzoeksvragen, beveiliging en testplan. Er is geen fase-5-code of Homey-configuratie gewijzigd.
