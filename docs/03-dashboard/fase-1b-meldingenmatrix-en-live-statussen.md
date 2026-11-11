

### 12.8 Gebruikersbevestiging – Remeha-capabilities vastgesteld (11 november 2026)

De gebruiker heeft screenshots uit Homey Developer Tools aangeleverd voor het apparaat **Remeha ketel** (apparaat-ID `ed9e603f-0930-4a37-8282-86298c6ecf56`). Het apparaat is op het getoonde moment Ready en Available. De volgende relevante capabilities zijn zichtbaar:

| Capability | Homey-titel | Type | Waarde in screenshot |
|---|---|---|---|
| `boiler_state` | Ketel toestand | boolean | `false` |
| `DHW_state` | Tap water toestand | boolean | `false` |
| `DHW_mode` | Tap water comfort modus | enum | `off` |

Hiermee zijn de twee gevraagde statusbronnen voor de dashboardweergave vastgesteld: `boiler_state` voor verwarming/ketel actief-inactief en `DHW_state` voor tapwater actief-inactief. De booleanwaarde wordt als status gebruikt (`true` = actief, `false` = inactief); ontbrekende, ongeldige of niet-beschikbare waarden blijven `unknown` en worden niet als inactief getoond. De enum `DHW_mode` geeft de ingestelde tapwater-comfortmodus weer en is aanvullende context, niet de actuele tapwatervraag. De getoonde `off`-waarde is een momentopname, geen vaste configuratiewaarde.

De exacte semantiek van de ketelstatus is voor de dashboardtegel functioneel voldoende als Homey deze boolean betrouwbaar bijwerkt. De dashboardapp leest alle waarden uitsluitend read-only uit en wijzigt geen Homey-instellingen.


**Afbakening dashboardweergave:** de gebruiker bevestigt dat we bij het bestaande plan blijven. Alleen de twee afgesproken statussen (verwarming/ketel en tapwater) worden weergegeven. `DHW_mode` wordt niet als aparte status of tegel opgenomen.


### 12.9 Gebruikersbesluit – regenwaarschijnlijkheid via Open-Meteo-bron (11 november 2026)

De gebruiker bevestigt voor de bestaande regenmelding de Homey-bron **Raamsdonksveer**, apparaat-ID `b2fa37bb-45e2-4fda-87b7-24dcecf64420`, driver `homey:app:com.spkes.openMeteo:weather`. De regenwaarschijnlijkheid wordt gelezen uit capability `measure_precipitation_probability` (number). De getoonde waarde in de aangeleverde screenshot is 80; dit is een momentopname. De bestaande regel blijft **groter dan 25%**. De bron wordt read-only uitgelezen door de dashboardintegratie.

### 12.10 Gebruikersbesluit – weerconditie via Homey-flowkaart naar dashboard-API (11 november 2026)

De eerder besproken weer-icoonmatrix als lokale vertaallaag vervalt. In plaats daarvan biedt de dashboardcontainer een API-endpoint aan waarop de toekomstige Homey-app de actuele, door de gebruiker gekozen weerconditie kan doorgeven. De toekomstige Homey-app krijgt hiervoor een Flow-kaart met de actie **‘Zet huidige weerconditie naar’** en een dropdown met alle weercondities die het dashboard ondersteunt. De gebruiker kan in Homey zelf de actuele conditie uit diens eigen weerprovider bepalen en via deze kaart naar het dashboard sturen.

Het dashboard gebruikt de ontvangen, ondersteunde conditie voor de weergave. De lijst met canonieke ondersteunde condities, API-contract, authenticatie, validatie, foutafhandeling en gedrag bij ontbrekende/verouderde updates moeten nog technisch worden ontworpen. De Homey-app is toekomstig werk; dit besluit legt de gewenste architectuur en gebruikerservaring vast, niet een reeds geïmplementeerd endpoint of Flow-kaart.



### 12.11 Gebruikersakkoord – canonieke weercondities en API-contract (11 november 2026)

De gebruiker keurt de voorgestelde set van 16 ondersteunde dashboardcondities goed. Deze codes vormen de canonieke API-enum; Homey toont later Nederlandse labels in de Flow-dropdown en verstuurt de Engelse code:

| Code | Label |
|---|---|
| `sunny` | Zonnig |
| `mostly_sunny` | Overwegend zonnig |
| `partly_cloudy` | Half bewolkt |
| `cloudy` | Bewolkt |
| `overcast` | Zwaar bewolkt |
| `fog` | Mist |
| `drizzle` | Motregen |
| `rain` | Regen |
| `heavy_rain` | Zware regen |
| `showers` | Regenbuien |
| `thunderstorm` | Onweer |
| `hail` | Hagel |
| `snow` | Sneeuw |
| `snow_showers` | Sneeuwbuien |
| `sleet` | Natte sneeuw / ijzel |
| `windy` | Veel wind |

