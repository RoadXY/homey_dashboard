# Externe API – contract, documentatie en beheer

**Status:** architectuurbesluit goedgekeurd; API-contract en endpoints worden gefaseerd uitgewerkt.  
**Datum:** 11 november 2026  
**Branch:** `phase_1_foundation`

## Doel en uitgangspunt

De dashboardbackend biedt een gedocumenteerde integratie-API voor clients buiten de dashboardwebsite en buiten de container. Denk aan een toekomstige Homey-app, een andere interne applicatie of een beheer-/automatiseringsdienst.

De API is een expliciet ondersteund integratiecontract. Externe clients mogen niet afhankelijk worden van interne frontend-endpoints, interne datamodellen of de SSE-verbinding van de tablet.

## Voorgestelde standaard en tooling

- **OpenAPI 3.1** is het formele, machineleesbare API-contract.
- **JSON Schema** beschrijft request bodies, responses, configuratieobjecten en event-payloads. Waar mogelijk worden schema's hergebruikt zodat validatie en documentatie niet uit elkaar lopen.
- **Swagger UI** wordt aangeboden als interactieve documentatie waarmee ontwikkelaars endpoints kunnen bekijken en, in een beveiligde omgeving, uitproberen.
- **Fastify Swagger-integratie**: onderzoek en gebruik bij implementatie `@fastify/swagger` om OpenAPI uit de Fastify route-schema's te genereren, met `@fastify/swagger-ui` voor de interactieve UI.
- **Scalar** is een alternatief voor de documentatie-interface als dit later een betere ontwikkelaarservaring oplevert. Het vervangt OpenAPI niet; het is alleen een andere viewer.
- De OpenAPI-specificatie wordt ook als bestand beschikbaar gesteld, zodat externe tools en clients deze kunnen importeren en codegeneratie kunnen toepassen.

OpenAPI is dus de bron van waarheid voor het externe HTTP-contract. Swagger UI is de lees-/testinterface, niet het contract zelf.

## API-grenzen

Er worden drie logische communicatievlakken onderscheiden:

1. **Dashboard-web API (intern voor de webinterface)**  
   Gebruikt door de React-website voor dashboarddata, instellingen en gebruikersacties. Deze routes zijn niet automatisch een ondersteund extern integratiecontract.

2. **Externe integratie-API (publiek binnen het vertrouwde netwerk)**  
   Versiebeheerde API voor externe clients. Deze API krijgt eigen documentatie, authenticatie, autorisatie, validatie en compatibiliteitsbeleid. "Publiek" betekent hier beschikbaar voor geautoriseerde netwerkclients, niet zonder authenticatie open op internet.

3. **Realtime event-uitvoer en event-invoer**  
   - Backend → browser: bestaande SSE-route voor realtime updates van de dashboardwebsite.
   - Externe systemen/Homey → backend: toekomstige beveiligde event-ingang voor gebeurtenissen zoals dashboardmeldingen en geluid-/presentatieopdrachten.
   - Externe clients kunnen later eventueel een eigen event-stream krijgen; dit wordt pas toegevoegd als een concrete use-case dit vraagt.

## Voorlopige externe API-domeinen

Onderstaande lijst is een functionele catalogus, geen claim dat deze endpoints al bestaan. Exacte paden, methoden, payloads en permissies worden per fase ontworpen en in OpenAPI vastgelegd.

| Domein | Richting | Beoogde functies | Fase |
|---|---|---|---|
| Health/status | Client → Dashboard | Applicatieversie, gezondheid en beperkte verbindingsstatus | 1 / nader af te bakenen |
| Dashboardmeldingen | Client → Dashboard | Melding publiceren, bijwerken en beëindigen | 4 |
| Geluid/presentatie | Client → Dashboard | Geluidsopdracht of visuele attentie aanvragen | 4 |
| Dashboardconfiguratie | Geautoriseerde beheerclient → Dashboard | Alleen expliciet ondersteunde configuratie beheren | nader te bepalen |
| Homey-acties | Dashboard → Homey | Geselecteerde Flow starten of apparaatactie uitvoeren | 2; niet automatisch extern beschikbaar |
| Realtime updates | Dashboard → browser/client | Status- en eventupdates | SSE voor website bestaat; externe ondersteuning nader te bepalen |

