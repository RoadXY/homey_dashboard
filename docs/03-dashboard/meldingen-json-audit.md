# Meldingeninventarisatie – audit JSON-configuraties

**Datum:** 13 november 2026  
**Branch:** `phase_1_foundation`  
**Doel:** de goedgekeurde meldingeninventarisatie vergelijken met de actuele JSON-bestanden voordat ontbrekende meldingen worden aangemaakt.  
**Uitgangspunt:** de oorspronkelijke Home Assistant-YAML en expliciet door de gebruiker bevestigde migratiebesluiten zijn leidend. Homey is uitsluitend een read-only bron. Er worden geen bron-ID's of voorwaarden afgeleid op basis van alleen een vergelijkbare naam.

## 1. Huidige JSON-bestanden

In `config/notifications/` staan zes bestanden. Daarvan zijn vijf bedoeld als productieconfiguratie en één als tijdelijke test:

| JSON | Huidige inhoud | Auditstatus |
|---|---|---|
| `achterdeur-open.json` | Contact achterdeur open én buitentemperatuur <18 °C of >24 °C | Voorwaarde en niveau `warning` komen overeen met het besluit. Homey-bronnen zijn in de inventarisatie bevestigd. |
| `co2-woonkamer-test.json` | Handmatige Logic-boolean `dashboard_test_co2_melding` | Tijdelijke testconfiguratie (`testOnly: true`), geen productieconfiguratie. Nog vervangen/aanvullen met de echte CO₂-melding. |
| `ouderslaapkamer-koud.json` | Temperatuur <12 °C | Bron en grens komen overeen met de huidige inventarisatie; severity staat nog op `warning`, terwijl het gebruikersbesluit `info` is. |
| `slaapkamer-bram-koud.json` | Temperatuur <12 °C | Bron en grens komen overeen met de huidige inventarisatie; severity staat nog op `warning`, terwijl het gebruikersbesluit `info` is. |
| `slaapkamer-tess-koud.json` | Temperatuur <12 °C | Bron en grens komen overeen met de huidige inventarisatie; severity staat nog op `warning`, terwijl het gebruikersbesluit `info` is. |
| `zolder-koud.json` | Temperatuur <12 °C | Bron en grens komen overeen met het op 12 november vastgelegde besluit; severity staat nog op `warning`, terwijl het gebruikersbesluit `info` is. |

**Correctiepunt:** de vier temperatuurconfiguraties moeten qua severity naar `info`. De oude mappingnotitie waarin voor deze meldingen <16 °C staat, is achterhaald door de latere, expliciete migratiebesluiten in de meldingeninventarisatie: de huidige afgesproken grens is <12 °C. De vier bestaande JSON-bestanden gebruiken die <12 °C al.

## 2. Goedgekeurde meldingen die nog geen productie-JSON hebben

| Melding / onderdeel | Bevestigde bron of logica | Nog te doen / aandachtspunt |
|---|---|---|
| CO₂ woonkamer hoog! | Multisensor woonkamer `2c7a4148-1042-4dd5-80d4-81d07bcf66ed`, `measure_co2 >1200`, severity `warning` | Productieconfiguratie maken; de huidige Logic-testmelding apart als test behouden of later verwijderen. |
| Kans op neerslag | Raamsdonksveer `b2fa37bb-45e2-4fda-87b7-24dcecf64420`, `measure_precipitation_probability >25`, severity `info` | JSON maken. |
| Vriezer keuken warm! | Koelkast keuken temperatuur `64fc846e-01b0-438a-9114-4498ea8005e7`, `measure_temperature >10`, severity `critical` | JSON maken. 10 °C is een expliciet migratiebesluit, niet een waarde uit de YAML. |
| Wateralarm wasmachines! | Water Sensor wasmachines `8fbc6198-191f-4bdd-bc40-a09158441d2f`, `alarm_water`, severity `critical` | JSON maken; behoud de exacte oorspronkelijke YAML-trigger. |
| Wateralarm vaatwasser! | Water sensor vaatwasser `5ae0730c-27ca-4559-b1f2-ffeba8fb1565`, `alarm_water`, severity `critical` | JSON maken; behoud de exacte oorspronkelijke YAML-trigger. |
| Voordeur open | Voordeur `ae20dbd0-2b61-4f46-9638-c2a38cd2f2e6`, `alarm_contact`, severity `warning` | JSON maken na controle van de exacte YAML-conditie. |
| Deur tuinhuis open | Deur tuinhuis `0f02abca-04cb-405a-b7d1-437cf2b4c050`, `alarm_contact`, severity `warning` | JSON maken na controle van de exacte YAML-conditie. |
| Grote Bram | Kandidaat: Onder raam Bram; eerdere mapping bevatte meer dan één mogelijke raampositie | Exacte HA-entity-/devicekoppeling bevestigen vóór JSON. |
| Grote Tess | Kandidaat: Onder raam Tess | Exacte HA-entity-/devicekoppeling bevestigen vóór JSON. |
| Grote Ouders open | Bovenraam ouderslaapkamer en onderraam ouderslaapkamer zijn afzonderlijke Homey-apparaten | Exacte YAML-bron bevestigen vóór JSON. |
| Raam Sem open | Raam Sem en Dakraam Sem zijn afzonderlijke Homey-apparaten | Exacte YAML-bron bevestigen vóór JSON. |
| Raam Tess niet open | Boven raam Tess is kandidaat | Exacte YAML-conditie en schema controleren; JSON moet zelfstandig bewerkbaar zijn. |
| Raam Bram niet open | Bovenraam Bram is kandidaat | Exacte YAML-conditie en schema controleren. |
| Raam ouders niet open | Bovenraam ouderslaapkamer is kandidaat | Exacte YAML-conditie en schema controleren. |
| Dakraam Sem niet open | Dakraam Sem is kandidaat | Exacte YAML-conditie en schema controleren. |
| Truus wil opgehaald worden! | Truus `1f76bd9a-b6f6-4f78-8734-742b9d054cfc`, `measure_work_status == Standby`, severity `warning` | JSON maken; actuele enum-/statuswaarde bij live bron valideren. |
| Muurtablet-batterij laag | Muur tablet `3047fdb8-2dea-4cea-b023-27c9693b4635`, `measure_battery <25`, severity `warning` | JSON maken. |
| Tuinhuislamp te lang aan | Aan-voorwaarde langer dan 5 minuten, severity `info` | Exact Homey-apparaat/capability nog bevestigen; duur als configureerbare duration-node opslaan. |
| Lamp Sem staat aan | Lamp Sem `b164e453-6fba-4d9c-81ba-82596082eef5`, `onoff`, severity `info` | YAML-schema `slapen_sem` en eerdere keuze om slaap-/schema-afhankelijkheid niet te migreren met elkaar verzoenen vóór JSON. |
| Lamp Bram staat aan | Lamp Bram `489075ba-fe6d-4b15-9e33-8a7539dafbda`, `onoff`, severity `info` | YAML-schema `slapen_bram` en eerdere keuze om slaap-/schema-afhankelijkheid niet te migreren met elkaar verzoenen vóór JSON. |

