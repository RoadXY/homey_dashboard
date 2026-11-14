# Meldingen-API – definitief ontwerp

**Status:** ontwerp goedgekeurd; implementatie gepland, endpoints bestaan nog niet.  
**Besluitdatum:** 14 november 2026  
**Branch:** `phase_1_foundation`  
**API-versie:** `v1`

## 1. Doel en scope

De meldingen-API laat geautoriseerde externe clients (waaronder een toekomstige Homey-app of Homey Flow) dashboardmeldingen aanmaken, opvragen, gedeeltelijk wijzigen en verwijderen.

De API is uitsluitend bedoeld voor meldingen die door externe API-clients worden beheerd. Bestaande dashboardmeldingen die uit Blockly-regels of standaardconfiguratie voortkomen, blijven volledig onder beheer van de bestaande dashboardinstellingen.

De API beheert de melding als presentatie-item. De externe client bepaalt wanneer een melding moet worden aangemaakt, aangepast of verwijderd. De dashboardbackend bepaalt opslag, validatie, vervaltijd en presentatie.

## 2. Vastgestelde gebruikersbesluiten

| Onderwerp | Besluit |
|---|---|
| Bearer-tokens | Alle bestaande en nieuwe geldige Bearer-tokens mogen de meldingen-API gebruiken. |
| Levensduur | Een melding mag optioneel een vervaltijd krijgen. Zonder vervaltijd blijft zij bestaan totdat zij expliciet wordt verwijderd. |
| Herkomstweergave | De herkomst is intern bekend, maar wordt niet zichtbaar gemaakt op het dashboard. |
| DELETE van niet-API-melding | HTTP 403 Forbidden. |
| Opslag | Een eigen persistent JSON-bestand, gescheiden van Blockly- en standaardmeldingen. |
| Dashboardweergave | API-meldingen worden samengevoegd met de bestaande dashboardmeldingen in de presentatielaag. |

## 3. Endpoints

Alle endpoints gebruiken de prefix `/api/v1` en vereisen `Authorization: Bearer <token>`.

| Methode | Endpoint | Doel | Succes |
|---|---|---|---|
| GET | `/api/v1/notifications` | Alle actieve API-meldingen opvragen | 200 |
| POST | `/api/v1/notifications` | Een API-melding aanmaken | 201 |
| PATCH | `/api/v1/notifications/{id}` | Een API-melding gedeeltelijk wijzigen | 200 |
| DELETE | `/api/v1/notifications/{id}` | Een API-melding verwijderen | 204 |

Er komt bewust geen algemene CRUD-route voor alle dashboardmeldingen. De API mag uitsluitend records beheren die in haar eigen opslagbestand staan.

### 3.1 POST – melding aanmaken

Verplichte velden:

- `title`: titel van de melding.
- `message`: berichttekst.
- `severity`: `critical`, `warning` of `info`.

Optioneel veld:

- `expiresAt`: ISO 8601 datum/tijd met tijdzone-offset. De waarde moet bij aanmaak in de toekomst liggen.

Voorbeeld:

```json
{
  "title": "Rookmelder",
  "message": "Er is rook gedetecteerd!",
  "severity": "critical",
  "expiresAt": "2026-11-14T12:30:00Z"
}
```

De server genereert altijd de UUID en tijdstempels. De client kan geen ID, herkomst of server-tijdstempels instellen.

De response bevat het opgeslagen meldingsobject. Het veld `source` wordt niet opgenomen. Intern wordt `source: "api"` opgeslagen; bestaande Blockly-configuraties worden intern als `blockly` herkend en applicatiegegenereerde meldingen als `system`.

### 3.2 GET – actieve meldingen opvragen

De collectie-response bevat uitsluitend API-meldingen waarvan geen vervaltijd is ingesteld of waarvan `expiresAt` nog niet is bereikt.

De response bevat per melding:

- `id`
- `title`
- `message`
- `severity`
- `createdAt`
- `updatedAt`
- `expiresAt` (alleen wanneer ingesteld)

De response bevat geen `source`, tokeninformatie, interne opslagvelden of Homey-brondata. De GET-collectie toont geen Blockly- of standaardmeldingen.

### 3.3 PATCH – melding gedeeltelijk wijzigen

PATCH wijzigt uitsluitend de meegegeven velden. Niet meegestuurde velden blijven ongewijzigd.

Wijzigbare velden:

- `title`
- `message`
- `severity`
- `expiresAt`

De ID, `createdAt` en interne herkomst zijn onveranderlijk.

- `expiresAt` met een toekomstige ISO 8601-datum stelt een vervaltijd in of wijzigt deze.
- `expiresAt: null` verwijdert de vervaltijd; de melding wordt permanent totdat zij wordt verwijderd.
- Een ingestelde vervaltijd moet in de toekomst liggen.
- Een PATCH op een onbekende of reeds verlopen/verwijderde melding geeft HTTP 404.

Een succesvolle PATCH geeft het bijgewerkte meldingsobject terug.

### 3.4 DELETE – melding verwijderen

