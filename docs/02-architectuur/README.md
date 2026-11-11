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


## Technische taalconventie (11 november 2026)

De gebruiker heeft als harde eis vastgesteld dat alle technische artefacten Engelstalig zijn:
- JSON-propertynamen, waarden, categorieën en identifiers zijn Engels.
- Source code, variabelen, types, functienamen, comments en API-contractvelden zijn Engels.
- Technische documentatie en codevoorbeelden zijn Engels.
- User-facing dashboardteksten mogen Nederlands blijven.
- Letterlijke externe/providerwaarden in mappings mogen in de oorspronkelijke taal staan, omdat ze exact de bronwaarde moeten herkennen.

Deze conventie geldt voor alle toekomstige projectbestanden en uitbreidingen, niet alleen voor de weerconfiguratie.

## Weerbronmapping

Weergegevens worden via een JSON-profiel aan vaste interne weercategorieën gekoppeld. De backend doet de providervertaling; de frontend kent uitsluitend de canonieke categorieën. Onbekende waarden blijven expliciet `unknown`. De toekomstige instellingen-GUI moet hetzelfde JSON-profiel beheren en wordt niet automatisch onderdeel van de fase-4 externe event-API. Zie [Weather condition mapping](../03-dashboard/weather-mapping.md).

## Interface localization and language selection (11 November 2026)

The dashboard uses i18n and separates interface translations from Homey-provided user content.

### Language resolution

1. Read the configured language from Homey through a supported, documented interface. The exact API field/property must be technically verified.
2. In automatic mode, use the Homey locale when it is supported by the dashboard translation resources.
3. If Homey language detection fails or the locale is unsupported, use English (`en`) as the fallback. The UI must not claim that a locale was detected when it was not.
4. A manual language selection in **Settings → System → Language** overrides Homey.
5. Persist the manual override in dashboard configuration so it survives container restarts.
6. The user can select **Automatic** to clear the override and follow Homey language again.

The settings menu must visibly distinguish **Automatic (Homey: <language>)** from a manually selected language.

### Translation architecture

- Use `i18next` with `react-i18next` for React interface translations, after dependency/build validation.
- Translation resources are organized by locale, with stable English translation keys and JSON property names.
- English (`en`) is the canonical source locale and universal fallback; Dutch (`nl-NL`) is supported alongside it from the start.
- Every interface string/key must be provided in both English and Dutch together. Translation-key parity is validated so missing translations are caught before release.
- Additional locales are added as complete translation resources; component code must not contain locale-specific interface strings.
- Date, time, number, and unit formatting follows the effective locale where appropriate.
- Homey device names, zone names, Flow names, Logic variable names, and other user-defined values are displayed unchanged and are not passed through translation dictionaries.

This localization architecture is independent of provider mappings such as weather condition normalization. Technical identifiers, APIs, JSON schemas, and code remain English.
