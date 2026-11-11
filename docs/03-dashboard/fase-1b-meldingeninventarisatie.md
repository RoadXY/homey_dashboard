

### Gebruikersbevestiging – Remeha-ketelstatusbronnen (11 november 2026)

Screenshots uit Homey Developer Tools bevestigen voor apparaat **Remeha ketel** (ID `ed9e603f-0930-4a37-8282-86298c6ecf56`) de relevante capabilities:
- `boiler_state` — boolean, titel **Ketel toestand**; getoonde waarde `false`.
- `DHW_state` — boolean, titel **Tap water toestand**; getoonde waarde `false`.
- `DHW_mode` — enum, titel **Tap water comfort modus**; getoonde waarde `off`.

De eerste twee zijn de gekozen read-only bronnen voor respectievelijk verwarming/ketel actief-inactief en tapwater actief-inactief. Voor beide geldt `true` = actief en `false` = inactief; een ontbrekende, ongeldige of niet-beschikbare waarde wordt als onbekend behandeld. `DHW_mode` is aanvullende informatie over de ingestelde comfortmodus en mag niet worden verward met de actuele tapwatertoestand. De getoonde waarden zijn slechts een momentopname.


**Afbakening:** conform bevestiging van de gebruiker blijft de Remeha-weergave beperkt tot verwarming actief/inactief en tapwater actief/inactief. `DHW_mode` wordt niet opgenomen in het dashboard.


### Gebruikersbevestiging – weerbron en toekomstige conditie-overdracht (11 november 2026)

Voor de regenwaarschijnlijkheid is de Homey-weerdienst **Raamsdonksveer** bevestigd (apparaat-ID `b2fa37bb-45e2-4fda-87b7-24dcecf64420`, Open-Meteo-driver). Capability `measure_precipitation_probability` (number) levert de regenwaarschijnlijkheid; de bestaande grens blijft **groter dan 25%**. De screenshot toont 80 als momentopname.

De weer-icoonmatrix komt te vervallen. Gewenste toekomstige oplossing: een API-endpoint in de dashboardcontainer ontvangt de actuele weerconditie vanuit de toekomstige Homey-app. Die app biedt een Flow-kaart **‘Zet huidige weerconditie naar’** met een dropdown van de door het dashboard ondersteunde condities. De gebruiker bepaalt in Homey welke actuele conditie uit de eigen weerprovider wordt doorgestuurd. Canonieke condities, endpointcontract, beveiliging en stale/missing-data gedrag zijn nog uit te werken; endpoint en kaart zijn nog niet gebouwd.



### Canonieke weercondities – akkoord gebruiker (11 november 2026)

De gebruiker keurt de set van 16 dashboardcondities goed: `sunny`, `mostly_sunny`, `partly_cloudy`, `cloudy`, `overcast`, `fog`, `drizzle`, `rain`, `heavy_rain`, `showers`, `thunderstorm`, `hail`, `snow`, `snow_showers`, `sleet` en `windy`. De Homey Flow-kaart toont Nederlandse labels; de API gebruikt deze vaste Engelse codes. Dag/nacht wordt apart behandeld. Onbekende codes mogen de laatst bekende geldige conditie niet overschrijven.

Als voorlopig API-ontwerp wordt `POST /api/v1/weather/condition` met body `{"type":"cloudy"}` voorgesteld. Bearer-tokenauthenticatie, allowlist-validatie, serverontvangsttijd en HTTP 200/400/401-responses zijn aanbevolen maar nog ter definitieve bevestiging en implementatie.



### API-authenticatie – gebruikerswens voor tokenbeheer (11 november 2026)

De dashboardinstellingen moeten een beheerplek krijgen om Bearer-tokens met een eigen naam te genereren. De gebruiker kan deze token als Authorization-header meegeven in de Homey Logic HTTP POST-kaart; die kaart ondersteunt headers. De gebruiker stelt de JSON-body zelf samen, bijvoorbeeld `{"type":"cloudy"}`. Tokenbeheer moet veilige eenmalige weergave van de geheime tokenwaarde, veilige hashopslag, intrekken/verwijderen en uitbreidbare rechten/scopes ondersteunen. Technische uitwerking en implementatie staan nog open.


### Inventarisatie YAML – behouden onderdelen, vraag 1

