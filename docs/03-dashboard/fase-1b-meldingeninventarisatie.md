

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

### Vriezer keuken warm! – expliciete migratiegrens (12 november 2026)

Voor deze kritieke melding is de migratiegrens vastgesteld op **temperatuur >10 °C**. De oorspronkelijke YAML-kaart gebruikte `binary_sensor.vriezer_keuken_temperatuur_hoog` als zichtbaarheidstrigger, maar gaf geen numerieke grens. De 10 °C is een nieuw, expliciet gebruikersbesluit en mag niet worden gepresenteerd als een uit de YAML overgenomen waarde. De Homey-temperatuurbron is **Koelkast keuken temperatuur**, capability `measure_temperature`; `Vriezer_tempAlarm` wordt niet gebruikt.

### CO₂ woonkamer hoog! – Homey-bron bevestigd (12 november 2026)

Homey-apparaat **Multisensor woonkamer**, capability `measure_co2`, is bevestigd als bron. De oorspronkelijke YAML-grens **>1200 ppm** blijft behouden. De melding heeft niveau **waarschuwing**.

### Kans op neerslag – Homey-bron en grens bevestigd (12 november 2026)

Homey-apparaat **Raamsdonksveer**, capability `measure_precipitation_probability`, is bevestigd als bron. Behoud de oorspronkelijke YAML-grens **>25%**. Meldingsniveau: **info**.

### Achterdeur open – buitentemperatuurbron bevestigd (12 november 2026)

Homey-apparaat **Weer**, capability `measure_temperature`, is bevestigd als buitentemperatuurbron. Behoud de oorspronkelijke samengestelde voorwaarde: achterdeur open én (temperatuur <18 °C óf >24 °C). Meldingsniveau: **waarschuwing**.

### Zolder koud – Homey-bron en grens bevestigd (12 november 2026)

Homey-apparaat **Temperatuur Sem**, capability `measure_temperature`, is bevestigd als bron voor de zichtbaarheidstrigger. De melding wordt actief bij **<12 °C**. De kaart toont daarnaast de ingestelde temperatuur van de zolder-airco zoals in de oorspronkelijke YAML. Meldingsniveau: **info**.

### Schema bovenramen – migratiebesluit (12 november 2026)

Het in de oorspronkelijke YAML gebruikte `schedule.boven_ramen_open` wordt als herbruikbare Blockly-bouwsteen gereproduceerd, met instelbare dagen en tijden. De bestaande raamcondities blijven leidend.

### Bronbevestiging – Wateralarm wasmachines! (12 november 2026)

Gekozen Homey-bron: afzonderlijke **Water sensor wasmachine**, capability `alarm_water`. Niet de wasmachine zelf. De oorspronkelijke YAML-voorwaarde blijft leidend; meldingsniveau **kritiek**. Exact apparaat-ID en actuele waarde zijn nog niet in deze bevestiging opgenomen.

### Live Homey-inventarisatie – apparaatbronnen gecontroleerd (13 november 2026)

De Homey Pro 2023 is read-only geïnventariseerd via de actuele apparaatlijst. Onderstaande apparaat-ID's en capabilitynamen zijn rechtstreeks uit Homey opgehaald. Waarden uit deze inventarisatie zijn momentopnames en worden niet als vaste configuratie gebruikt.

