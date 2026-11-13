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

## CI-correctie – 13 november 2026

De eerste integratiecommit faalde in de TypeScript-build doordat TypeScript de nieuwe condition-node union niet voldoende kon vernauwen. Dit is opgelost in commit `abcba40705c6362c4f6cabb81652b3b544ef5434` door expliciete discriminant-controles toe te passen. De GitHub Actions-run voor die correctie is volledig geslaagd (build inclusief TypeScript-compilatie).

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


## Validatie-aanscherping – 13 november 2026

Na de eerste integratie is de backendvalidatie aangescherpt voordat de Blockly-editor wordt gebouwd:

- De tijdnotatiecontrole voor schema's is gecorrigeerd naar strikte 24-uursnotatie `HH:mm`; geldige waarden zoals `07:00` worden nu geaccepteerd.
- Tijdzones worden bij configuratievalidatie gecontroleerd door de runtime. Onbekende IANA-tijdzones worden afgewezen in plaats van pas tijdens evaluatie een ongeldige meldingstoestand te veroorzaken.
- Condition-bomen zijn begrensd op maximaal 12 niveaus en 100 nodes om onbedoeld extreem diepe/grote configuraties te blokkeren.
- Duurblokken binnen één melding moeten unieke, niet-lege IDs hebben.
- De volledige meldingsconfiguratie wordt nu als onbekende invoer gevalideerd, inclusief verplichte tekstvelden, severity, enabled en optionele testOnly. Zowel legacy-configuraties als het nieuwe boommodel blijven ondersteund.
- Hiervoor zijn gerichte tests toegevoegd voor geldige schema's, ongeldige tijden/tijdzones, dubbele duur-IDs, maximale diepte en legacy-/boomconfiguraties.

De code staat in commits `5a6f3a3`, `0d6b8be` en `24fabc3`. De GitHub Actions-builds voor deze wijzigingen zijn geslaagd. Tijdens controle bleek dat de CI-workflow nog geen `npm test` uitvoerde; daarom is commit `f4263a7` toegevoegd om voortaan ook de volledige Vitest-suite in CI te draaien. De eerste run met de nieuwe teststap faalde omdat Vitest door de Vite-clientroot alleen in `src/client` zocht. In commit `3677451` is daarom een aparte `vitest.config.ts` toegevoegd die tests uit zowel `src/server` als `src/client` ontdekt. De daaropvolgende volledige CI-run is geslaagd: 17 tests groen, OpenAPI-validatie geslaagd (met alleen waarschuwingen) en de build geslaagd. Ook de daaropvolgende documentatiecommit heeft een groene CI-run.


## Typeveilige bronvergelijkingen – 13 november 2026

Bij de voorbereiding op Blockly is een validatiegat gevonden: de validator accepteerde bijvoorbeeld een numerieke vergelijking op een boolean-bron, of een boolean-waarde bij een numerieke bron. De evaluator zou zulke configuraties niet op een betekenisvolle manier kunnen activeren.

De validator controleert nu ook de combinatie van bron en vergelijking:
- `equals` vereist een vergelijkingswaarde van exact hetzelfde type als de bron (`boolean` of `number`).
- `lessThan` en `greaterThan` zijn uitsluitend toegestaan voor numerieke bronnen.
- Deze controle geldt zowel voor het bestaande legacy-formaat als voor bladeren in de geneste conditieboom.

Er zijn regressietests toegevoegd voor geldige en ongeldige combinaties in beide configuratievormen. De wijziging staat in commits `e8d0fe7` en `478e679`; de GitHub Actions-run moet nog worden gecontroleerd.


## Automatische herbeoordeling van duurvoorwaarden – 13 november 2026

Bij controle van de werkelijke dashboard-updatecyclus bleek dat meldingen alleen opnieuw werden opgehaald bij een Homey-event. Een duurvoorwaarde kon daardoor na het verstrijken van de ingestelde tijd blijven hangen op `inactive` zolang er geen nieuw Homey-event kwam.

