# Meldingen-engine – implementatiestatus

**Branch:** `phase_1_foundation`  
**Bijgewerkt:** 13 november 2026

## Doelarchitectuur

Homey Pro 2023 levert uitsluitend actuele bronwaarden. Homey Dashboard beheert de meldingsregels, evalueert de voorwaarden en bepaalt of een melding zichtbaar is. Blockly wordt de visuele editor voor hetzelfde versiebeheerde JSON-model dat de backend valideert en uitvoert. Er komt geen tweede evaluator in Blockly.

## Eerste backendstap – uitgevoerd

De bestaande evaluator in `src/server/notifications.ts` ondersteunt de bestaande JSON-configuraties (schemaVersion 1), inclusief legacy bron + vergelijking en geneste AND/OR-groepen. Deze bestaande configuraties blijven geldig.

De herbruikbare evaluatiebouwstenen staan in `src/server/notification-conditions.ts` en zijn aangesloten op de bestaande evaluator:

### Tijdschema

Een tijdschema is een boolean-voorwaarde met:
- `weekdays`: weekdagen als JavaScript-dagnummers (zondag 0 t/m zaterdag 6);
- `startTime` en `endTime`: lokale 24-uursnotatie `HH:mm`;
- optioneel `timeZone`: IANA-tijdzone, bijvoorbeeld `Europe/Amsterdam`.

Voorbeeld:

```json
{
  "type": "schedule",
  "weekdays": [1, 2, 3, 4, 5, 6],
  "startTime": "07:00",
  "endTime": "20:00",
  "timeZone": "Europe/Amsterdam"
}
```

Zondag wordt als aparte schema-instantie toegevoegd met `weekdays: [0]` en starttijd `08:00`. Een interval dat over middernacht loopt, hoort bij de dag waarop het interval start. Starttijd is inclusief; eindtijd is exclusief. De IANA-tijdzone wordt via `Intl.DateTimeFormat` toegepast, zodat zomer-/wintertijd wordt gevolgd. Als `timeZone` ontbreekt, gebruikt de server de ingestelde systeemtijdzone.

### Duurvoorwaarde

Een duurvoorwaarde vereist dat de onderliggende voorwaarde onafgebroken actief blijft gedurende `durationMs`. Elk blok heeft een stabiele, unieke `id`, zodat meerdere duurvoorwaarden binnen één melding onafhankelijk worden bijgehouden.

Voorbeeld:

```json
{
  "type": "duration",
  "id": "achterdeur-vijf-minuten",
  "durationMs": 300000,
  "condition": {
    "source": {
      "type": "device-capability",
      "deviceId": "HOMEY_DEVICE_ID",
      "capabilityId": "alarm_contact",
      "expectedType": "boolean"
    },
    "condition": { "operator": "equals", "value": true }
  }
}
```

Tijdens de wachttijd is de duurvoorwaarde `inactive`; zodra de volledige duur is verstreken wordt deze `active`. Een onderliggende `inactive`- of `unknown`-uitkomst reset de timer. De duurstatus wordt momenteel in servergeheugen bijgehouden en begint na een containerherstart opnieuw. Persistente timers en herstel na herstart zijn nog niet geïmplementeerd.

## Tests toegevoegd

- Tijdschema: start-/eindtijdgrenzen, zondagplanning, nachtoverschrijding en ongeldige invoer.
- Duur: pas actief na volledige duur, reset bij inactief/onbekend en ongeldige duur.
- De bestaande tests voor drie-waardige AND/OR-logica blijven behouden.

GitHub Actions voert na iedere commit de bestaande build- en testworkflow uit. Een commit of groene workflow betekent nog niet dat deze functies al door de Blockly-interface kunnen worden aangemaakt.

## Nog te doen

1. CI-resultaat van deze eerste backendstap controleren en eventuele fouten oplossen.
2. Het JSON-schema formeel versiebeheer geven en configuratievalidatie verder aanscherpen (inclusief maximale boomdiepte, dubbele blok-ID's en tijdzonevalidatie).
3. De Blockly-editor bouwen voor bronselectie, vergelijkingen, AND/OR, tijdschema en duur.
4. Bestaande meldingsregels stapsgewijs naar het uitgebreidere boommodel migreren en op Homey Pro 2023 praktijktesten.
5. Activeringstijdstippen, herstartgedrag en evaluatie bij tijdgrenzen verder uitwerken.
6. Externe API voor het publiceren, bijwerken en beëindigen van losse dashboardmeldingen blijft een afzonderlijk later onderdeel (fase 4).

## Belangrijke grens

De nieuwe backendbouwstenen zijn nu aangesloten op het bestaande meldingsendpoint, maar er is nog geen volledige meldingeneditor. De bestaande severity, kaartstijl, sortering en het verdwijnen van meldingen bij een inactieve voorwaarde blijven ongewijzigd.