De gebruiker wil alle acht voorgelegde onderdelen behouden: droger (status, voortgang, resterende tijd), Truus (werkstatus en ophalen), Remeha (verwarming en warm tapwater), airco keuken/zolder (status en ingestelde temperatuur), neerslagkans boven 25%, muurtablet-batterij onder 25%, tuinhuislamp langer dan 5 minuten aan en CO₂ woonkamer boven 1200 ppm. Geen van deze onderdelen is uitgesloten.

Voor de droger geldt expliciet: alleen tonen als deze actief is/draait. In de oorspronkelijke YAML is de kaart zichtbaar bij `sensor.droger_dryer_machine_state` = `run` en wordt de eindtijd getoond uit `sensor.droger_dryer_completion_time`.


### Vraag 2 – Truus: oorspronkelijke zichtbaarheid behouden

De gebruiker bevestigt behoud van de YAML-logica: toon de gewone Truus-status wanneer de werkstatus niet `Sleeping`, `Charging`, `Unavailable` of `Standby` is. Toon de aparte melding **‘Truus wil opgehaald worden!’** wanneer de status exact `Standby` is. Geen aanvullende opmerkingen.


### Vraag 3 – airco keuken en zolder

De gebruiker kiest: beide airco's alleen tonen wanneer actief; voor beide geldt status niet `off` en niet `unavailable`. De kaarten tonen bedrijfsstatus en ingestelde temperatuur. Geen aanvullende opmerkingen.


### Vraag 4 – batterij muurtablet

Behoud de oorspronkelijke regel: de batterijkaart is uitsluitend zichtbaar bij een batterijniveau lager dan 25%. Geen aanvullende opmerkingen.


### Vraag 5 – lamp tuinhuis

Behoud de oorspronkelijke melding wanneer de lamp langer dan 5 minuten aan staat. Houd rekening met de toekomstige Blockly-editor: leg de duurvoorwaarde configureerbaar vast in het gedeelde versieerbare notificatiemodel, zodat JSON-configuratie en Blockly dezelfde backend-evaluator gebruiken.


### Vraag 6 – CO₂ woonkamer

Behoud de oorspronkelijke regel: melding wanneer de CO₂-waarde hoger is dan 1200 ppm. Geen aanvullende opmerkingen.


### Vraag 7 – regenmelding

Behoud de oorspronkelijke regel: regenmelding wanneer de neerslagkans hoger is dan 25%. Geen aanvullende opmerkingen.


### Vraag 8 – algemene Blockly-bewerkbaarheid

Besluit: alle meldingen moeten later via Blockly bewerkbaar zijn. Alle grenswaarden en tijdsvoorwaarden zijn instelbaar. Dit geldt voor het volledige notificatieaanbod, niet alleen voor enkele expliciet genoemde meldingen. Gebruik één generiek en versieerbaar notificatiemodel waarin voorwaarden, operatoren, grenswaarden en duur-/tijdvoorwaarden worden opgeslagen. JSON en Blockly werken op hetzelfde model en dezelfde backend-evaluator. De momenteel bevestigde waarden uit de oorspronkelijke YAML dienen als initiële configuratie/defaults, zodat het bestaande gedrag behouden blijft totdat de gebruiker ze wijzigt.


### Vraag 9 – vier raamwaarschuwingen

Behoud vier afzonderlijke meldingen: raam Tess, raam Bram, raam ouders en dakraam Sem. Elke melding is volledig zelfstandig bewerkbaar via Blockly, met eigen voorwaarden en tijdschema. Geen aanvullende opmerkingen.


### Vraag 10 – weergave raamwaarschuwingen

Toon de vier raamwaarschuwingen als vier losse meldingen, zonder gezamenlijke kop. Pas de bestaande dashboardbrede sorteervolgorde toe: kritiek, waarschuwing, info; binnen hetzelfde niveau nieuwste activering/tijd van binnenkomst eerst. Er komt geen aanvullende groepering op ruimte of onderwerp. De vier regels blijven zelfstandig bewerkbaar.


### Vraag 11 – meldingsniveau directe contactmeldingen