Dag/nacht is een afzonderlijke dimensie en wordt niet in deze conditiecodes gecodeerd. Een onbekende code mag de laatst bekende geldige conditie niet overschrijven.

**API-ontwerpvoorstel (nog ter bevestiging):** `POST /api/v1/weather/condition`, JSON-body `{"type":"cloudy"}`, Bearer-token-authenticatie, allowlist-validatie van de 16 codes en een servergegenereerde ontvangsttijd. Bij succes antwoordt de API met HTTP 200 en de geaccepteerde conditie plus `updatedAt`; ongeldige invoer geeft 400 en ontbrekende/ongeldige authenticatie 401. POST is idempotent voor herhaalde updates van dezelfde conditie. De endpointimplementatie en definitieve beveiligingsconfiguratie zijn nog niet gerealiseerd.



### 12.12 Gebruikersbesluit – benoemde API-tokens via dashboardinstellingen (11 november 2026)

De gebruiker wil in de dashboardinstellingen een beheerplek waar Bearer-tokens met een eigen naam kunnen worden aangemaakt. Deze tokens worden gebruikt door externe clients zoals de tijdelijke Homey Logic HTTP POST-kaart en later de officiële Homey-app. De HTTP-kaart ondersteunt het instellen van headers; de gebruiker vult zelf de Authorization-header en JSON-body in.

Ontwerpuitwerking voor tokenbeheer: toon een lijst met tokennaam en metadata (bijvoorbeeld aanmaakdatum/laatst gebruikt), genereer een cryptografisch willekeurig token, toon de volledige geheime waarde alleen direct na aanmaak en sla uitsluitend een veilige hash op. Bied intrekken/verwijderen en opnieuw genereren aan. Geheimen mogen niet in logs of API-responses terugkomen. Voor de eerste implementatie kan het token toegang geven tot de weerconditie-POST; houd autorisatie uitbreidbaar met scopes/rechten zodat tokens later niet automatisch volledige API-toegang krijgen. De precieze UI, tokenopslag en scope-indeling moeten nog technisch worden uitgewerkt.

Voorbeeld tijdelijke Homey-header: `Authorization: Bearer <token>`; content-type: `application/json`. Voorbeeld body: `{"type":"cloudy"}`. De gebruiker stelt de JSON handmatig in de Logic-kaart samen.


### Inventarisatie oorspronkelijke Home Assistant YAML – antwoord vraag 1

De gebruiker bevestigt dat de volgende onderdelen uit `ha tablet layout.yml` behouden blijven in de dashboardinventarisatie: droger (status/voortgang/resterende tijd), Truus (werkstatus en ophalen), Remeha (verwarming en warm tapwater), airco keuken en zolder (bedrijfsstatus en ingestelde temperatuur), kans op neerslag (>25%), muurtablet-batterij (<25%), tuinhuislamp (langer dan 5 minuten aan) en CO₂ woonkamer (>1200 ppm). Er zijn bij deze vraag geen onderdelen uitgesloten.

Aanvullende expliciete voorwaarde: de drogerkaart wordt alleen getoond wanneer de droger actief is/draait. De YAML gebruikt hiervoor `sensor.droger_dryer_machine_state == run` als visibility-voorwaarde en toont de geplande eindtijd via `sensor.droger_dryer_completion_time`. Deze oorspronkelijke logica blijft uitgangspunt voor verdere mapping.


### Inventarisatie oorspronkelijke Home Assistant YAML – antwoord vraag 2 (Truus)

De gebruiker kiest ervoor de oorspronkelijke YAML-logica exact te behouden. De gewone Truus-kaart is zichtbaar zolang `sensor.truus_truus_werk_status` niet gelijk is aan `Sleeping`, `Charging`, `Unavailable` of `Standby`. Bij exact `Standby` verschijnt de aparte kaart **‘Truus wil opgehaald worden!’**. Geen aanvullende opmerkingen.


### Inventarisatie oorspronkelijke Home Assistant YAML – antwoord vraag 3 (airco's)

De gebruiker kiest ervoor beide aircokaarten uitsluitend te tonen wanneer de airco actief is. Dit vervangt het oorspronkelijke verschil in zichtbaarheid tussen keuken en zolder: beide moeten een status anders dan `off` en `unavailable` hebben. Beide kaarten tonen bedrijfsstatus en ingestelde temperatuur. Geen aanvullende opmerkingen.


### Inventarisatie oorspronkelijke Home Assistant YAML – antwoord vraag 4 (muurtablet-batterij)

De gebruiker bevestigt de oorspronkelijke zichtbaarheid: toon de batterijkaart uitsluitend wanneer het batterijniveau lager is dan 25%. Geen aanvullende opmerkingen.


