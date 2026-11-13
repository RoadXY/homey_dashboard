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
| `lamp-sem-aan.json` | Lamp Sem `onoff == true` én leeg schema `slapen_sem` | Nieuw toegevoegd; schema is bewust ongeconfigureerd en blijft inactief totdat het via Blockly wordt ingesteld. |
| `lamp-bram-aan.json` | Lamp Bram `onoff == true` én leeg schema `slapen_bram` | Nieuw toegevoegd; schema is bewust ongeconfigureerd en blijft inactief totdat het via Blockly wordt ingesteld. |
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
| Grote Bram | Onder raam Bram `952d6163-bda4-44ae-a346-7fbf7e980dbc`, `alarm_contact == true` | Bron nu bevestigd door vergelijking van de exacte HA-entity met de actuele Homey-apparaatlijst. |
| Grote Tess | Onder raam Tess `f929115b-18d9-41bb-bf67-e9a633f00ee7`, `alarm_contact == true` | Bron nu bevestigd. |
| Grote Ouders open | Ouderslaapkamer onderraam `129f22a4-1f01-420c-a1a9-c41a25c6c46d`, `alarm_contact == true` | De YAML-entity verwijst expliciet naar het onderraam; niet verwisselen met het bovenraam. |
| Raam Sem open | Raam Sem `f5a84ac4-1819-49ad-823f-c473c03b6043`, `alarm_contact == true` | De YAML-entity verwijst naar Raam Sem; niet naar Dakraam Sem. |
| Raam Tess niet open | Boven raam Tess `68528dbf-b2cb-49dc-89e6-0425cbd7db97`, `alarm_contact == false` | Bron bevestigd. Voorwaarden omvatten schema, airco-modus, buitentemperatuur en de nog niet gemapte zon-op-raam-conditie. |
| Raam Bram niet open | Bovenraam Bram `7972a10c-da9b-4d15-b4eb-305d9cb097e3`, `alarm_contact == false` | Bron bevestigd. Behoud daarnaast schema bovenramen en gevoelstemperatuur <18 °C. |
| Raam ouders niet open | Bovenraam ouderslaapkamer `3c8d2ab7-bc67-4d4d-a92d-4c66c9338f6b`, `alarm_contact == false` | Bron bevestigd. Behoud daarnaast schema bovenramen en gevoelstemperatuur <18 °C. |
| Dakraam Sem niet open | Dakraam Sem `d1ef5cbd-ba35-48b7-8219-0112403c80bf`, `alarm_contact == false` | Bron bevestigd. Behoud daarnaast schema, weersstatusuitsluitingen, airco-modus en neerslag <0,1. |
| Truus wil opgehaald worden! | Truus `1f76bd9a-b6f6-4f78-8734-742b9d054cfc`, `measure_work_status == Standby`, severity `warning` | JSON maken; actuele enum-/statuswaarde bij live bron valideren. |
| Muurtablet-batterij laag | Muur tablet `3047fdb8-2dea-4cea-b023-27c9693b4635`, `measure_battery <25`, severity `warning` | JSON maken. |
| Tuinhuislamp te lang aan | Tuinhuis lamp `c9ad4266-3ead-4dfa-ac48-c4ecbe4554c6`, `onoff == true` gedurende 5 minuten, severity `info` | Bron en capability zijn in de actuele Homey-lijst bevestigd; duur als configureerbare duration-node opslaan. |
| Lamp Sem staat aan | Lamp Sem `b164e453-6fba-4d9c-81ba-82596082eef5`, `onoff` én schema `slapen_sem`, severity `info` | Gebruikersbesluit 13 november: het schema moet worden gereproduceerd en als configureerbare Blockly-bouwsteen beschikbaar zijn. Exacte weekplanning nog uit de oorspronkelijke HA-helper vaststellen. |
| Lamp Bram staat aan | Lamp Bram `489075ba-fe6d-4b15-9e33-8a7539dafbda`, `onoff` én schema `slapen_bram`, severity `info` | Gebruikersbesluit 13 november: het schema moet worden gereproduceerd en als configureerbare Blockly-bouwsteen beschikbaar zijn. Exacte weekplanning nog uit de oorspronkelijke HA-helper vaststellen. |