De gebruiker kent aan alle zes directe contactmeldingen hetzelfde niveau toe: **waarschuwing**. Het betreft Voordeur open, Deur tuinhuis open, Grote Bram, Grote Tess, Grote Ouders open en Raam Sem open. Geen aanvullende opmerkingen; bronvoorwaarden en afzonderlijke meldingen blijven ongewijzigd.


### Vraag 12 – meldingsniveau wateralarmen

De gebruiker kiest voor niveau **kritiek** voor beide afzonderlijke wateralarmen: **Wateralarm wasmachines!** en **Wateralarm vaatwasser!**. Geen aanvullende opmerkingen; de oorspronkelijke voorwaarden blijven ongewijzigd.


### Vraag 13 – meldingsniveau vriezer keuken

De gebruiker kiest voor niveau **kritiek** voor de melding **Vriezer keuken warm!**. Geen aanvullende opmerkingen; de eerder vastgelegde Homey-bron en bestaande voorwaarde blijven ongewijzigd.


### Vraag 14 – meldingsniveau CO₂ woonkamer

De gebruiker kiest voor niveau **waarschuwing** voor **CO₂ woonkamer hoog!**. Geen aanvullende opmerkingen; de bestaande grens (>1200 ppm), Homey-bron en voorwaarde blijven ongewijzigd.


### Vraag 15 – meldingsniveau regenmelding

De gebruiker kiest voor niveau **info** voor de melding **Kans op neerslag** (neerslagkans >25%). Geen aanvullende opmerkingen; de bestaande bron en voorwaarde blijven ongewijzigd.


### Vraag 16 – meldingsniveau lage slaapkamer-temperaturen

De gebruiker kiest voor niveau **info** voor alle vier temperatuurmeldingen: Slaapkamer Bram, Slaapkamer Tess, Ouderslaapkamer en Slaapkamer Sem. De bestaande activeringsgrens blijft voor alle vier lager dan 12 °C. Geen aanvullende opmerkingen.


### Vraag 17 – meldingsniveau tuinhuislamp

De gebruiker kiest voor niveau **info** voor de melding wanneer de tuinhuislamp langer dan vijf minuten aan staat. Geen aanvullende opmerkingen. De duurvoorwaarde blijft configureerbaar in het gedeelde notificatiemodel voor JSON en Blockly.


### Vraag 18 – meldingsniveau raam-niet-open-waarschuwingen

De gebruiker kiest voor niveau **info** voor alle vier afzonderlijke meldingen: Raam Tess niet open, Raam Bram niet open, Raam ouders niet open en Dakraam Sem niet open. Geen aanvullende opmerkingen; bestaande voorwaarden en tijdschema's blijven ongewijzigd.


### Vraag 19 – meldingsniveau Achterdeur open

De gebruiker kiest voor niveau **waarschuwing** voor **Achterdeur open**. De oorspronkelijke voorwaarde blijft intact: contact open én (buitentemperatuur <18 °C of >24 °C). Geen aanvullende opmerkingen.


### Vraag 20 – meldingsniveau slaapkamerlampen

De gebruiker kiest voor niveau **info** voor beide afzonderlijke meldingen: **Lamp Sem staat aan** en **Lamp Bram staat aan**. Geen aanvullende opmerkingen. De oorspronkelijke combinatie van lamp aan en het bijbehorende actieve slaaptijdschema blijft behouden.


### Vraag 21 – meldingsniveau batterij muurtablet

De gebruiker kiest voor niveau **waarschuwing** wanneer de batterij van de muurtablet lager is dan 25%. Geen aanvullende opmerkingen. De bestaande grenswaarde (<25%) blijft ongewijzigd.


### Vraag 22 – meldingsniveau Truus wil opgehaald worden!

De gebruiker kiest voor niveau **waarschuwing** voor **Truus wil opgehaald worden!**. Geen aanvullende opmerkingen. De bestaande voorwaarde blijft ongewijzigd: de werkstatus van Truus is exact `Standby`.


### Vraag 23 – meldingsniveau Zolder koud

De gebruiker kiest voor niveau **info** voor de afzonderlijke melding **Zolder koud**. De oorspronkelijke bronvoorwaarde via `binary_sensor.temperatuur_zolder_laag` en de verwijzing naar `climate.airco_zolder_thermostaat` blijven behouden. De exacte Homey-mapping van de afgeleide HA-sensor is nog niet bevestigd. Geen aanvullende opmerkingen.
