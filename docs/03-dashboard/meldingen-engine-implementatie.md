# Meldingen-engine – implementatiestatus

**Branch:** `phase_1_foundation`  
**Bijgewerkt:** 13 november 2026

## Doelarchitectuur

Homey Pro 2023 levert uitsluitend actuele bronwaarden. Homey Dashboard beheert de meldingsregels, evalueert de voorwaarden en bepaalt of een melding zichtbaar is. Blockly wordt de visuele editor voor hetzelfde versiebeheerde JSON-model dat de backend valideert en uitvoert. Er komt geen tweede evaluator in Blockly.

## Eerste backendstap – uitgevoerd

De evaluator in `src/server/notifications.ts` gebruikt uitsluitend het canonieke schemaVersion 1-model: een expliciete conditieboom met comparison-, AND/OR-, duration- en schedule-nodes. Oude legacy-vormen worden niet ondersteund.

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


## Canoniek configuratiemodel – schemaVersion 1 (13 november 2026)

Het project is nog in de ontwikkelfase. De gebruiker heeft expliciet besloten geen legacy-formaat of tussentijdse versies te bewaren. De structuur die eerder als schemaVersion 2 was ontworpen, wordt daarom het enige schemaVersion 1-model.

- Het contract staat in `docs/04-configuratie/schemas/notification-v1.schema.json`.
- Iedere melding bevat één expliciete conditieboom.
- Vergelijkingsbladen zijn `type: "comparison"` en bevatten `source` en `condition`.
- Bronnen gebruiken uitsluitend stabiele Homey device-ID + capability-ID of Logic variable-ID.
- AND/OR, duration en schedule zijn composable nodes.
- De backend valideert en evalueert rechtstreeks dit model. Er is geen normalisatie- of compatibiliteitslaag.
- Logic-variabelen worden uitsluitend op stabiele ID opgevraagd; naamgebaseerde lookup is verwijderd.
- SchemaVersion 2 wordt niet meer geaccepteerd of gebruikt.

De zes bestaande ontwikkelconfiguraties zijn uitsluitend hernummerd van schemaVersion 2 naar schemaVersion 1; hun conditieboom en inhoud zijn niet aangepast. Dit is geen migratie van oude configuraties, maar het vastleggen van het enige model dat we tijdens ontwikkeling gaan gebruiken.

De validator- en regressietests zijn aangepast om uitsluitend het canonieke schema te accepteren en legacy-vormen, Logic-namen en schemaVersion 2 expliciet af te wijzen. Blockly wordt rechtstreeks op dit schema gebouwd; JSON-configuratie, Blockly en backend delen één model en één evaluator.


## Herstel JSON-opslag van meldingsconfiguraties – 13 november 2026

Een fout in de serializer voegde de twee letterlijke tekens `\\n` toe achter het JSON-document, in plaats van een echte regeleinde. Daardoor kon de instellingen-API een eerder opgeslagen `data/notifications.json` niet meer parsen en bleef de meldingenkeuzelijst leeg.

De serializer schrijft nu een normale newline. De reader herkent daarnaast uitsluitend deze bekende foutieve suffix en verwijdert die vóór het parsen, zodat bestaande configuraties behouden blijven. Andere ongeldige trailing data blijft een parsefout geven. Regressietests dekken normale JSON, herstel van de oude suffix en afwijzing van willekeurige extra tekst.


## Instelbaar meldingsniveau in de Blockly-instellingen – 13 november 2026

Bij de geselecteerde melding toont de editor nu het label **Huidig niveau** met een keuzelijst voor de drie ondersteunde niveaus: `critical`, `warning` en `info`. De zichtbare namen komen uit de Nederlandse en Engelse i18n-bestanden. De selectie wijzigt het `severity`-veld van de geselecteerde configuratie en wordt met dezelfde Opslaan-actie als de overige meldingseigenschappen opgeslagen.

De badge naast de keuzelijst toont direct de geselecteerde waarde en gebruikt de bestaande afgesproken severity-kleuren en CSS-tokens: kritisch rood, waarschuwing amber/geel en informatie neutraal. De keuze blijft onderdeel van het canonieke meldingsconfiguratiebestand; er is geen aparte opslagroute.


## Blockly – bronvalidatie en foutmeldingen (13 november 2026)