Externe clients krijgen niet automatisch algemene toegang tot alle Homey-apparaten, Logic-variabelen, Flows of dashboardconfiguratie. Elke API-operatie wordt bewust ontworpen en aan een permissie gekoppeld.

## Dashboardmeldingen via externe API – eerdere functionele richting (13 november 2026)

Naast meldingen die Homey Dashboard zelf op basis van Homey-data en Blockly-voorwaarden evalueert, moet een geautoriseerde externe client later via de externe API een dashboardmelding kunnen **publiceren en beëindigen/verwijderen**. Bijwerken van een bestaande gepubliceerde melding wordt als gewenste lifecycle-operatie meegenomen.

- Dit is toekomstige functionaliteit en wordt niet als bestaand endpoint beschouwd. De implementatie en het exacte contract vallen onder de reeds geplande fase 4.
- De externe API is een invoerkanaal: Homey levert data/gebeurtenissen aan, maar Homey Dashboard blijft verantwoordelijk voor wat en hoe op het scherm wordt weergegeven.
- Het API-contract moet een stabiele melding-ID ondersteunen, zodat een client een eerder gepubliceerde melding eenduidig kan bijwerken of beëindigen. Herhaalde requests moeten veilig/idempotent kunnen worden afgehandeld.
- De API-payload en autorisatie moeten per client worden gevalideerd. De Homey API-key wordt nooit als extern API-credential gebruikt.
- De drie dashboardniveaus blijven **kritiek**, **waarschuwing** en **info**, met de bestaande niveaugebonden styling en sortering uit `docs/03-dashboard/README.md`. Het API-contract moet deze niveaus op dezelfde manier kunnen aanduiden; de exacte veldnamen en payload worden later vastgelegd.
- De externe meldingslifecycle staat los van de Blockly-voorwaardenengine voor dynamische meldingsregels. De twee soorten meldingen komen samen in de dashboardpresentatielaag, die de afgesproken vormgeving en ordening toepast.

De openstaande contractdetails uit deze eerdere notitie zijn inmiddels vastgesteld in [Meldingen-API – definitief ontwerp](meldingen-api.md). Dat document vervangt de voorlopige punten hieronder waar ze afwijken.

## Definitieve uitwerking meldingen-API (14 november 2026)\n\nDe endpointset, tokenregels, levensduur, opslaggrens, foutcodes, realtime-uitvoer en testcriteria zijn vastgesteld in [Meldingen-API – definitief ontwerp](meldingen-api.md). De endpoints zijn nog niet geïmplementeerd en worden pas aan OpenAPI toegevoegd wanneer de backendroutes bestaan.\n\n## Versies en compatibiliteit

- Externe HTTP-routes gebruiken een expliciete versieprefix, bij voorkeur `/api/v1`.
- Niet-brekende uitbreidingen mogen binnen dezelfde major-versie worden toegevoegd.
- Een breaking change vereist een nieuwe major API-versie en migratieperiode waar redelijkerwijs mogelijk.
- De OpenAPI-specificatie wordt samen met de applicatieversie beheerd en in Git bijgehouden.
- De documentatie vermeldt per endpoint: status (planned/implemented/deprecated), fase, authenticatie, vereiste permissie, request/response-schema, foutcodes en voorbeelden.

## Beveiliging