## 3. Conditionele statuskaarten – geen notificatie-JSON

Deze onderdelen zijn wel onderdeel van de dashboardmigratie, maar zijn status-/informatiekaarten en niet automatisch meldingen in `config/notifications/`:

- Droger: Samsung wasdroger `134d7e99-5067-4891-bb1e-222d1e970222`; `localthings_machine_state`, `localthings_progress`, `localthings_remaining_minutes`. Alleen zichtbaar bij actieve status; eindtijdweergave moet nog worden uitgewerkt.
- Truus normale status: `measure_work_status`; zichtbaar behalve bij `Sleeping`, `Charging`, `Unavailable` en `Standby`.
- Remeha: `boiler_state` en `DHW_state`; uitsluitend deze twee statuswaarden tonen.
- Airco keuken: `835913ba-2608-45be-bc69-c1f7f5441be3`; `onoff`, `thermostat_mode`, `target_temperature`.
- Airco zolder: `746e2538-bf25-45b0-8e98-3e0100bff811`; `onoff`, `thermostat_mode`, `target_temperature`.

## 4. Nog te verifiëren vóór configuratie

1. De zes directe contactmeldingen zijn op basis van de exacte YAML-entity-ID's en de actuele Homey-apparaatlijst gemapt. Gebruik de in sectie 2 vastgelegde IDs; verwissel geen bovenraam/onderraam of Raam Sem/Dakraam Sem.
2. De vier raam-niet-open-meldingen hebben eveneens een gemapte contactbron. De resterende mappingpunten zitten in aanvullende voorwaarden: de zon-op-raam-conditie bij Tess en het exacte gedrag van de Homey-airco-/weercapabilities.
3. Tuinhuis lamp is bevestigd als `c9ad4266-3ead-4dfa-ac48-c4ecbe4554c6` met capability `onoff`.
4. De eerdere keuze om `slapen_sem` en `slapen_bram` niet te migreren is op 13 november expliciet vervangen: beide schema's moeten worden gereproduceerd en via Blockly instelbaar zijn. Haal de exacte weekdagen, tijden en eventuele uitzonderingen uit de oorspronkelijke HA-helperconfiguratie; neem niet automatisch de tijden van `boven_ramen_open` over.
5. Truus heeft `measure_work_status`; de actuele waarde was `Sleeping`. De enumwaarden moeten worden gecontroleerd tegen de Homey-capabilitymetadata voordat de vergelijking `Standby` wordt vastgelegd.
6. Werk de vier bestaande temperatuurconfiguraties bij naar severity `info`; maak de productie-CO₂-configuratie op basis van de echte sensor.
7. Breid het generieke Blockly-tijdschemaontwerp uit zodat `boven_ramen_open`, `slapen_sem` en `slapen_bram` allemaal met dezelfde herbruikbare blokvorm kunnen worden gemodelleerd, maar elk een onafhankelijke schema-instantie en eigen planning behouden.

### Actuele read-only controle (13 november 2026)
De apparaatlijst is opnieuw rechtstreeks uit Homey gelezen. De IDs hierboven zijn de actuele waarden uit deze controle. De momentopnamen (`alarm_contact`, `alarm_water`, temperaturen, batterij en werkstatus) zijn uitsluitend diagnostisch en worden niet als configuratie gebruikt. Deze controle corrigeert een oudere notitie waarin voor Onder raam Bram een afwijkend ID was vastgelegd: gebruik het actuele ID `952d6163-bda4-44ae-a346-7fbf7e980dbc`.

## 5. Voorgestelde implementatievolgorde