De meldingeneditor controleert de bronverwijzingen van de geselecteerde melding tegen de actuele Homey-broncatalogus. Verwijzingen naar niet meer bestaande apparaten, ontbrekende capabilities en niet meer bestaande Logic-variabelen worden afzonderlijk benoemd in een waarschuwing boven de Blockly-werkruimte. Een bestaand maar momenteel niet beschikbaar apparaat wordt eveneens expliciet genoemd. Zo is zichtbaar welke bron hersteld moet worden, in plaats van alleen een generieke melding dat Homey-bronnen ontbreken.

Validatiefouten die tijdens het bewerken van Blockly ontstaan, worden buiten de Blockly-werkruimte weergegeven, maar blijven binnen de kaart van de meldingeneditor. De Blockly-kaart zelf bevat daardoor alleen de werkruimte en de eigen werkbalk.


## Homey-bron zoeken in Blockly (13 november 2026)

De keuzelijsten voor Homey-apparaten, capabilities en Logic-variabelen in Blockly hebben een zoekveld bovenaan gekregen. Het zoekveld filtert live op de zichtbare bronnaam en de onderliggende bron-ID. De lijst toont het aantal resultaten en een duidelijke lege status wanneer niets overeenkomt. De bediening volgt dezelfde visuele aanpak als de zoekbare Homey Flow-keuze bij Snelle acties.

## Blockly-vergelijkingsveld synchroniseren bij het laden (13 november 2026)

Bij het opnieuw opbouwen van bestaande meldingsvoorwaarden wordt het vergelijkingsveld nu expliciet afgestemd op het datatype van de gekozen Homey-bron. Dit gebeurt direct tijdens het hydrateren van het Blockly-blok, niet uitsluitend via het asynchrone `SOURCE`-wijzigingsevent.

Daarmee wordt voorkomen dat een oude numerieke waarde (bijvoorbeeld `24`) tijdelijk in een boolean-dropdown met alleen `false` en `true` terechtkomt. Het vergelijkingsveld wordt eerst opnieuw aangemaakt als numeriek veld of boolean-keuzelijst en krijgt daarna een voor dat datatype geldige waarde. Dit voorkomt ook Blockly-consolewaarschuwingen over waarden die niet in de dropdown-opties voorkomen.

Dezelfde synchronisatie wordt gebruikt wanneer de gebruiker tijdens het bewerken een andere bron selecteert. De JSON-structuur van meldingsvoorwaarden en de backendvalidatie blijven ongewijzigd.


## Meldingen individueel in- en uitschakelen (13 november 2026)

Elke melding heeft een eigen `enabled`-schakelaar in de editor. De bestaande configuratie-eigenschap wordt via dezelfde Opslaan-actie bewaard. Uitgeschakelde meldingen worden door de meldingenengine niet geëvalueerd en leveren geen dashboardmelding of her-evaluatietimer op. Ook de instellingencontrole op ontbrekende/niet-beschikbare Homey-bronnen slaat uitgeschakelde meldingen over. Zodra een melding weer wordt ingeschakeld, wordt zij opnieuw meegenomen in de broncontrole en de eerstvolgende engine-evaluatie; bestaande bronproblemen verschijnen dan opnieuw. De Blockly-voorwaarde en overige instellingen blijven behouden wanneer een melding wordt uitgeschakeld.


## Opslaan bepaalt wanneer in-/uitschakelen actief wordt (13 november 2026)

De schakelaar voor een melding wijzigt eerst alleen de lokale conceptconfiguratie (`configs`). De Homey-broncontrole en de zichtbare foutmeldingen zijn bewust gebaseerd op de laatst opgeslagen configuratie (`saved`), niet op conceptwijzigingen. Pas na een succesvolle POST op Opslaan worden `configs` en `saved` gelijkgetrokken; dan verandert ook de broncontrole. Navigeren tussen meldingen zonder op te slaan laat de bestaande foutmeldingen dus ongewijzigd. Bij een mislukte save blijft de opgeslagen situatie leidend. Hierdoor wordt een melding pas daadwerkelijk uitgeschakeld of ingeschakeld nadat de gebruiker Opslaan heeft bevestigd.


## Genereer melding beschikbaar in de Blockly-toolbox (13 november 2026)

