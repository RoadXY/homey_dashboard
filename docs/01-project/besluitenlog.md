

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


## Inventarisatie HA-YAML – regenmelding

Besluit: behoud de oorspronkelijke regenmelding wanneer de neerslagkans hoger is dan 25%. Geen aanvullende opmerkingen.


## Architectuurbesluit – volledige Blockly-bewerkbaarheid van meldingen

De gebruiker besluit dat alle meldingen later met Blockly bewerkt moeten kunnen worden. Alle grenswaarden en tijdsvoorwaarden moeten instelbaar zijn. Dit is een generieke architectuureis voor het volledige notificatieaanbod. Ontwerp één versieerbaar notificatiemodel met bewerkbare voorwaarden, operatoren, grenswaarden, duur- en tijdsvoorwaarden. De JSON-configuratie en toekomstige Blockly-editor gebruiken hetzelfde model en dezelfde backend-evaluator. De uit de oorspronkelijke Home Assistant YAML bevestigde waarden blijven de initiële instellingen/defaults om bestaand gedrag te behouden; ze mogen niet als hardgecodeerde, niet-bewerkbare waarden worden geïmplementeerd.


## Inventarisatie HA-YAML – vier raamwaarschuwingen

Besluit: de vier raamwaarschuwingen blijven afzonderlijke meldingen (raam Tess, raam Bram, raam ouders en dakraam Sem), elk volledig zelfstandig bewerkbaar via Blockly. De bestaande voorwaarden en tijdschema's blijven per melding gescheiden. Geen aanvullende opmerkingen.


## Inventarisatie HA-YAML – weergave en sortering raamwaarschuwingen

Besluit: de vier raamwaarschuwingen verschijnen als losse meldingen zonder gezamenlijke kop. De al bestaande dashboardregel uit `docs/03-dashboard/README.md` is leidend voor de volgorde: kritiek → waarschuwing → info; binnen hetzelfde niveau nieuwste activeringstijdstip/tijd van binnenkomst eerst. Er wordt niet aanvullend gegroepeerd op ruimte of onderwerp. De vier meldingen blijven afzonderlijke Blockly-bewerkbare regels.


## Inventarisatie HA-YAML – meldingsniveau directe contactmeldingen

Besluit: de zes directe contactmeldingen **Voordeur open**, **Deur tuinhuis open**, **Grote Bram**, **Grote Tess**, **Grote Ouders open** en **Raam Sem open** krijgen allemaal het niveau **waarschuwing**. Geen aanvullende opmerkingen. De oorspronkelijke voorwaarden en zelfstandige meldingen wijzigen hierdoor niet.


## Inventarisatie HA-YAML – meldingsniveau wateralarmen

Besluit: **Wateralarm wasmachines!** en **Wateralarm vaatwasser!** krijgen beide het meldingsniveau **kritiek**. De meldingen blijven afzonderlijk en behouden de bestaande voorwaarden. Geen aanvullende opmerkingen.


## Inventarisatie HA-YAML – meldingsniveau vriezermelding

Besluit: de melding **Vriezer keuken warm!** krijgt het niveau **kritiek**. De bestaande bronkoppeling en voorwaarde blijven ongewijzigd. Geen aanvullende opmerkingen.


## Inventarisatie HA-YAML – meldingsniveau CO₂ woonkamer

Besluit: **CO₂ woonkamer hoog!** krijgt het niveau **waarschuwing**. De bestaande drempel (>1200 ppm), bronkoppeling en voorwaarde blijven ongewijzigd. Geen aanvullende opmerkingen.


## Inventarisatie HA-YAML – meldingsniveau regenmelding

Besluit: **Kans op neerslag** (neerslagkans >25%) krijgt het niveau **info**. De bestaande Homey-bron en drempel blijven ongewijzigd. Geen aanvullende opmerkingen.


## Inventarisatie HA-YAML – meldingsniveau lage slaapkamer-temperaturen

Besluit: de vier meldingen **Slaapkamer Bram**, **Slaapkamer Tess**, **Ouderslaapkamer** en **Slaapkamer Sem** krijgen allemaal niveau **info**. De bestaande grens van <12 °C en bronkoppelingen blijven ongewijzigd. Geen aanvullende opmerkingen.


## Inventarisatie HA-YAML – meldingsniveau tuinhuislamp

Besluit: de melding voor de tuinhuislamp die langer dan vijf minuten aan staat krijgt niveau **info**. De bestaande duurvoorwaarde blijft ongewijzigd en configureerbaar in het gedeelde notificatiemodel. Geen aanvullende opmerkingen.


## Inventarisatie HA-YAML – meldingsniveau raam-niet-open-waarschuwingen

Besluit: de vier afzonderlijke meldingen **Raam Tess niet open**, **Raam Bram niet open**, **Raam ouders niet open** en **Dakraam Sem niet open** krijgen niveau **info**. Hun bestaande voorwaarden en tijdschema's blijven ongewijzigd. Geen aanvullende opmerkingen.


## Inventarisatie HA-YAML – meldingsniveau Achterdeur open