### Inventarisatie oorspronkelijke Home Assistant YAML – antwoord vraag 5 (tuinhuislamp)

De gebruiker bevestigt de oorspronkelijke regel: toon een melding wanneer de lamp in het tuinhuis langer dan 5 minuten aan staat. Aanvullende eis: houd bij de uitwerking rekening met de toekomstige Blockly-editor. De configureerbare tijdsduur/duurvoorwaarde moet daarom onderdeel zijn van het gedeelde, versieerbare notificatiemodel dat zowel JSON-configuratie als Blockly gebruikt; Blockly krijgt geen aparte evaluator of afwijkende regelimplementatie.


### Inventarisatie oorspronkelijke Home Assistant YAML – antwoord vraag 6 (CO₂ woonkamer)

De gebruiker bevestigt de oorspronkelijke regel: toon een melding wanneer de CO₂-waarde in de woonkamer hoger is dan 1200 ppm. Geen aanvullende opmerkingen.


### Inventarisatie oorspronkelijke Home Assistant YAML – antwoord vraag 7 (regenmelding)

De gebruiker bevestigt de oorspronkelijke regel: toon een regenmelding wanneer de neerslagkans hoger is dan 25%. Geen aanvullende opmerkingen.


### Inventarisatie oorspronkelijke Home Assistant YAML – antwoord vraag 8 (Blockly-bewerkbaarheid)

De gebruiker besluit dat **alle meldingen later met de Blockly-editor bewerkbaar moeten zijn**. Alle grenswaarden én tijdsvoorwaarden moeten instelbaar zijn. Dit geldt niet alleen voor de tuinhuislamp, CO₂- en regenmelding, maar voor het volledige notificatieaanbod. Ontwerp daarom vanaf het begin één generiek, versieerbaar notificatiemodel waarin per melding de voorwaarden, operatoren, grenswaarden, duur- en tijdsvoorwaarden bewerkbaar zijn. JSON-configuratie en Blockly moeten hetzelfde model en dezelfde backend-evaluator gebruiken; geen hardgecodeerde uitzonderingsregels of afzonderlijke Blockly-evaluator. De huidige bevestigde drempels zijn startwaarden/defaults die de bestaande YAML-werking behouden, geen onveranderlijke waarden.


### Inventarisatie oorspronkelijke Home Assistant YAML – antwoord vraag 9 (raamwaarschuwingen)

De gebruiker kiest ervoor de vier raamwaarschuwingen als vier afzonderlijke meldingen te behouden. Elke melding moet volledig zelfstandig bewerkbaar zijn, inclusief eigen voorwaarden, grenswaarden en tijdschema via de toekomstige Blockly-editor. Geen aanvullende opmerkingen. De bestaande inhoudelijke voorwaarden en schema's van elk van de vier regels blijven afzonderlijk behouden; deze keuze voegt geen nieuwe voorwaarden toe.


### Inventarisatie oorspronkelijke Home Assistant YAML – antwoord vraag 10 (weergave raamwaarschuwingen)

De gebruiker kiest ervoor de vier raamwaarschuwingen als vier losse meldingen weer te geven, zonder gezamenlijke kop of visuele groepering. De dashboardbrede sorteerregel uit `docs/03-dashboard/README.md` blijft leidend: eerst kritiek, daarna waarschuwing, daarna info; binnen hetzelfde niveau staat de melding met het nieuwste activeringstijdstip bovenaan. Groepering vindt dus uitsluitend plaats op meldingsniveau (kritiek/waarschuwing/info) en binnen elk niveau op tijd van binnenkomst/activering, niet op onderwerp of ruimte. De vier raamregels blijven technisch zelfstandig en afzonderlijk Blockly-bewerkbaar.


### Vraag 11 – meldingsniveau directe contactmeldingen (11 november 2026)

De zes directe contactmeldingen **Voordeur open**, **Deur tuinhuis open**, **Grote Bram**, **Grote Tess**, **Grote Ouders open** en **Raam Sem open** krijgen alle het niveau **waarschuwing**. Er zijn geen aanvullende opmerkingen. De bestaande voorwaarden en zelfstandige meldingen blijven ongewijzigd.


### Vraag 12 – meldingsniveau wateralarmen (12 november 2026)

De twee afzonderlijke meldingen **Wateralarm wasmachines!** en **Wateralarm vaatwasser!** krijgen beide het niveau **kritiek**. Er zijn geen aanvullende opmerkingen. De meldingen blijven afzonderlijk en behouden hun bestaande bronvoorwaarden.


### Vraag 13 – meldingsniveau vriezer keuken (12 november 2026)

De melding **Vriezer keuken warm!** krijgt het niveau **kritiek**. Er zijn geen aanvullende opmerkingen. De eerder vastgelegde Homey-bron en bestaande bronvoorwaarde blijven ongewijzigd.