De vaste hoofdconstructie `Genereer melding` is nu ook als sleepbaar blok beschikbaar in de toolbox onder de categorie **Melding**. De reeds aanwezige hoofdconstructie in het werkveld blijft automatisch aangemaakt en vergrendeld; de toolboxvariant is verplaatsbaar en verwijderbaar. Daarmee blijft het bestaande model met één vaste root behouden, terwijl de gebruiker de hoofdconstructie ook vanuit de toolbox kan herkennen en pakken. De workspacevalidatie telt expliciet het aantal rootblokken: zodra meer dan één `Genereer melding`-blok in het werkveld staat, wordt een duidelijke fout getoond en wordt de ongeldige Blockly-structuur niet naar de meldingsconfiguratie geschreven. De gebruiker kan het extra blok verwijderen; de bestaande hoofdconstructie en voorwaarden blijven intact.


## Bevestiging bij verlaten van onopgeslagen meldingswijzigingen (13 november 2026)

De meldingeneditor meldt zijn dirty-status aan de instellingencontainer. Bij het wisselen naar een andere melding wordt eerst om bevestiging gevraagd als de huidige conceptconfiguratie afwijkt van de laatst opgeslagen configuratie. Annuleren houdt de gebruiker in dezelfde melding en behoudt alle conceptwijzigingen. Bevestigen gooit de conceptwijzigingen weg en opent de gekozen melding met de laatst opgeslagen gegevens. Hetzelfde bevestigingsprincipe geldt bij navigeren naar een andere instellingenpagina of terug naar het dashboard. Opslaan blijft de enige manier om wijzigingen permanent te maken.


## Browser-terugknop en onopgeslagen meldingswijzigingen (13 november 2026)

Ook browsernavigatie via Back (inclusief de fysieke Backspace-/terugknop waar de browser die als geschiedenisnavigatie behandelt) wordt bewaakt. Omdat een `popstate`-navigatie niet rechtstreeks geannuleerd kan worden, wordt de huidige geschiedenispositie eerst hersteld. Daarna verschijnt dezelfde bevestiging als bij interne navigatie. Annuleren houdt de gebruiker op de huidige route met alle conceptwijzigingen intact. Bevestigen voert de oorspronkelijke terugnavigatie alsnog uit en verwerpt de niet-opgeslagen wijzigingen. De dirty-status wordt vanuit de meldingeneditor aan de router doorgegeven.


## Instelbare timeout voor tijdelijke dashboard-foutmeldingen (13 november 2026)

Onder **Instellingen → Algemeen → Meldingen** is de instelling **Timeout automatisch verbergen** toegevoegd met de keuzes nooit, 1 s, 2 s, 5 s, 10 s, 30 s, 1 min, 5 min, 15 min en 30 min. De waarde wordt persistent opgeslagen in `data/settings.json`, met `never` als terugvalwaarde voor bestaande configuratiebestanden. De backend valideert de toegestane waarden. De dashboardclient leest de instelling via het publieke taal-/voorkeuren-endpoint en past deze toe op tijdelijke foutmeldingen van Quick Actions (bijvoorbeeld een Homey/Z-Wave-apparaat dat niet reageert). Bij een nieuwe foutmelding start de timeout opnieuw; bij `never` blijft de foutmelding staan. Actieve Homey-conditiemeldingen in het meldingenpaneel worden bewust niet automatisch verborgen: die blijven zichtbaar zolang hun voorwaarde actief is. De instelling en toelichting zijn via i18n beschikbaar in Nederlands en Engels.


## Handmatig sluiten en meerdere tijdelijke foutmeldingen (13 november 2026)

Tijdelijke foutmeldingen van dashboardacties worden bijgehouden als afzonderlijke records met een unieke ID, bron (`quick-action`), bericht, aanmaaktijd en status. De statussen zijn `active`, `dismissed` en `expired`. Alleen actieve meldingen worden getoond. Elke zichtbare melding heeft een eigen sluitknop (×), die de status op `dismissed` zet, onafhankelijk van de ingestelde automatische timeout. De timeout zet een actieve melding op `expired`; bij instelling `never` gebeurt dat niet. Meerdere foutmeldingen kunnen naast elkaar blijven bestaan en worden afzonderlijk beheerd. De client bewaart maximaal 50 records in de sessiestatus; oudere records worden bij nieuwe meldingen uit de lijst verwijderd. De sluitknop heeft een toegankelijke, vertaalde naam in Nederlands en Engels. Dit datamodel vormt een basis om later andere bronnen en meldingstypen toe te voegen.