| Onderdeel | Homey-apparaat | Apparaat-ID | Relevante capability(s) | Status |
|---|---|---|---|---|
| Droger | Samsung wasdroger | `134d7e99-5067-4891-bb1e-222d1e970222` | `localthings_machine_state`, `localthings_progress`, `localthings_remaining_minutes` | Bron en velden gevonden; exacte weergaveconversie van eindtijd naar resterende minuten nog nalopen |
| Truus | Truus | `1f76bd9a-b6f6-4f78-8734-742b9d054cfc` | `measure_work_status` | Bron gevonden; exacte statuswaarden moeten in de notificatieconfiguratie worden gevalideerd |
| Muurtablet-batterij | Muur tablet | `3047fdb8-2dea-4cea-b023-27c9693b4635` | `measure_battery` | Bron gevonden |
| Lamp Sem | Lamp Sem | `b164e453-6fba-4d9c-81ba-82596082eef5` | `onoff` | Bron gevonden; schema `slapen_sem` blijft nog te vertalen |
| Lamp Bram | Lamp Bram | `489075ba-fe6d-4b15-9e33-8a7539dafbda` | `onoff` | Bron gevonden; schema `slapen_bram` blijft nog te vertalen |
| Wateralarm wasmachine | Water Sensor wasmachines | `8fbc6198-191f-4bdd-bc40-a09158441d2f` | `alarm_water` | Exacte bron-ID bevestigd; actuele waarde was `false` |
| Wateralarm vaatwasser | Water sensor vaatwasser | `5ae0730c-27ca-4559-b1f2-ffeba8fb1565` | `alarm_water` | Bron gevonden; actuele waarde was `false` |
| Airco keuken | Airco keuken | `835913ba-2608-45be-bc69-c1f7f5441be3` | `onoff`, `thermostat_mode`, `target_temperature` | Bron en relevante velden gevonden |
| Airco zolder | Airco zolder | `746e2538-bf25-45b0-8e98-3e0100bff811` | `onoff`, `thermostat_mode`, `target_temperature` | Bron en relevante velden gevonden |
| Regenwaarschijnlijkheid | Raamsdonksveer | `b2fa37bb-45e2-4fda-87b7-24dcecf64420` | `measure_precipitation_probability` | Reeds eerder bevestigd; opnieuw aangetroffen |
| CO₂ woonkamer | Multisensor woonkamer | `2c7a4148-1042-4dd5-80d4-81d07bcf66ed` | `measure_co2` | Bron gevonden; grens >1200 ppm blijft leidend |
| Vriezer keuken | Koelkast keuken temperatuur | `64fc846e-01b0-438a-9114-4498ea8005e7` | `measure_temperature` | Reeds eerder bevestigd; grens >10 °C blijft leidend |
| Achterdeur | Achterdeur | `8bd0184e-5cd7-443f-bafc-8d509ab32e7a` | `alarm_contact` | Reeds eerder bevestigd |
| Buitentemperatuur | Weer | `c7e68c38-d722-4bda-81b1-9b7f5f9e5c0` | `measure_temperature` | Apparaat-ID in deze live inventarisatie is leidend; eerder vastgelegde ID moet bij migratie worden gecontroleerd |

#### Raam- en contactapparaten aangetroffen

De volgende Homey-apparaten met `alarm_contact` zijn in de actuele inventarisatie aangetroffen. De apparaatnamen zijn vastgelegd, maar de precieze koppeling aan de afzonderlijke YAML-meldingen wordt pas definitief gemaakt na vergelijking met de oorspronkelijke entiteiten/voorwaarden; namen alleen zijn onvoldoende om bijvoorbeeld bovenraam en onderraam te verwisselen.

| Homey-apparaat | Apparaat-ID |
|---|---|
| Voordeur | `ae20dbd0-2b61-4f46-9638-c2a38cd2f2e6` |
| Deur tuinhuis | `0f02abca-04cb-405a-b7d1-437cf2b4c050` |
| Bovenraam Bram | `7972a10c-da9b-4d15-b4eb-305d9cb097e3` |
| Onder raam Bram | `952d6163-bda4-44ae-a346-7fbf7e980dbc` |
| Boven raam Tess | `68528dbf-b2cb-49dc-89e6-0425cbd7db97` |
| Onder raam Tess | `f929115b-18d9-41bb-bf67-e9a633f00ee7` |
| Bovenraam ouderslaapkamer | `3c8d2ab7-bc67-4d4d-a92d-4c66c9338f6b` |
| Ouderslaapkamer onderraam | `129f22a4-1f01-420c-a1a9-c41a25c6c46d` |
| Dakraam Sem | `d1ef5cbd-ba35-48b7-8219-0112403c80bf` |
| Raam Sem | `f5a84ac4-1819-49ad-823f-c473c03b6043` |

**Controlepunt:** de eerder in deze documentatie genoemde ID voor apparaat **Weer** moet worden gecorrigeerd/vergeleken met de live Homey-inventarisatie voordat een nieuwe configuratie hierop wordt gebaseerd. De live inventarisatie retourneerde apparaat-ID `c7e68c38-1588-4c93-9db8-e854f4d251ab`; deze waarde is leidend. De ID in de tabel hierboven is daarom niet als definitief vastgelegd.
