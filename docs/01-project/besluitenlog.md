

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