Dit is opgelost zonder periodiek alle Homey-bronnen opnieuw op te vragen:
- Een actieve duurvoorwaarde geeft de backend nu ook het exacte eerstvolgende herbeoordelingstijdstip (`nextEvaluationAt`, Unix-tijd in milliseconden) terug.
- Geneste AND/OR-groepen behouden de eerstvolgende relevante deadline.
- De browser plant op basis van die deadline één gerichte nieuwe aanvraag naar `/api/notifications`.
- Na de herbeoordeling wordt zo nodig de volgende deadline gepland. Een nieuw Homey-event vervangt de bestaande timer en zorgt direct voor een verse evaluatie.
- Er wordt dus geen vaste vijfsecondenpoll voor alle meldingsbronnen toegevoegd.

De timer blijft servergeheugenstatus en wordt na een containerherstart opnieuw opgebouwd zodra de voorwaarden weer worden geëvalueerd. Persistente timers/herstel over herstarts blijven een afzonderlijk toekomstig besluit. Tests controleren dat de oorspronkelijke deadline stabiel blijft en dat geneste groepen de vroegste deadline doorgeven.

Code- en testcommits: `ba682f0`, `807a9da`, `ed2f4f0`, `2ee1c12`, `af1ae82` en `fd89ae5`. De eerste CI-runs op tussenliggende commits vonden nog oude testverwachtingen die niet waren aangepast aan het nieuwe deadlineveld. Die regressietests zijn bijgewerkt in `fd89ae5`. De volledige CI-run voor die commit is groen: alle 21 tests in 3 testbestanden geslaagd, OpenAPI-validatie geslaagd en frontend-/backendbuild geslaagd. Run: https://github.com/RoadXY/homey_dashboard/actions/runs/43374163008.


## Openstaand aandachtspunt – tijdschema-overgangen

De nieuwe automatische deadline behandelt duurvoorwaarden. Een tijdschema zelf kan ook precies op een begin- of eindtijd van status veranderen zonder Homey-event. De huidige schema-evaluator wordt bij Homey-updates opnieuw uitgevoerd; automatische herbeoordeling op schema-overgangen moet daarom nog worden toegevoegd voordat de Blockly-editor als compleet kan worden beschouwd. Dit wordt de eerstvolgende backendstap.


## Automatische herbeoordeling van tijdschema's – 13 november 2026

Tijdschema's leveren nu net als duurvoorwaarden een `reevaluateAt`-deadline op. De backend zoekt de eerstvolgende werkelijke minuut waarop de schema-uitkomst verandert en neemt die op in de bestaande `nextEvaluationAt`-planning. Daardoor worden zowel het begin als het einde van een schema automatisch verwerkt, ook wanneer Homey geen event verstuurt.

De berekening gebruikt de ingestelde IANA-tijdzone en doorloopt werkelijke tijdstippen per minuut. Hierdoor worden ontbrekende en dubbele lokale klokminuten bij zomer-/wintertijd niet als fictieve UTC-tijdstippen behandeld. Bij een schema dat over middernacht loopt, blijft de weekdag van de start leidend. Dezelfde deadline wordt doorgegeven via AND/OR-groepen en blijft ook behouden wanneer een tijdschema binnen een duurvoorwaarde zit; anders zou een reeds geactiveerde duurvoorwaarde niet op tijd kunnen stoppen wanneer het schema eindigt.

Tests toegevoegd voor start- en eindgrenzen, nachtoverschrijding, de voorjaars-DST-sprong en deadlines die door duurvoorwaarden behouden moeten blijven. Implementatiecommits: `8bab4c9`, `86e90c2`, `48bb690`, `ce13f7b` en `4c1c401`. De volledige CI-run voor `4c1c401` is geslaagd: alle tests in 3 testbestanden, OpenAPI-validatie en frontend-/backendbuild zijn groen. Run: https://github.com/RoadXY/homey_dashboard/actions/runs/43374513979.


## Canoniek configuratiemodel v2 – 13 november 2026

Het formele JSON Schema voor nieuwe meldingsconfiguraties staat in `docs/04-configuratie/schemas/notification-v2.schema.json`. Versie 2 maakt de conditieboom expliciet en vermijdt dat een legacy-configuratie met top-level `source`/vergelijking en een samengestelde conditieboom dezelfde versiewaarde delen.