- Geen anonieme muterende endpoints.
- Externe integratieclients authenticeren met afzonderlijke credentials; de Homey API-key wordt nooit hergebruikt of aan clients verstrekt.
- Credentials kunnen per client worden ingetrokken en krijgen alleen de noodzakelijke scopes/permissies.
- Alle input wordt server-side gevalideerd tegen schema's.
- Muterende endpoints krijgen passende rate limiting, logging en waar nodig auditregistratie.
- Voor acties die dubbel uitvoeren schadelijk kunnen zijn, wordt idempotency-ondersteuning overwogen/vereist.
- Geheimen worden niet in Git, OpenAPI-voorbeelden of logs opgenomen.
- Swagger UI en interactieve "Try it out"-functionaliteit worden standaard alleen binnen het vertrouwde LAN/VPN of achter beheer-authenticatie beschikbaar gemaakt. In productie kan de UI desgewenst worden uitgeschakeld, terwijl het OpenAPI-bestand beschikbaar blijft voor geautoriseerde ontwikkelaars.
- HTTPS/TLS wordt gebruikt zodra de API buiten een volledig vertrouwd lokaal segment bereikbaar is; netwerksegmentatie en firewallregels blijven aanvullende beveiligingslagen, geen vervanging voor authenticatie.

## Eventcontract voor fase 4

Voor Homey-naar-dashboard-events wordt een expliciet event-envelope ontworpen. Dit bevat minimaal:
- unieke event-ID;
- eventtype en schema-/versieversie;
- tijdstip;
- afzender/clientidentiteit;
- payload volgens het schema van het eventtype;
- optionele correlatie-ID om een opdracht en resultaat aan elkaar te koppelen.

De backend valideert de afzender, eventsoort en payload voordat een event wordt verwerkt. Herhaalde levering moet veilig afgehandeld kunnen worden. Een event dat een melding publiceert, moet ook een eenduidige manier bieden om die melding later bij te werken of te beëindigen. De tablet ontvangt de resulterende presentatie-update via de bestaande realtime-laag (SSE).

De exacte push-route, authenticatiemethode, eventtypen, bewaartermijn en delivery-garanties worden in fase 4 ontworpen. Er wordt nu nog geen endpoint of Homey-appintegratie geclaimd.

## Huidige status versus toekomst

- Bestaand: dashboardwebsite gebruikt backend-API-routes en `GET /api/events` voor SSE.
- Bestaand: backend ontvangt Homey realtime device- en Logic-updates via de Homey Socket.IO-client.
- Nog niet bestaand: een stabiele, versiebeheerde externe integratie-API met OpenAPI-contract en Swagger UI.
- Toekomstig (fase 2): dynamische gebruikersconfiguratie en uitvoering van Quick Action-apparaatacties en Homey Flows.
- Toekomstig (fase 4): beveiligde event-ingang voor Homey-/externe systemen om dashboardmeldingen, geluiden en andere presentatieacties aan te sturen.

## Implementatievolgorde

1. Inventariseer bestaande Fastify-routes en label deze als intern, extern ondersteund of uitsluitend operationeel.
2. Definieer de eerste externe use-cases en permissies; expose niet zomaar alle interne routes.
3. Leg request-, response- en foutstructuren vast met gedeelde JSON Schema's.
4. Voeg OpenAPI 3.1-generatie toe aan Fastify en controleer dat de gegenereerde specificatie compleet en valide is.
5. Voeg Swagger UI toe met productiebeveiliging en publiceer de OpenAPI-specificatie als downloadbaar bestand.
6. Voeg contracttests toe die implementatie en OpenAPI-specificatie op elkaar controleren.
7. Ontwerp de fase-4 event-ingang als afzonderlijk API-domein met eigen authenticatie en event-schema's.

## Besluit

De gebruiker heeft ingestemd met een duidelijke, afzonderlijke documentatie van alle API's die buiten de dashboardwebsite/container gebruikt mogen worden. OpenAPI 3.1 wordt het formele contract; Swagger UI wordt de interactieve documentatie-interface. De Fastify OpenAPI-integratie wordt bij implementatie technisch gevalideerd. De externe API wordt gescheiden gehouden van interne website-endpoints en wordt beveiligd, versiebeheerd en per fase uitgebreid.
