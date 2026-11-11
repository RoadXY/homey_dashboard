# JSON-meldingenengine – eerste CO₂-proef

**Status:** eerste implementatie op `phase_1_foundation`; functionele test op de Ubuntu-server volgt.  
**Datum:** 11 november 2026

## Doel en scope

De eerste melding bewijst de JSON-eerst-werkwijze: de dashboardserver leest een JSON-configuratie, haalt de gekozen Homey Logic-variabele read-only op en beoordeelt de voorwaarde zelf. Er wordt geen Homey Flow gestart of gewijzigd. Blockly maakt geen deel uit van deze implementatie.

## Testmelding

Configuratiebestand: `config/notifications/co2-woonkamer-test.json`

| Eigenschap | Waarde |
|---|---|
| ID | `co2-woonkamer-test` |
| Titel | CO₂ woonkamer |
| Niveau | waarschuwing (vast per melding) |
| Test | ja |
| Bron | Homey Logic-variabele `dashboard_test_co2_melding` |
| Verwacht type | boolean |
| Voorwaarde | waarde is `true` |
| Actief | `true` |
| Inactief | `false` |

Deze testvariabele staat los van de productievariabele `eco2_woonkamer_status` en van de echte CO₂-sensor. De gebruiker maakt en bedient de variabele in Homey. De dashboardapplicatie schrijft nooit naar Logic.

## Evaluatie en foutafhandeling

De server leest alle `.json`-bestanden uit `config/notifications/` in. In deze eerste proef ondersteunt de evaluator een boolean Logic-bron met een gelijkheidsvoorwaarde. De voorwaarde wordt intern in de dashboardapplicatie geëvalueerd.

De status kent drie uitkomsten:
- `active`: de boolean is geldig en voldoet aan de voorwaarde.
- `inactive`: de boolean is geldig en voldoet niet aan de voorwaarde.
- `unknown`: Homey is niet bereikbaar, de variabele ontbreekt, het type wijkt af of de waarde is ongeldig.

Een onbekende waarde wordt nadrukkelijk niet als `false` geïnterpreteerd. Alleen actieve meldingen verschijnen als waarschuwing in het dashboard. Bij een onbekende bron toont het meldingenpaneel dat de bron niet beschikbaar is.

## API

- `GET /api/notifications`: leest JSON-configuraties in en retourneert de geëvalueerde meldingsstatussen.
- De endpoint gebruikt dezelfde read-only Homey Logic-uitleesfunctie als de bestaande Logic-integratie.
- De frontend ververst meldingen eventgestuurd via SSE zodra Homey Logic een variabele-update meldt. De browser ontvangt updates via `/api/events`; zie [Realtime dashboard updates](realtime-updates.md).

## Teststappen na deploy

1. Maak in Homey de boolean `dashboard_test_co2_melding` aan.
2. Zet de variabele op `false`; de testmelding hoort niet zichtbaar te zijn.
3. Zet de variabele op `true`; de waarschuwing **TEST · WAARSCHUWING – CO₂ woonkamer** hoort kort na de Homey-update zichtbaar te worden.
4. Zet de variabele terug op `false`; de melding hoort kort na de Homey-update te verdwijnen.
5. Controleer aanvullend dat een ontbrekende of ongeldige bron als onbekend wordt getoond, niet als inactief.

## Grenzen van deze eerste versie

- Dit is een technische proef met één boolean-melding, geen volledige migratie van alle HA-kaarten.
- Numerieke vergelijkingen, AND/OR-condition trees, tijdschema's, duurvoorwaarden, prioriteitssortering en activeringstijdstippen worden in vervolgstappen toegevoegd op basis van de goedgekeurde meldingenmatrix.
- Blockly volgt pas nadat de JSON-configuraties en meldingenengine functioneel getest zijn.
- De code is naar GitHub geschreven; een Docker-build en runtime-test op de Ubuntu-server zijn nog niet uitgevoerd.


## Uitbreiding – vier slaapkamer-temperatuurmeldingen

De gebruiker heeft bevestigd dat de vier temperatuurmeldingen als volgende stap worden toegevoegd. De drempel is gecorrigeerd van 16 °C naar **lager dan 12 °C**. De voorwaarde is strikt kleiner dan 12: exact 12,0 °C activeert de melding niet.

| Melding | Homey-device-ID | Capability | Voorwaarde |
|---|---|---|---|
| Slaapkamer Bram koud | `58f20a55-90b3-49cf-9af0-53a40f6e501c` | `measure_temperature` | < 12 °C |
| Slaapkamer Tess koud | `203a126c-1923-4857-abcb-6a727a133099` | `measure_temperature` | < 12 °C |
| Ouderslaapkamer koud | `6d68c7ba-411f-47c1-9624-2f61a7006795` | `measure_temperature` | < 12 °C |
| Zolder koud | `ba9336e2-f4ed-417c-bba6-3fafb735e61a` | `measure_temperature` | < 12 °C |

De JSON-engine ondersteunt nu zowel Homey Logic-variabelen als Homey device-capabilities als read-only bronnen en numerieke vergelijkingen `lessThan` en `greaterThan`, naast boolean/numerieke gelijkheid. Een ontbrekende, niet-beschikbare of ongeldige bron blijft `unknown` en wordt nooit als een normale temperatuur geïnterpreteerd.

De vier nieuwe JSON-configuraties zijn:
- `config/notifications/slaapkamer-bram-koud.json`
- `config/notifications/slaapkamer-tess-koud.json`
- `config/notifications/ouderslaapkamer-koud.json`
- `config/notifications/zolder-koud.json`

Na deploy moet de build en praktijktest met actuele Homey-waarden nog worden uitgevoerd.
