

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