## 3. Conditionele statuskaarten – geen notificatie-JSON

Deze onderdelen zijn wel onderdeel van de dashboardmigratie, maar zijn status-/informatiekaarten en niet automatisch meldingen in `config/notifications/`:

- Droger: Samsung wasdroger `134d7e99-5067-4891-bb1e-222d1e970222`; `localthings_machine_state`, `localthings_progress`, `localthings_remaining_minutes`. Alleen zichtbaar bij actieve status; eindtijdweergave moet nog worden uitgewerkt.
- Truus normale status: `measure_work_status`; zichtbaar behalve bij `Sleeping`, `Charging`, `Unavailable` en `Standby`.
- Remeha: `boiler_state` en `DHW_state`; uitsluitend deze twee statuswaarden tonen.
- Airco keuken: `835913ba-2608-45be-bc69-c1f7f5441be3`; `onoff`, `thermostat_mode`, `target_temperature`.
- Airco zolder: `746e2538-bf25-45b0-8e98-3e0100bff811`; `onoff`, `thermostat_mode`, `target_temperature`.

## 4. Nog te verifiëren vóór configuratie

1. Vergelijk de exacte oorspronkelijke YAML-entiteiten en condities voor de zes directe contactmeldingen met de actuele Homey-contactapparaten. Gebruik geen naamgebaseerde gok wanneer bovenraam/onderraam of raam/dakraam kan worden verward.
2. Haal de exacte oorspronkelijke YAML-voorwaarden en dagen/tijden op voor de vier raam-niet-open-meldingen en controleer hoe `schedule.boven_ramen_open` daarin wordt toegepast.
3. Bevestig het Homey-apparaat en de capability voor de tuinhuislamp.
4. Bevestig de gewenste behandeling van `slapen_sem` en `slapen_bram`: de eerdere mappingnotitie zegt dat deze schema's niet worden gemigreerd, terwijl de meldingenmatrix de oorspronkelijke combinatie met een actief slaapschema noemt.
5. Valideer de Truus-statuswaarden aan de actuele Homey-bron voordat de vergelijking `Standby` wordt vastgelegd.
6. Werk de vier bestaande temperatuurconfiguraties bij naar severity `info`; maak de productie-CO₂-configuratie op basis van de echte sensor.

## 5. Voorgestelde implementatievolgorde

1. Los eerst de open bron-/YAML-mappings uit sectie 4 op.
2. Corrigeer de severity van de vier bestaande temperatuurconfiguraties en maak de productie-CO₂-configuratie.
3. Voeg de eenduidig bevestigde water-, vriezer-, regen-, batterij- en Truus-meldingen toe.
4. Voeg de contact- en raamregels toe zodra de exacte YAML-bronrelaties zijn bevestigd.
5. Voeg duur- en tijdschema-meldingen toe zodra de bijbehorende bron en oorspronkelijke voorwaarden zijn gevalideerd.
6. Valideer alle JSON-bestanden tegen schemaVersion 1 en voer de volledige tests/build uit.
7. Pas daarna Blockly als editor op hetzelfde JSON-model toe.

**Belangrijk:** de JSON-inventarisatie is een voortgangsaudit, geen toestemming om open voorwaarden zelf in te vullen. Onbevestigde mapping blijft expliciet open.