1. Los eerst de open bron-/YAML-mappings uit sectie 4 op.
2. Corrigeer de severity van de vier bestaande temperatuurconfiguraties en maak de productie-CO₂-configuratie.
3. Voeg de eenduidig bevestigde water-, vriezer-, regen-, batterij- en Truus-meldingen toe.
4. Voeg de contact- en raamregels toe zodra de exacte YAML-bronrelaties zijn bevestigd.
5. Voeg duur- en tijdschema-meldingen toe zodra de bijbehorende bron en oorspronkelijke voorwaarden zijn gevalideerd.
6. Valideer alle JSON-bestanden tegen schemaVersion 1 en voer de volledige tests/build uit.
7. Pas daarna Blockly als editor op hetzelfde JSON-model toe.

**Belangrijk:** de JSON-inventarisatie is een voortgangsaudit, geen toestemming om open voorwaarden zelf in te vullen. Onbevestigde mapping blijft expliciet open.


## 6. Aanvullend gebruikersbesluit – slaaplichtschema's ook migreren (13 november 2026)

De eerdere mappingnotitie dat `schedule.slapen_sem` en `schedule.slapen_bram` niet zouden worden gemigreerd, is hiermee vervallen. De gebruiker bevestigt dat **beide schema's ook in Blockly nagemaakt en configureerbaar moeten kunnen worden**.

- **Lamp Sem staat aan** blijft afhankelijk van zowel `Lamp Sem.onoff == true` als het actieve schema `slapen_sem`.
- **Lamp Bram staat aan** blijft afhankelijk van zowel `Lamp Bram.onoff == true` als het actieve schema `slapen_bram`.
- De twee slaapvensters worden als afzonderlijke schema-instanties opgeslagen. Een wijziging aan het schema van Sem mag dat van Bram niet wijzigen en andersom.
- Gebruik dezelfde generieke Blockly-bouwsteen en backend-schema-evaluator als voor `boven_ramen_open`; er komt geen aparte slaap-schema-evaluator.
- De bestaande planning van `boven_ramen_open` mag niet als standaard voor de slaapvensters worden gekopieerd. De gebruiker configureert de weekdagen en tijden van `slapen_sem` en `slapen_bram` later zelf in Blockly; er is geen bronplanning nodig. Nieuwe schema-instanties starten leeg/inactief om onbedoelde meldingen te voorkomen.
- De gebruiker stelt de weekdagen en tijden van beide slaap-schema's later zelf in via Blockly. Er hoeft dus geen oorspronkelijke HA-weekplanning meer te worden opgehaald. Maak de schema-instanties wel aan, maar start ze zonder geselecteerde actieve dagen (dus standaard inactief) totdat de gebruiker ze configureert. De lampmeldingen kunnen daarna als JSON-configuraties worden aangemaakt.


## 7. Aanvullend besluit – slaap-schema's later zelf configureren (13 november 2026)

De gebruiker geeft aan de weekdagen en tijden van `slapen_sem` en `slapen_bram` later zelf in te stellen. De oorspronkelijke HA-helperinstellingen hoeven hiervoor niet meer te worden opgezocht.

- Twee afzonderlijke meldings-JSON's zijn aangemaakt: `lamp-sem-aan.json` en `lamp-bram-aan.json`.
- Beide bevatten een eigen ongeconfigureerde schema-node (`configured: false`, `weekdays: []`) en zijn daardoor standaard inactief totdat de gebruiker ze instelt.
- De backend valideert deze lege vorm en evalueert deze als `inactive`; er wordt geen volgende tijdgrens ingepland.
- De gebruiker kan de weekdagen en begin-/eindtijden later onafhankelijk via Blockly aanpassen.
- De voorwaarden blijven: Lamp Sem aan én `slapen_sem` actief; Lamp Bram aan én `slapen_bram` actief.
- Kopieer geen tijden van `boven_ramen_open` naar de slaap-schema's.
- GitHub Actions is geslaagd voor beide nieuwe configuratiebestanden: runs [43382190242](https://github.com/RoadXY/homey_dashboard/actions/runs/43382190242) en [43382195856](https://github.com/RoadXY/homey_dashboard/actions/runs/43382195856).