V2 gebruikt:
- expliciete `type: "comparison"`-bladen met `source` en `condition`;
- geneste `and`- en `or`-groepen;
- `type: "duration"` met stabiele blok-ID en duur in milliseconden;
- `type: "schedule"` met weekdagen, begin-/eindtijd en optionele IANA-tijdzone;
- bronidentiteit via Homey device-ID + capability-ID of Logic variable-ID.

Versie 1 blijft voorlopig ondersteund. De backend moet v1-configuraties naar hetzelfde interne model normaliseren zonder bronbestanden automatisch te wijzigen. Voor Logic-variabelen moet een v1-naam via de Homey-inventarisatie naar een ID worden vertaald. Bij ontbrekende of onbereikbare broninformatie wordt geen automatische gok gedaan.

Het JSON Schema dekt de structurele vorm. De bestaande backendvalidatie blijft verantwoordelijk voor domeinregels zoals maximum 12 niveaus, maximaal 100 nodes, unieke duration-ID's, IANA-tijdzonevaliditeit en compatibiliteit tussen brontype en vergelijkingsoperator/-waarde.

**Nog niet geïmplementeerd:** v2 runtime-parser/normalisatie, v1-migratie en bijbehorende tests. De bestaande v1-configuraties blijven daarom voorlopig ongewijzigd. De Blockly-editor wordt pas op dit stabiele v2-model aangesloten.


## Backendnormalisatie schema v1/v2 – 13 november 2026

De eerste backendstap voor het versiebeheer is geïmplementeerd:

- De configuratievalidator accepteert nu versie 1 en versie 2, met verschillende vormregels. V1 blijft zowel het oudere top-level `source` + vergelijking-formaat als de eerdere samengestelde boom ondersteunen.
- V2 accepteert uitsluitend een conditieboom met expliciete `type: "comparison"`-bladen. De bron in een Logic-comparison gebruikt `variableId`; apparaatbronnen blijven `deviceId` + `capabilityId`.
- Bij het laden worden beide versies genormaliseerd naar één intern conditiemodel. Oude leaf-nodes worden intern expliciete comparison-nodes; groepen, duur- en tijdschema-nodes blijven composable.
- V1-configuraties en bronbestanden worden niet automatisch herschreven. De bestaande JSON-bestanden blijven dus ongewijzigd.
- Homey Logic kan nu zowel op naam (voor v1) als op stabiele variabele-ID (voor v2) worden opgevraagd. Een ontbrekende bron resulteert in `source_missing`; een niet-unieke v1-naam resulteert in `source_ambiguous`. Er wordt nooit stilzwijgend een willekeurige variabele gekozen.
- Device-capability-evaluatie en de bestaande duur-/schema-deadlines blijven via hetzelfde interne model lopen.

Tests toegevoegd voor v2-validatie, afwijzen van v1/v2-bronvormen in de verkeerde versie, normalisatie van beide bestaande v1-vormen en compositie van v2 comparison/duration/schedule-nodes.

**Verificatie:** GitHub Actions-run [43378301001](https://github.com/RoadXY/homey_dashboard/actions/runs/43378301001) is groen. Alle 31 tests in 3 testbestanden zijn geslaagd; OpenAPI-validatie en frontend-/backendbuild zijn eveneens geslaagd.

**Migratiestatus 13 november 2026:** de eerste zes bestaande configuraties zijn gecontroleerd gemigreerd naar schemaVersion 2: Achterdeur open, CO₂ woonkamer (test), Ouderslaapkamer koud, Slaapkamer Bram koud, Slaapkamer Tess koud en Zolder koud. De samengestelde AND/OR-boom, apparaat-ID's, capability-ID's, vergelijkingsoperatoren en drempelwaarden zijn behouden. De Logic-testbron is live in Homey geverifieerd: `dashboard_test_co2_melding`, ID `965b5973-bd5f-4843-aa6e-8f79173141af`, type boolean. De overige meldingsbestanden blijven ongewijzigd totdat hun bronmapping is gecontroleerd. Volgende stap: alle resterende configuraties inventariseren, Logic-bronnen op ID controleren en gefaseerd migreren; daarna migratietests/fixtures toevoegen.
