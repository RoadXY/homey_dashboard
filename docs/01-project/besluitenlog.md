

## Gebruikersbevestiging – Remeha-statuscapabilities (11 november 2026)

- De gebruiker heeft de actuele capabilitylijst van Homey-apparaat **Remeha ketel** gedeeld (ID `ed9e603f-0930-4a37-8282-86298c6ecf56`).
- `boiler_state` (boolean, Ketel toestand) wordt gebruikt voor de statusweergave verwarming/ketel actief-inactief.
- `DHW_state` (boolean, Tap water toestand) wordt gebruikt voor de statusweergave tapwater actief-inactief.
- Voor beide boolean-bronnen geldt `true` = actief en `false` = inactief. Onbekende of niet-beschikbare waarden worden afzonderlijk als onbekend behandeld.
- `DHW_mode` (enum, Tap water comfort modus) met screenshotwaarde `off` is aanvullende modusinformatie, niet de actuele tapwatervraag.
- De getoonde waarden zijn een momentopname. Het dashboard leest de capabilities uitsluitend read-only uit en wijzigt Homey niet.


## Gebruikersbevestiging – Remeha-weergave blijft volgens plan (11 november 2026)

De gebruiker bevestigt dat we bij het bestaande plan blijven: het dashboard toont uitsluitend verwarming/ketel actief-inactief (`boiler_state`) en tapwater actief-inactief (`DHW_state`). De aanvullende capability `DHW_mode` wordt niet als aparte dashboardinformatie weergegeven.


## Gebruikersbesluit – regenwaarschijnlijkheid uit Homey Open-Meteo (11 november 2026)

- Homey-apparaat **Raamsdonksveer**, ID `b2fa37bb-45e2-4fda-87b7-24dcecf64420`, driver `homey:app:com.spkes.openMeteo:weather`, is de gekozen bron.
- De capability `measure_precipitation_probability` (number) levert de regenwaarschijnlijkheid.
- De bestaande voorwaarde **groter dan 25%** blijft ongewijzigd. De screenshotwaarde 80 is uitsluitend een momentopname.

## Gebruikersbesluit – weerconditie pushen via toekomstige Homey-app (11 november 2026)

- De eerder besproken weer-icoonmatrix vervalt.
- De dashboardcontainer krijgt in de toekomstige architectuur een API-endpoint om de actuele weerconditie te ontvangen van de toekomstige Homey-app.
- De Homey-app krijgt een Flow-kaart **‘Zet huidige weerconditie naar’** met een dropdown van alle door het dashboard ondersteunde weercondities.
- De gebruiker kiest in Homey de actuele conditie die uit diens eigen weerprovider komt en laat die via de Flow-kaart naar de container sturen.
- De lijst met ondersteunde canonieke condities, API-contract, authenticatie, validatie en gedrag bij ontbrekende/verouderde updates worden later technisch uitgewerkt. Dit is een vastgelegde ontwerpkeuze; de app, kaart en endpoint zijn nog niet geïmplementeerd.



## Gebruikersakkoord – 16 canonieke weercondities (11 november 2026)

De gebruiker keurt de voorgestelde lijst van 16 weercondities goed voor het dashboard en de toekomstige Homey Flow-dropdown. De canonieke API-codes zijn: `sunny`, `mostly_sunny`, `partly_cloudy`, `cloudy`, `overcast`, `fog`, `drizzle`, `rain`, `heavy_rain`, `showers`, `thunderstorm`, `hail`, `snow`, `snow_showers`, `sleet`, `windy`. De Flow-kaart toont Nederlandse labels en verstuurt de Engelse code. Dag/nacht blijft een aparte dimensie; onbekende codes overschrijven de laatst bekende geldige conditie niet.

**Voorlopig API-advies, nog niet definitief besloten:** `POST /api/v1/weather/condition` met JSON `{"type":"cloudy"}`, Bearer-tokenauthenticatie, validatie tegen de vaste enum en servergegenereerde ontvangsttijd. Succes: HTTP 200; ongeldige body/code: 400; ontbrekende of ongeldige token: 401. De endpoint moet idempotent omgaan met herhaalde updates. Definitieve keuze en implementatie volgen na afstemming.



## Gebruikersbesluit – benoemde Bearer-tokens beheren in Settings (11 november 2026)

- Er komt een plek in de dashboardinstellingen om Bearer-tokens met een eigen naam te genereren en te beheren.
- De tijdelijke Homey Logic HTTP POST-kaart kan headers meesturen; de gebruiker stelt zelf de Authorization-header in en maakt de JSON-body handmatig.
- Voorbeeld: header `Authorization: Bearer <token>`, body `{"type":"cloudy"}`.
- Beveiligingsontwerp: tokenwaarde cryptografisch willekeurig genereren, volledig geheim alleen bij aanmaak tonen, alleen een veilige hash bewaren, intrekken/verwijderen mogelijk maken en geheimen nooit loggen. Ontwerp uitbreidbaar houden met scopes/rechten; de eerste token kan beperkt worden tot de weerconditie-API.
- De exacte UI, opslag, scopes en implementatie worden nog technisch uitgewerkt.


## Inventarisatie oorspronkelijke HA-YAML – vraag 1

De gebruiker bevestigt behoud van: drogerstatus/voortgang/resterende tijd; Truus werkstatus/ophaalverzoek; Remeha verwarming/warm tapwater; airco keuken en zolder met bedrijfsstatus/ingestelde temperatuur; neerslagkans boven 25%; muurtablet-batterij onder 25%; tuinhuislamp langer dan 5 minuten aan; CO₂ woonkamer boven 1200 ppm. Geen uitsluitingen bij deze vraag.

De droger wordt uitsluitend getoond wanneer hij actief is/draait. De YAML-bronvoorwaarde is `sensor.droger_dryer_machine_state == run`; de getoonde eindtijd komt uit `sensor.droger_dryer_completion_time`.


## Inventarisatie HA-YAML – Truus

De gebruiker bevestigt de bestaande YAML-zichtbaarheidslogica ongewijzigd: gewone Truus-status bij alle statussen behalve `Sleeping`, `Charging`, `Unavailable` en `Standby`; aparte melding **‘Truus wil opgehaald worden!’** bij `Standby`. Geen opmerkingen of uitzonderingen toegevoegd.


## Inventarisatie HA-YAML – airco's

De gebruiker besluit dat airco keuken en airco zolder uitsluitend zichtbaar zijn wanneer actief: status is niet `off` en niet `unavailable`. Beide tonen bedrijfsstatus en ingestelde temperatuur. Hiermee wordt het oorspronkelijke verschil in YAML-zichtbaarheidsvoorwaarden gelijkgetrokken.


## Inventarisatie HA-YAML – batterij muurtablet

Besluit: behoud de oorspronkelijke zichtbaarheid van de batterijkaart; alleen tonen wanneer het batterijniveau lager is dan 25%. Geen aanvullende opmerkingen.


## Inventarisatie HA-YAML – tuinhuislamp en Blockly

De melding voor de tuinhuislamp blijft conform de oorspronkelijke regel: lamp langer dan 5 minuten aan. Bij de technische uitwerking moet de duurvoorwaarde configureerbaar zijn in het gedeelde, versieerbare notificatiemodel, dat zowel JSON-configuratie als de toekomstige Blockly-editor gebruikt. Geen afzonderlijke Blockly-evaluator of afwijkende logica.


## Inventarisatie HA-YAML – CO₂ woonkamer

Besluit: behoud de oorspronkelijke melding wanneer de CO₂-waarde hoger is dan 1200 ppm. Geen aanvullende opmerkingen.