DELETE verwijdert uitsluitend de melding met de opgegeven ID uit de API-opslag.

- Bestaande API-melding: HTTP 204.
- Bestaande melding die niet door de API wordt beheerd: HTTP 403.
- Onbekende of reeds verlopen/verwijderde ID: HTTP 404.

De API krijgt geen mogelijkheid om standaardmeldingen, Blockly-meldingen of hun configuratie te verwijderen of aan te passen.

## 4. Gegevensmodel en opslag

Opslagbestand:

`DATA_DIR/api-notifications.json`

De API-opslag is een zelfstandige collectie en wordt niet samengevoegd met `data/notifications.json` of `data/notifications.deleted.json`.

Intern record:

```json
{
  "id": "server-generated-uuid",
  "title": "Rookmelder",
  "message": "Er is rook gedetecteerd!",
  "severity": "critical",
  "createdAt": "2026-11-14T12:00:00.000Z",
  "updatedAt": "2026-11-14T12:00:00.000Z",
  "expiresAt": "2026-11-14T12:30:00.000Z"
}
```

`expiresAt` ontbreekt wanneer de melding permanent is. De API-opslag zelf vormt de eigendomsgrens: alleen records uit dit bestand zijn via deze endpoints wijzigbaar.

Schrijfacties worden geserialiseerd om gelijktijdige wijzigingen niet over elkaar heen te laten schrijven. Opslag gebeurt via een tijdelijk bestand en een atomische rename. Het bestand wordt met beperkte bestandsrechten opgeslagen. De bestaande Docker-volume/persistente `DATA_DIR` blijft verantwoordelijk voor behoud bij containerrestarts.

Verlopen meldingen zijn logisch inactief: ze worden niet meer door GET of de dashboardpresentatie teruggegeven. Fysieke opruiming mag bij een daaropvolgende opslagbewerking plaatsvinden; de vervaltijd wordt altijd op basis van UTC-serverkloktijd beoordeeld.

## 5. Authenticatie en autorisatie

De meldingen-API hergebruikt de bestaande centrale Bearer-tokenvalidatie in `src/server/index.ts` (`hasWeatherApiToken()`).

- Alle geldige beheerde tokens zijn toegestaan; er wordt voor deze eerste versie geen afzonderlijke scope of permissie per token ingevoerd.
- De bestaande tijdelijke `WEATHER_API_TOKEN`-compatibiliteit blijft gelden zolang die legacy-configuratie door de server wordt geaccepteerd.
- Een token kan via het bestaande PIN-beveiligde tokenbeheer worden ingetrokken. Intrekking blokkeert direct ook meldingen-API-verzoeken met dat token.
- De API ontvangt nooit de Homey API-key.
- Bearer-secrets en Authorization-headers worden nooit gelogd.

Toekomstige token-scopes blijven mogelijk, maar maken geen deel uit van deze implementatie.

## 6. Validatie en foutcodes

Alle request bodies worden server-side gevalideerd. Onbekende velden worden afgewezen. `severity` accepteert uitsluitend `critical`, `warning` en `info`. Tekstvelden moeten niet-leeg zijn na trimmen. Aanbevolen contractlimieten voor de implementatie zijn maximaal 120 tekens voor `title` en 2.000 tekens voor `message`.

| HTTP | Betekenis |
|---|---|
| 200 | GET of PATCH geslaagd |
| 201 | Melding aangemaakt |
| 204 | Melding verwijderd |
| 400 | Ongeldige JSON, ontbrekend/verkeerd veld, ongeldige severity of vervaltijd |
| 401 | Bearer-token ontbreekt of is ongeldig |
| 403 | ID hoort bij een niet-API-melding |
| 404 | API-melding bestaat niet (meer) |
| 500 | Interne opslag- of verwerkingsfout |

Foutresponses gebruiken het bestaande eenvoudige JSON-patroon met een `error`-omschrijving. De server logt interne foutdetails, maar nooit credentials of volledige requestheaders.

## 7. Dashboardintegratie en realtime

De dashboardbackend voegt actieve API-meldingen samen met de bestaande door Blockly geëvalueerde meldingen in de presentatielaag. De API-opslag schrijft records met interne herkomst `api`; de bestaande configuratie/evaluatiestroom blijft de bron voor Blockly-meldingen. De herkomst wordt niet naar de tablet of als publiek API-veld meegestuurd.

- De bestaande Blockly-evaluatie en instellingenopslag blijven ongewijzigd.
- API-meldingen worden voor de dashboardpresentatie vertaald naar hetzelfde interne weergavemodel.
- De herkomst wordt niet als zichtbaar veld of label naar de tablet gestuurd.
- De bestaande severity-presentatie blijft leidend.
- De tablet kan een API-melding niet via de bestaande sluitactie verwijderen; beëindigen gebeurt door de externe client via DELETE of door de ingestelde vervaltijd.