Besluit: **Achterdeur open** krijgt niveau **waarschuwing**. De oorspronkelijke gecombineerde voorwaarde (deur open én buitentemperatuur <18 °C of >24 °C) blijft ongewijzigd. Geen aanvullende opmerkingen.


## Inventarisatie HA-YAML – meldingsniveau slaapkamerlampen

Besluit: **Lamp Sem staat aan** en **Lamp Bram staat aan** krijgen beide niveau **info**. De bestaande voorwaarden (lamp aan én het bijbehorende slaaptijdschema actief) blijven ongewijzigd. Geen aanvullende opmerkingen.


## Inventarisatie HA-YAML – meldingsniveau batterij muurtablet

Besluit: de melding bij een batterijniveau van de muurtablet lager dan 25% krijgt niveau **waarschuwing**. De oorspronkelijke grenswaarde (<25%) blijft ongewijzigd. Geen aanvullende opmerkingen.


## Inventarisatie HA-YAML – meldingsniveau Truus wil opgehaald worden!

Besluit: **Truus wil opgehaald worden!** krijgt niveau **waarschuwing**. De bestaande voorwaarde blijft ongewijzigd: de werkstatus van Truus is exact `Standby`. Geen aanvullende opmerkingen.


## Inventarisatie HA-YAML – meldingsniveau Zolder koud

Besluit: **Zolder koud** krijgt niveau **info**, overeenkomstig de vier slaapkamer-temperatuurmeldingen. De oorspronkelijke HA-bronvoorwaarde (`binary_sensor.temperatuur_zolder_laag`) en kaartverwijzing (`climate.airco_zolder_thermostaat`) blijven geregistreerd; de exacte Homey-vertaling moet nog worden vastgesteld. Geen aanvullende opmerkingen.

## Gebruikersbesluit – grenswaarde Vriezer keuken warm! (12 november 2026)

Voor de kritieke melding **Vriezer keuken warm!** geldt in de dashboardmigratie: activeer bij een Homey-temperatuur van **meer dan 10 °C** en deactiveer bij **10 °C of lager**. De gekozen bron is Homey-apparaat **Koelkast keuken temperatuur** (ID `64fc846e-01b0-438a-9114-4498ea8005e7`), capability `measure_temperature`. De oorspronkelijke HA-dashboard-YAML bevatte een binaire zichtbaarheidstrigger (`binary_sensor.vriezer_keuken_temperatuur_hoog`) maar geen numerieke grens; 10 °C is een nieuw gebruikersbesluit. De Logic-variabele `Vriezer_tempAlarm` wordt niet als bron gebruikt.

## Gebruikersbevestiging – CO₂ woonkamer hoog! (12 november 2026)

Voor **CO₂ woonkamer hoog!** wordt Homey-apparaat **Multisensor woonkamer** met capability `measure_co2` gebruikt. De oorspronkelijke YAML-activeringsgrens blijft **hoger dan 1200 ppm**. De melding is actief bij >1200 ppm en inactief bij ≤1200 ppm. Het eerder vastgestelde meldingsniveau blijft **waarschuwing**.

## Gebruikersbevestiging – Kans op neerslag (12 november 2026)

Voor de melding **Kans op neerslag** gebruikt het dashboard Homey-apparaat **Raamsdonksveer** (ID `b2fa37bb-45e2-4fda-87b7-24dcecf64420`), capability `measure_precipitation_probability`. De oorspronkelijke grens **meer dan 25%** blijft behouden. De melding is actief bij >25% en inactief bij ≤25%. Het eerder vastgestelde meldingsniveau blijft **info**.

## Gebruikersbevestiging – buitentemperatuurbron Achterdeur open (12 november 2026)

Voor **Achterdeur open** wordt Homey-apparaat **Weer** met capability `measure_temperature` gebruikt als buitentemperatuurbron. De oorspronkelijke YAML-voorwaarde blijft ongewijzigd: achterdeurcontact open én (buitentemperatuur <18 °C óf >24 °C). De temperatuurgrenzen vormen een OR-groep; deze wordt via AND gecombineerd met het open deurcontact. Het meldingsniveau blijft **waarschuwing**.

## Gebruikersbevestiging – Zolder koud (12 november 2026)

Voor **Zolder koud** gebruikt het dashboard Homey-apparaat **Temperatuur Sem** (ID `ba9336e2-f4ed-417c-bba6-3fafb735e61a`), capability `measure_temperature`. De melding is actief bij een temperatuur **lager dan 12 °C**. De oorspronkelijke kaartverwijzing naar de ingestelde temperatuur van `climate.airco_zolder_thermostaat` blijft behouden voor de weergave. Het eerder vastgestelde meldingsniveau blijft **info**.

## Herbruikbare Blockly-bouwsteen voor bovenramenschema (12 november 2026)

Het oorspronkelijke Home Assistant-schema `schedule.boven_ramen_open` wordt in Homey gereproduceerd als herbruikbare Blockly-bouwsteen met instelbare dagen en tijden. Dashboardcondities blijven strikt gebaseerd op de oorspronkelijke YAML; Homey Flows zijn geen bron voor deze logica.