Na een succesvolle POST, PATCH of DELETE verstuurt de backend via de bestaande SSE-verbinding een afzonderlijk `notifications-updated` event met uitsluitend `updatedAt`. Het event bevat geen meldingsinhoud of geheimen. De dashboardclient haalt daarna de actuele meldingen opnieuw op. Het bereiken van een vervaltijd veroorzaakt eveneens een realtime refresh, zodat een melding zonder nieuwe API-aanroep verdwijnt.

## 8. Implementatiegrenzen

Dit document beschrijft het goedgekeurde ontwerp, niet een reeds beschikbare API. De routes worden pas als geïmplementeerd beschouwd wanneer backend, tests, OpenAPI en de Docker-kopie van OpenAPI synchroon zijn bijgewerkt.

De bestaande `GET /api/notifications` blijft een interne dashboardroute en behoudt de bestaande Blockly-evaluatie. De nieuwe versiebeheerste routes zijn het externe contract.

## 9. Testplan

Minimaal te automatiseren tests:

1. Geldig token kan GET, POST, PATCH en DELETE uitvoeren.
2. Ontbrekend en ongeldig token leveren 401 op.
3. Elk geldig bestaand token werkt; ingetrokken tokens leveren 401 op.
4. POST vereist titel, bericht en geldige severity.
5. POST genereert zelf ID en tijdstempels; clientvelden voor ID/herkomst worden afgewezen.
6. GET toont alleen actieve API-meldingen en nooit Blockly-/standaardmeldingen.
7. PATCH wijzigt alleen opgegeven velden en behoudt overige waarden.
8. PATCH met `expiresAt: null` maakt een melding permanent.
9. Ongeldige of niet-toekomstige vervaltijden worden afgewezen.
10. Een verlopen melding verdwijnt uit GET en dashboard; de realtime refresh wordt verstuurd.
11. DELETE van een API-melding geeft 204.
12. PATCH/DELETE van een bestaande niet-API-melding geeft 403.
13. Onbekende IDs geven 404.
14. Gelijktijdige writes verliezen geen wijzigingen.
15. API-meldingen en bestaande meldingen verschijnen samen zonder zichtbaar herkomstlabel.
16. Persistente meldingen blijven na containerrestart beschikbaar.

## 10. Documentatie en implementatievolgorde

1. Dit ontwerp en de gebruikersbesluiten vastleggen in het besluitenlog.
2. Backendopslag en CRUD-routes implementeren met gedeelde tokenvalidatie.
3. Dashboardaggregatie, expiratie en SSE-refresh implementeren.
4. Unit- en integratietests toevoegen.
5. OpenAPI 3.1 uitbreiden en `public/api-docs/openapi.yaml` synchroon houden.
6. API-routecontrole, OpenAPI-lint, applicatiebuild en Docker-runtime valideren.

## 4.1 Interne herkomst van meldingen

Het interne meldingenmodel maakt de eigenaar/herkomst expliciet met een veld `source`. Dit veld is uitsluitend backendmetadata en wordt nooit als zichtbaar label op het dashboard getoond of als publiek veld in de API-responses opgenomen.

De herkomstwaarden zijn:

- `blockly`: actieve meldingen die voortkomen uit de bestaande Blockly-configuratie en -evaluatie. Ook de standaard meegeleverde meldingsregels vallen hieronder wanneer ze via ditzelfde Blockly-meldingenmodel worden geëvalueerd; hun herkomst wordt niet uitsluitend op basis van het feit dat ze standaard zijn bepaald.
- `api`: meldingen die via de externe Notifications API zijn aangemaakt en beheerd. Deze blijven fysiek opgeslagen in `DATA_DIR/api-notifications.json`; de opslaglocatie blijft de primaire eigendomsgrens.
- `system`: tijdelijke of structurele meldingen die door de dashboardapplicatie zelf worden gegenereerd, zoals technische verbindings- of laadfouten. Deze zijn geen Blockly-meldingen en geen API-meldingen.

De bestaande meldingenstroom wordt dus aangepast om herkomst intern vast te leggen en te behouden. Bij de implementatie moet eerst worden vastgesteld welke bestaande records daadwerkelijk uit Blockly komen en welke door de dashboardapplicatie zelf ontstaan. Bestaande records mogen niet blind allemaal als `blockly` worden gemarkeerd. Waar de herkomst betrouwbaar uit de producer/opslagroute kan worden afgeleid, wordt die expliciet gezet; anders blijft de herkomst tijdens de overgang onbekend totdat de producer is vastgesteld. Er wordt geen onjuiste broninformatie gemigreerd.

Voor de dashboardpresentatie worden actieve meldingen uit de verschillende bronnen samengevoegd tot één weergavelijst. De interne `source` blijft buiten het publieke weergavemodel en veroorzaakt geen extra bronbadge of tekst op de tablet. Eigenaarschap blijft wel bepalend voor acties: de externe API kan uitsluitend eigen `api`-meldingen wijzigen of verwijderen; Blockly-configuratie en systeemmeldingen blijven buiten haar beheer.

De tijdelijke Quick Action-foutmeldingen moeten bij implementatie expliciet als `system` (of een nader benoemd intern subtype daarvan) worden geclassificeerd en mogen niet als Blockly-meldingen worden behandeld.
