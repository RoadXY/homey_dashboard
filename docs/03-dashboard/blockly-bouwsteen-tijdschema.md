# Blockly-bouwsteen – tijdschema's per dashboardmelding

**Status:** backend-evaluator en eerste Blockly-tijdschema-editor geïmplementeerd; verdere condition-editor en lokale bundeling van Blockly blijven vervolgwerk  
**Scope:** generieke Blockly-bouwsteen voor `schedule.boven_ramen_open`, `schedule.slapen_sem` en `schedule.slapen_bram` uit de oorspronkelijke Home Assistant-configuratie  
**Doel:** de oorspronkelijke planning per dashboardmelding afzonderlijk vastleggen, zodat elke melding later onafhankelijk in Blockly kan worden aangepast of geïmporteerd. De evaluatielogica mag technisch wel gedeeld zijn.

## 1. Functionele bedoeling

De gebruiker heeft drie Home Assistant-schema's voor migratie aangewezen: `boven_ramen_open`, `slapen_sem` en `slapen_bram`. Ze bepalen wanneer respectievelijk raamwaarschuwingen en lampmeldingen relevant zijn. Elk schema is een eigen tijdvenster/kalenderregel; schema's mogen niet worden verward met Homey-Flow-timeoutvariabelen zoals `regen_ramenOpenTimout` of `regen_deurOpenTimeout`.

Voor `boven_ramen_open` is de weekplanning bevestigd via de Helper-instellingen: maandag t/m zaterdag 07:00–20:00 en zondag 08:00–20:00. Deze planning wordt als initiële configuratie voor de vier afzonderlijke raamregel-instanties gebruikt. De gebruiker configureert `slapen_sem` en `slapen_bram` later zelf in Blockly. Beide beginnen als lege, inactieve schema-instanties; neem geen tijden over van het bovenramenschema.

## 2. Voorgestelde Blockly-blokvorm

**Bloknaam:** `Tijdschema actief?`

Invoer/configuratie:
- Naam van het schema (bijvoorbeeld “Boven ramen open”).
- Dagen van de week (maandag t/m zondag, meerdere selecteerbaar).
- Begintijd (lokale tijd, 24-uursnotatie).
- Eindtijd (lokale tijd, 24-uursnotatie).
- Optioneel: actief vanaf / actief tot (datumgrenzen), alleen indien de oorspronkelijke HA-definitie dit vereist.
- Tijdzone: de ingestelde tijdzone van de dashboardserver/configuratie; geen handmatige vaste UTC-offset.

Uitgang:
- Boolean: `true` wanneer het schema op het huidige lokale moment actief is.
- Boolean: `false` wanneer het schema niet actief is.

## 3. Gedrag dat het blok moet ondersteunen

1. Meerdere weekdagen selecteren.
2. Begin- en eindtijd op dezelfde dag.
3. Een venster dat over middernacht loopt (bijvoorbeeld 22:00–07:00), waarbij de geselecteerde dag het startmoment bepaalt.
4. Correcte lokale tijd en zomer-/wintertijd via de ingestelde tijdzone.
5. Onafhankelijke schema-instanties: elke melding heeft een eigen schema-instelling en eigen opgeslagen configuratie. De onderliggende evaluatiecode mag gedeeld zijn, maar wijzigingen aan het ene schema veranderen de andere niet.
6. Directe evaluatie bij laden en opnieuw evalueren bij tijdgrens/daggrens; de dashboardregel hoeft niet op een Homey-Flow-event te wachten.
7. Een duidelijke Blockly-weergave van de naam en instellingen, zodat de gebruiker later zelf de tijden/dagen kan aanpassen.

## 4. Opslag en runtime

- Sla schema's op in de bestaande dashboardconfiguratie (persistent volume), niet in Homey.
- Gebruik één gedeelde schema-evaluator in de backend/regellaag; voorkom dat elke dashboardkaart eigen tijdlogica implementeert. Dit is gedeelde programmacode, geen gedeelde schema-instantie.
- Het schema is alleen een voorwaarde voor dashboardzichtbaarheid. Het start, wijzigt of activeert geen Homey-Flow.
- De schema-editor en evaluator moeten onafhankelijk blijven van de visuele kaart waarop het schema wordt gebruikt.

## 5. Acceptatiecriteria

- Een gebruiker kan het schema “Boven ramen open” in Blockly openen en wijzigen.
- De gebruiker kan weekdagen, starttijd en eindtijd aanpassen.
- Een dashboardregel kan het schema als boolean-voorwaarde gebruiken.
- Het schema blijft na containerherstart behouden.
- Het schema werkt correct over middernacht en bij zomer-/wintertijd.
- Elk van de vier raamregels heeft een eigen schema-instantie met eigen instellingen.
- `slapen_sem` en `slapen_bram` zijn elk een eigen schema-instantie voor de bijbehorende lampmelding.
- Een wijziging aan één melding wijzigt geen andere schema-instantie.
- Er worden geen Homey-apparaten of Flows aangestuurd.

## 6. Nog te bevestigen

1. Of `boven_ramen_open` datumgrenzen, uitzonderingsdagen of een andere nuance bevat naast de bevestigde weekplanning.
2. De vier raamregels krijgen elk een eigen instantie van `boven_ramen_open`; de lampregels krijgen elk hun eigen slaap-schema-instantie. De Blockly-bouwsteen blijft generiek inzetbaar.

## 7. Relatie met temperatuurregels

De vier koude-kamermeldingen hebben een aparte, expliciete voorwaarde: temperatuur **lager dan 16 °C**. Deze drempel wordt als configureerbare numerieke waarde gemodelleerd. Het tijdschema “Boven ramen open” wordt niet automatisch op de koude-kamermeldingen toegepast.


## 8. Broncontrole – 11 november 2026

De projectbaseline `ha-baseline-analyse.md` bevestigt dat `schedule.boven_ramen_open` als `on`-voorwaarde voorkomt in de meldingen:
- Raam Tess niet open
- Raam Bram niet open
- Raam Ouders niet open
- Dakraam Sem niet open

De gebruiker heeft op 11 november 2026 de volgende YAML-statusmomentopname van de entiteit aangeleverd:

```yaml
state: 'on'
last_changed: '2026-11-11T06:00:00.001Z'
last_updated: '2026-11-11T06:00:00.001Z'
attributes:
  editable: true
  next_event: '2026-11-11T20:00:00+01:00'
  icon: mdi:window-closed
  friendly_name: Boven ramen open
```

Deze momentopname bevestigt dat de entiteit op dat moment `on` was en dat Home Assistant 20:00 uur (offset `+01:00`) als volgende omschakeling rapporteerde. De statusmomentopname bevat op zichzelf geen volledig weekpatroon.

### 8.1 Terugkerende weekplanning bevestigd via Helper-instellingen

Een screenshot van de Helper-instellingen voor `schedule.boven_ramen_open`, aangeleverd door de gebruiker op 11 november 2026, toont de volgende wekelijkse tijdblokken:

| Weekdag | Start | Einde |
|---|---:|---:|
| Maandag | 07:00 | 20:00 |
| Dinsdag | 07:00 | 20:00 |
| Woensdag | 07:00 | 20:00 |
| Donderdag | 07:00 | 20:00 |
| Vrijdag | 07:00 | 20:00 |
| Zaterdag | 07:00 | 20:00 |
| Zondag | 08:00 | 20:00 |

Dit is de concrete planning die we voor de migratie aanhouden. De screenshot toont één dagelijks tijdvenster per weekdag. Er zijn in deze weergave geen aanvullende tijdvensters of datumuitzonderingen zichtbaar; eventuele elders ingestelde uitzonderingslogica is hiermee niet vastgesteld.

### 8.2 Gevolgen voor de Blockly-bouwsteen

De initiële configuratie voor de raamregels wordt vier keer afzonderlijk aangemaakt, één keer per raamregel:
- Naam: **Boven ramen open**
- Maandag t/m zaterdag: **07:00–20:00**
- Zondag: **08:00–20:00**
- Uitgang: boolean actief/inactief op basis van de lokale datum en tijd.

De evaluator moet de tijdzone van de dashboardconfiguratie gebruiken en correct omgaan met zomer-/wintertijd. De vier raamregels krijgen elk hun eigen boolean-schema-voorwaarde. Alle vier starten met dezelfde overgenomen weekplanning, maar zijn daarna onafhankelijk aanpasbaar. Het schema stuurt geen Homey-apparaten of Flows aan.

De eerder voorgestelde Blockly-bouwsteen blijft aanpasbaar: de gebruiker moet later de tijden en dagen kunnen wijzigen zonder code aan te passen.


## 9. Slaap-schema's voor lampmeldingen – gebruikersbesluit (13 november 2026)

De gebruiker bevestigt dat de twee oorspronkelijke slaap-schema's eveneens moeten worden gemigreerd en via Blockly kunnen worden nagemaakt/aangepast.

- `Lamp Sem staat aan` blijft alleen actief wanneer de lamp aan staat **en** `slapen_sem` actief is.
- `Lamp Bram staat aan` blijft alleen actief wanneer de lamp aan staat **en** `slapen_bram` actief is.
- `slapen_sem` en `slapen_bram` zijn afzonderlijke schema-instanties met eigen dagen/tijden; wijzigingen aan het ene schema beïnvloeden het andere niet.
- Beide gebruiken dezelfde generieke `Tijdschema actief?`-Blockly-bouwsteen en backend-evaluator als `boven_ramen_open`.
- De gebruiker stelt de weekdagen en tijden van beide slaap-schema's later zelf in via Blockly; de oorspronkelijke HA-helperinstellingen hoeven hiervoor niet te worden opgezocht.
- Maak beide schema-instanties aan zonder geselecteerde actieve dagen. Ze zijn daardoor standaard inactief totdat de gebruiker ze configureert; zo ontstaan geen onbedoelde lampmeldingen.
- De gebruiker kan `slapen_sem` en `slapen_bram` later onafhankelijk configureren. Kopieer geen tijden van `boven_ramen_open`.


### 9.1 Initiële configuratie van de slaap-schema's – gebruikersbesluit (13 november 2026)

De gebruiker configureert de planning van `slapen_sem` en `slapen_bram` later zelf in de dashboardinstellingen via Blockly. De schema's hoeven niet vooraf uit Home Assistant te worden overgenomen.

- Maak twee zelfstandige schema-instanties met dezelfde generieke `Tijdschema actief?`-bouwsteen.
- Start beide schema's zonder geselecteerde weekdagen; een schema zonder actieve dagen evalueert als `false`.
- De gebruiker stelt per schema de weekdagen en begin-/eindtijden in wanneer dat uitkomt.
- Een wijziging aan Sems schema heeft geen invloed op Brams schema en andersom.
- De lampmelding blijft pas actief als zowel de bijbehorende lamp aan staat als het eigen schema actief is.
- Gebruik nooit de planning van `boven_ramen_open` als impliciete standaard voor een slaap-schema.


## 10. Implementatie – backendfundament (13 november 2026)

De eerste codewijzigingen voor lege schema-instanties zijn toegevoegd op branch `phase_1_foundation`.

- Het canonieke notification-v1-model accepteert nu ook een expliciet ongeconfigureerd schema: `{ "type": "schedule", "configured": false, "weekdays": [] }`.
- Een ongeconfigureerd schema wordt door de backend als `inactive` geëvalueerd. Er wordt geen volgende tijdgrens ingepland zolang er geen weekdagen/tijden zijn ingesteld.
- Een geconfigureerd schema behoudt de bestaande validatie en evaluator: minimaal één weekdag, geldige begin-/eindtijden en optioneel een geldige IANA-tijdzone.
- Het JSON Schema en de TypeScript-validatie zijn op dit onderscheid afgestemd.
- Tests dekken de lege schema-instantie en de afwijzing van ongeldige lege configuraties.
- Twee initiële meldingsconfiguraties zijn toegevoegd: `lamp-sem-aan.json` en `lamp-bram-aan.json`. Ze combineren de lampstatus `onoff == true` met elk hun eigen lege slaap-schema. Severity is `info`.
- GitHub Actions valideerde de backend-, schema- en testwijzigingen succesvol. Ook de twee nieuwe lampconfiguraties zijn door CI gevalideerd: [run 43382190242](https://github.com/RoadXY/homey_dashboard/actions/runs/43382190242) en [run 43382195856](https://github.com/RoadXY/homey_dashboard/actions/runs/43382195856).

### Nog te bouwen

1. De echte Blockly-library in de client integreren en een aangepaste `Tijdschema actief?`-block definiëren.
2. De instellingenpagina voor meldingen toevoegen, beveiligd met de bestaande instellingen-sessie.
3. De Blockly-workspace koppelen aan het canonieke JSON-model; geen tweede evaluator introduceren.
4. Configuraties veilig persistent opslaan in `DATA_DIR`, inclusief validatie vóór opslaan.
5. De vier afzonderlijke `boven_ramen_open`-instanties toevoegen wanneer de vier raamregels als JSON-configuraties worden gemigreerd.


### 10.1 Instellingenpagina en Blockly-editor

De eerste bewerkbare Blockly-interface is toegevoegd onder **Instellingen → Meldingen**.

- De pagina toont meldingen die een tijdschema-node bevatten en laat de gebruiker per melding de eigen schema-instantie selecteren.
- De custom Blockly-outputblock `Tijdschema actief?` bevat zeven onafhankelijke weekdagkeuzes en velden voor begin- en eindtijd.
- Een schema zonder geselecteerde weekdagen wordt opgeslagen als `configured: false` met een lege `weekdays`-lijst. Zodra ten minste één dag is geselecteerd, wordt een volledig schema-object opgeslagen.
- De editor schrijft wijzigingen terug naar dezelfde `schedule`-node in het canonieke notification-v1 JSON-model. Er is geen aparte Blockly-evaluator of tweede regelrepresentatie.
- De gebruiker slaat alle wijzigingen expliciet op via **Opslaan**. Opslag wordt server-side gevalideerd voordat deze actief wordt.
- De bestaande meldingen worden niet door de Blockly-editor herschreven zolang de gebruiker niets opslaat.

### 10.2 Beveiligde API en persistente opslag

- `GET /api/settings/notifications` en `POST /api/settings/notifications` vereisen de bestaande PIN-instellingen-sessie.
- Opgeslagen configuratie wordt als overridebestand `DATA_DIR/notifications.json` bewaard; het bestand wordt met permissie `0600` aangemaakt.
- De runtime-meldingenengine leest dezelfde opgeslagen configuratie als de instellingenpagina.
- Bij het laden worden opgeslagen configuraties per stabiele melding-ID samengevoegd met de standaardconfiguraties uit `config/notifications`. Nieuwe standaardmeldingen blijven daardoor zichtbaar wanneer later nieuwe configuratiebestanden aan de repository worden toegevoegd.
- Een ongeldige JSON-configuratie of dubbele melding-ID wordt geweigerd.
- De UI-teksten zijn opgenomen in zowel de Nederlandse als Engelse locale.

### 10.3 Bekende technische vervolgstappen

- Blockly 12.3.1 wordt voor deze eerste versie via een vastgepinde CDN-script geladen. Daardoor heeft alleen de Blockly-instellingenpagina een internetverbinding nodig om de editorbibliotheek op te halen. Het normale dashboard en de backend blijven lokaal functioneren. Voor een volledig zelfvoorzienende Docker-image moet Blockly in een volgende stap lokaal worden gebundeld.
- De huidige Blockly-interface bewerkt de tijdschema-bouwsteen. De volledige visuele editor voor alle AND/OR-, vergelijking-, duur- en databronblokken wordt stapsgewijs uitgebreid; de bestaande JSON-runtime ondersteunt deze conditiontypen al.
- De vier afzonderlijke `boven_ramen_open`-schema-instanties worden toegevoegd zodra de vier raamregels als meldingsconfiguraties worden gemigreerd.

## 10. Huidige editorbeperking en vervolgimplementatie – 13 november 2026

Bij de eerste praktijktest van de instellingenpagina is vastgesteld dat de Blockly-werkruimte alleen het losse blok `Tijdschema actief?` toont. Dit blok heeft een boolean-uitgang, maar de werkruimte heeft nog geen toolbox en bevat nog geen bron-, vergelijking-, EN/OF- of duurblokken. Daardoor kan de gebruiker nog geen conditieketen samenstellen. Dit is een ontbrekend implementatieonderdeel, geen bedieningsprobleem.

Vervolgimplementatie:
- Voeg een toolbox toe met bouwstenen voor Homey-apparaat/capability, Logic-variabele, vergelijking, EN, OF, tijdschema en duur.
- Maak de aansluitingen compatibel met het canonieke voorwaardenmodel: conditieblokken leveren een boolean-conditie; bron- en vergelijkingsvelden worden als één comparison-node opgeslagen; EN/OF bevatten één of meer onderliggende condities; duur bevat een onderliggende conditie.
- Serialiseer de Blockly-werkruimte naar het bestaande `schemaVersion: 1` JSON-model en laad bestaande JSON-configuraties terug in Blockly.
- Blijf dezelfde backendvalidatie en evaluator gebruiken. Er komt geen afzonderlijke Blockly-evaluator.
- Behoud de bestaande instellingen voor meldingstitel, bericht, ernst en ingeschakeld-status; deze editoruitbreiding verandert alleen de manier waarop de conditieboom wordt bewerkt.

De huidige tijdschema-editor geldt daarom als eerste technische proef, niet als afgeronde Blockly-conditie-editor. De volledige conditie-editor is pas gereed wanneer bestaande combinaties van comparison-, AND/OR-, duration- en schedule-nodes visueel kunnen worden opgebouwd, geopend, gewijzigd en opgeslagen.

## 11. Implementatiestart volledige conditie-editor – 13 november 2026

De eerste backendstap voor de uitbreidbare conditie-editor is uitgevoerd:
- Canoniek JSON-schema v1 uitgebreid met `not`- en `weekday`-nodes.
- Vergelijkingsoperatoren uitgebreid met `notEquals`, `lessThanOrEqual` en `greaterThanOrEqual`; bestaande operatoren blijven behouden.
- Backendvalidatie en evaluatie uitgebreid voor de nieuwe operatoren en nodes.
- Bronnen blijven recursief uit de conditieboom verzameld, ook onder NOT- en duurblokken.
- Validatietests toegevoegd voor de nieuwe vergelijkingsoperatoren, typebeperkingen en ongeldige weekday-configuraties.

Dit is uitsluitend de backend-/schemafundering. De zichtbare Blockly-toolbox, bronkeuzeblokken, volledige conditieboom laden/serialiseren en browserinteractie zijn nog niet geïmplementeerd. De huidige tijdschema-UI is dus nog niet vervangen en deze commits zijn nog niet als werkende editor op de tablet te testen. CI moet de nieuwe backendwijzigingen nog valideren.
### 11.1 C-vormige duurblokken – eerste visuele stap

De Blockly-workspace bevat nu twee C-vormige statementblokken:

- **Gedurende X minuten actief**: de ingesloten voorwaarde moet onafgebroken waar blijven gedurende de ingestelde tijd.
- **Gedurende X minuten inactief**: de ingesloten voorwaarde moet onafgebroken onwaar blijven gedurende de ingestelde tijd.

Beide blokken hebben een instelbaar aantal minuten (1–1440) en een statement-invoegopening. In die opening staat momenteel een expliciete tijdelijke placeholder **Plaats hier de voorwaarde**. Daarmee is de gewenste C-vorm en de nesting in de workspace zichtbaar en testbaar.

**Belangrijke beperking:** de placeholder is nog geen echte conditiebouwsteen en de duurblokken worden nog niet vanuit de bestaande JSON-conditieboom opgebouwd of teruggeserialiseerd. De backend ondersteunt op dit moment de canonieke `duration`-node voor een gedurende de tijd actieve child-conditie; de variant voor gedurende inactief moet in de JSON-serialisatie als negatie (`not`) van de child-conditie worden gemodelleerd of expliciet worden ondersteund. De huidige visuele blokken slaan hun waarde/inhoud dus nog niet op. Dit is bewust een vorm-/nestingstap, geen afgeronde duurfunctionaliteit.

Vervolg: vervang de placeholder door echte statement-varianten van bron/vergelijking/logische voorwaarden, leg een stabiele duurblok-ID vast, en implementeer round-trip naar de bestaande `duration`- en `not`-nodes. Test ook dat de timer opnieuw begint zodra de ingesloten voorwaarde tussentijds niet meer aan de vereiste toestand voldoet.
### 11.2 Eerste echte conditiebouwsteen in de duurblokken

De tijdelijke tekstplaceholder in beide C-vormige duurblokken is vervangen door een bewerkbare statement-bouwsteen. Binnen de opening staat nu een voorwaardeblok met:
- selectie van een Homey-apparaat/capability of Logic-variabele uit de broncatalogus;
- datatype-afhankelijke vergelijkingsoperatoren;
- een waardeveld.

De velden worden bij het openen gevuld vanuit de momenteel geselecteerde melding. Wijzigingen aan bron en vergelijking gebruiken de bestaande updatecallbacks van de instellingenpagina.

**Nog niet afgerond:** de duurwaarde en de geneste conditie worden nog niet als `duration`-node in de configuratieboom opgeslagen. De bestaande callbacks passen de geselecteerde melding haar eerste vergelijkingsnode aan, maar maken nog geen duurwrapper. Ook het onderscheid 'inactief gedurende' is nog niet als `duration(not(condition))` weggeschreven. De huidige stap maakt de binnenkant van de C-vorm bewerkbaar; de volgende stap is de boomserialisatie en round-trip, zodat de C-vorm ook echt betekenis krijgt in de opgeslagen configuratie.
### 11.3 Inactieve duurvariant gekoppeld aan canonieke JSON

De JSON-loader en serializer ondersteunen nu ook **Gedurende X minuten inactief** als expliciete Blockly-vorm. De opgeslagen structuur blijft canoniek: `duration` met als child een `not`-node rond de voorwaarde. Bij het openen herkent de loader deze combinatie en toont hij het inactieve duurblok; bij opslaan bouwt de serializer dezelfde combinatie terug op.

Daarmee worden de actieve en inactieve variant allebei als dezelfde backend-duurconstructie geëvalueerd, zonder een tweede duursemantiek in het schema te introduceren. De duur blijft 1–1440 minuten en ieder duurblok behoudt zijn Blockly-ID als `duration.id`.


## 12. Blockly-tijdschema als C-vormige container – 13 november 2026

De Blockly-bouwsteen **Tijdschema actief?** is omgezet van een los statementblok naar een C-vormige statementcontainer.

- De bestaande instellingen blijven bovenaan het blok staan: weekdagen, begintijd en eindtijd.
- Onder **Alleen wanneer:** kunnen één of meer voorwaarden worden geplaatst.
- Binnen de opening zijn ook de bestaande EN-, OF-, NIET-, duur- en bron/vergelijkingsblokken te nesten.
- De inhoud van het tijdschema wordt alleen waar wanneer zowel het tijdschema actief is als de ingesloten voorwaarden waar zijn. De semantiek is dus: tijdschema **EN** alle direct ingesloten voorwaarden.
- Een tijdschema zonder ingesloten voorwaarden blijft bruikbaar als zelfstandige tijdvoorwaarde. Een tijdschema zonder geselecteerde dagen wordt als ongeconfigureerd opgeslagen en evalueert inactief.

### 12.1 Canonieke JSON en compatibiliteit

Er is geen nieuw conditietype en geen tweede evaluator geïntroduceerd. Als een tijdschema voorwaarden bevat, serialiseert Blockly dit naar de bestaande canonieke vorm:

```json
{
  "operator": "and",
  "conditions": [
    { "type": "schedule", "weekdays": [1, 2, 3, 4, 5], "startTime": "07:00", "endTime": "20:00", "timeZone": "Europe/Amsterdam" },
    { "type": "comparison", "source": { "type": "logic-variable", "variableId": "voorbeeld", "expectedType": "boolean" }, "condition": { "operator": "equals", "value": true } }
  ]
}
```

Bij het openen van een bestaande AND-conditie waarin een tijdschema op hetzelfde niveau staat als andere voorwaarden, herkent de Blockly-loader deze combinatie en toont hij het tijdschema als container met de overige voorwaarden erin. Dit is semantisch gelijkwaardig omdat alle kinderen van die AND al gezamenlijk waar moesten zijn. Een los tijdschema blijft als lege C-vormige container zichtbaar.

De bestaande backendvalidatie, JSON Schema en evaluator blijven leidend. Opslag blijft via de bestaande meldingen-API lopen; er is geen wijziging aan Homey-communicatie of de dashboardruntime nodig.

### 12.2 Implementatiestatus en testpunten

De clientimplementatie is aangepast op feature branch `feature/blockly-schedule-container`. De wijziging omvat de C-vormige Blockly-input, de nesting bij het terugladen van bestaande AND+schedule-condities en serialisatie van de container naar de bestaande AND/schedule-nodes.

Nog te verifiëren in de draaiende dashboardomgeving:
- een tijdschema met één vergelijking opslaan, pagina herladen en controleren dat de vergelijking binnen de tijdschema-container terugkomt;
- meerdere voorwaarden binnen één tijdschema plaatsen;
- EN en OF binnen het tijdschema nesten;
- een tijdschema binnen een EN/OF-container plaatsen;
- lege en ongeconfigureerde tijdschema's blijven inactief;
- bestaande meldingen zonder tijdschema blijven ongewijzigd.

De wijziging is op 13 november 2026 samengevoegd in `phase_1_foundation` via pull request #1 (squash-commit `ad5ee612bfe743f29c31a9eb3c5be443a206a507`). CI- en praktijktests moeten nog volgen.


### 12.3 Compactere hoofdcontainer – 13 november 2026

Naar aanleiding van de eerste praktijktest is de vaste Blockly-hoofdcontainer **Genereer melding** compacter gemaakt.

- Het lange label bij de statement-opening is vervangen door het korte label **Voorwaarden:**.
- De afsluitende uitlegregel onderaan het blok is verwijderd; deze herhaalde informatie en maakte de hoofdcontainer onnodig hoog.
- De titel **Genereer melding**, de vaste/niet-verplaatsbare hoofdrol en de statement-opening blijven behouden.
- De semantiek, JSON-serialisatie en backend-evaluatie zijn niet gewijzigd.

De breedte van de hoofdcontainer wordt nu vooral bepaald door de daadwerkelijk geplaatste voorwaarden en geneste containers, in plaats van door lange toelichtende tekst. Praktische controle op de tablet volgt na het bijwerken van de Docker-container.


### 12.4 Label van de hoofdcontainer verwijderd – 13 november 2026

Na de volgende praktijktest is ook het korte label **Voorwaarden:** uit de invoeropening van **Genereer melding** verwijderd. De hoofdcontainer toont nu alleen de titel en de inhoud die erin wordt geplaatst. Dit verkleint de visuele drukte; de statement-opening en de onderliggende conditielogica blijven ongewijzigd.


## 13. Blockly-codecontrole – 13 november 2026

De actuele implementatie op `phase_1_foundation` is statisch gecontroleerd en de GitHub Actions-build is gecontroleerd.

### Wat aanwezig is
- Vaste, niet-verplaatsbare hoofdcontainer **Genereer melding**.
- Homey-apparaat/capability- en Logic-variabelebronnen met datatype-afhankelijke vergelijkingsoperatoren.
- EN-, OF- en NIET-containers.
- Tijdschema als C-vormige container, inclusief weekdagen en begin-/eindtijd.
- Dag-van-de-week-voorwaarde.
- Duur actief en duur inactief, waarbij inactief canoniek als `duration(not(condition))` wordt opgeslagen.
- Laden van de bestaande conditieboom en serialiseren van wijzigingen naar het bestaande notification-v1-model.
- Validatie van onvolledige/ongeldige Blockly-structuren voordat wijzigingen naar de configuratie worden doorgegeven.

### Geautomatiseerde controle
De CI-run voor de actuele documentatiecommit `94f4d93f28c46eff7448f2008c8a9ac81d7f4ba7` is succesvol afgerond: [GitHub Actions run 43456603802](https://github.com/RoadXY/homey_dashboard/actions/runs/43456603802). De workflow heeft dependency-installatie, `npm test`, OpenAPI-validatie en `npm run build` succesvol uitgevoerd.

De unit-tests voor `notification-condition-blockly.ts` controleren bronconversie, datatype-afhankelijke vergelijkingswaarden, duurconversie en impliciete EN-semantiek van de hoofdcontainer.

### Nog niet bewezen / bekende beperking
- Er zijn nog geen geautomatiseerde browser-/Blockly-integratietests die het daadwerkelijk slepen, nesten, laden en opslaan van de volledige Blockly-workspace doorlopen. De helpertests bewijzen dus niet de volledige visuele round-trip.
- De Blockly-library wordt in `src/client/index.html` geladen vanaf `https://unpkg.com/blockly@12.3.1/blockly.min.js`. De instellingenpagina vereist daarom internettoegang om Blockly te laden; de editor is nog niet volledig self-contained in de Docker-image.
- De praktijktest op de tablet moet nog bevestigen dat alle combinaties na opslaan en herladen exact dezelfde structuur en betekenis behouden.

### Conclusie
De implementatie is build- en unit-test-groen en de belangrijkste onderdelen zijn aanwezig. De Blockly-editor kan op basis van de huidige controles nog niet als volledig functioneel of volledig praktijktest-bewezen worden aangemerkt. De resterende stap is een gerichte browser-/tablet-test van de volledige Blockly-round-trip en bij voorkeur automatisering daarvan.


## 14. Blockly lokaal bundelen – ontwerpbesluit en implementatie (13 november 2026)

De gebruiker kiest ervoor om Blockly als lokale, vastgepinde npm-afhankelijkheid in de dashboardclient op te nemen. Dit is de voorkeursoplossing voor de lokale Homey-dashboardinstallatie: de tablet toont alleen de dashboardwebsite en hoeft voor de Blockly-editor geen externe CDN meer te bereiken.

### Besluit
- Gebruik exact **Blockly 12.3.1**, gelijk aan de eerder gebruikte CDN-versie. Zo combineren we de leveringswijziging niet met een functionele Blockly-upgrade.
- Installeer Blockly als productieafhankelijkheid via `package.json` en leg de versie vast in `package-lock.json`.
- Importeer Blockly Core en de standaardblokken vanuit de npm-package. Vite neemt deze code mee in de lokale frontend-build.
- Verwijder het externe `unpkg.com/blockly`-script uit `src/client/index.html`; de client gebruikt geen globale `window.Blockly` meer.
- Blockly-updates gebeuren bewust via een dependency-update, gevolgd door tests/build en praktijktest. Geen runtime-versie die ongemerkt via een CDN verandert.

### Verwacht effect
- De Blockly-instellingeneditor kan laden zonder runtime-internetverbinding.
- De Docker-image bevat de benodigde Blockly-clientbestanden in de gebouwde frontend.
- De image/build kan tijdens dependency-installatie nog wel toegang tot de npm-registry nodig hebben, tenzij dependencies uit cache of een eigen registry komen.
- Deze wijziging maakt alleen Blockly lokaal. Andere eventuele externe runtime-afhankelijkheden moeten afzonderlijk worden geïnventariseerd.

### Validatiestatus
De broncode en dependencyconfiguratie zijn omgezet naar de lokale package-import. De lockfile legt versie 12.3.1 vast. De definitieve bevestiging volgt uit de GitHub Actions-run (dependency-installatie, tests en build) en daarna uit een browser-/tablet-test waarbij de editor zonder internetverbinding wordt geopend.


## 15. Positie label hoofdblok (13 november 2026)

Het vaste paarse hoofdblok toont de tekst **🔔 Genereer melding** nu onderaan in een footer-input. Boven de voorwaarden staat geen titel/label meer. De statement-input `CONDITIONS` staat als eerste in het blok, gevolgd door de footer. De inhoud en serialisatie van de voorwaarden veranderen hierdoor niet; dit is uitsluitend een visuele wijziging.


## Blockly – dynamische vergelijkingsdropdown bij laden (13 november 2026)
Bij het terugzetten van bestaande vergelijkingsblokken wordt eerst de Homey-bron (`SOURCE`) hersteld. Omdat de operator-dropdown dynamisch afhangt van het datatype van die bron, moet daarna de door Blockly gecachete dropdown-optieset opnieuw worden opgebouwd vóór de opgeslagen operator (`OP`) wordt ingesteld. Anders kan Blockly een numerieke operator zoals `lessThan` of `greaterThan` afwijzen op basis van de opties van de eerste (mogelijk booleaanse) bron in de catalogus. De loader ververst daarom `OP`-opties expliciet via `getOptions(false)` na het herstellen van `SOURCE`, en controleert daarna of de opgeslagen operator bij het datatype past. Onbekende of ongeldige combinaties blijven veilig als niet-ondersteund blok zichtbaar; bestaande configuratie wordt niet stilzwijgend aangepast.


## Meldingenkiezer in dezelfde kaartstijl (13 november 2026)
De balk waarmee boven de Blockly-editor een melding wordt geselecteerd, gebruikt nu dezelfde donkerblauwe gradient, rand, afronding en subtiele schaduw als de overige instellingenkaarten. Het label **Meldingen** is vergroot naar 21 px en krijgt dezelfde visuele nadruk als de titel van de geselecteerde melding (bijvoorbeeld **Achterdeur open**). De keuzelijst gebruikt dezelfde donkere invoerstijl als de algemene instellingen. Op smallere schermen mag de bestaande mobiele regel de label- en selectiekolom onder elkaar plaatsen.


## Sidebar inklapknop – positie en pictogram (13 november 2026)
De inklapknop staat nu volledig aan de binnenzijde van de sidebar, links van de verticale scheidingslijn. De knop heeft geen eigen achtergrond of afgeronde achtergrondvorm; de achtergrond blijft dus die van de sidebar. Het pictogram is vervangen door een compact, zelfgetekend SVG-paneelicoon met dezelfde lijnstijl als het voorbeeld. De lijnkleur komt uit de semantische CSS-token `--sidebar-toggle-color`, zodat toekomstige thema's en light/dark mode het pictogram kunnen aanpassen zonder componentcode te wijzigen. De knop blijft toetsenbord-focusbaar.


## Ingeklapte sidebar – positie inklapknop (13 november 2026)
In de ingeklapte sidebar staat de toggle rechtsboven binnen de sidebar, met gelijke boven- en rechtermarge van 8 px. Een verouderde, later in de stylesheet geplaatste regel die de knop 15 px over de scheidingslijn schoof, is verwijderd. In de uitgeklapte stand blijft de knop op de bestaande positie.


## Blockly-contextmenu en lokale vertalingen (13 november 2026)
De Blockly-editor wordt via `blockly/core` als npm-module geladen. Deze import vult de interne `Blockly.Msg`-berichtentabel niet vanzelf met de vertalingen die Blockly's eigen contextmenu nodig heeft. Daardoor kon een rechtermuisklik falen bij het opbouwen van de menuopties (interne `displayText`-fout) en verscheen het contextmenu niet.

De editor importeert nu de meegeleverde Nederlandse en Engelse Blockly-berichtentabellen lokaal uit de vastgepinde npm-dependency en activeert vóór workspace-initialisatie de tabel die past bij de dashboardtaal via `Blockly.setLocale`. Dit herstelt de standaard contextmenu-teksten zonder een runtime-internetafhankelijkheid of wijziging aan de eigen blokdefinities en notificatiegegevens.


## Nieuwe dashboardmelding aanmaken (13 november 2026)
Boven de Blockly-editor staat naast de meldingenkeuze de knop **+ Nieuwe melding**. Een klik maakt direct een nieuwe conceptconfiguratie aan en selecteert deze automatisch. De naam wordt automatisch uniek gemaakt (bijvoorbeeld *Nieuwe melding*, *Nieuwe melding 2*) en kan direct in de kop van de editor worden aangepast. Het standaardniveau is **Informatie**.

Een nieuwe melding start met een geldig, maar niet-geconfigureerd tijdschema (`configured: false`, geen geselecteerde weekdagen). Daardoor is de melding veilig inactief totdat de gebruiker de voorwaarden in Blockly configureert. De nieuwe configuratie wordt pas persistent wanneer **Opslaan** wordt gebruikt; navigeren of verversen vóór opslaan bewaart het concept niet. De opslaanknop blijft uitgeschakeld zolang een meldingsnaam leeg is. De knop, lege-lijsttekst en naamlabels zijn beschikbaar in Nederlands en Engels. De selector en knop stapelen op smalle schermen onder elkaar.


### Correctie create-notification handler (13 november 2026)
Bij de eerste implementatie van de knop **Nieuwe melding** waren de handlers `createNotification` en `updateTitle` per ongeluk in de component voor meetwaardetegels terechtgekomen, terwijl de meldingenpagina ze aanriep. Daardoor ontstond in de browser de fout `ReferenceError: createNotification is not defined` en crashte de pagina bij renderen. Beide handlers zijn verplaatst naar de scope van `NotificationSettingsPage`. De correctie is vastgelegd in commit `dedd78ab58fe9ff091f8875d57427e5e38cbd7e4`. Hercontrole via CI en daarna browserpraktijktest blijft vereist.


### Volgorde niveau-indicator (13 november 2026)
In de kop van de meldingseditor staat de volgorde nu als **Huidig niveau → gekleurde statuschip → keuzelijst**. De tussenruimte in deze groep is 14px, gelijk aan de `gap: 14px` van de balk met de meldingenkeuzelijst en de knop **Nieuwe melding**. Zo blijft de huidige status direct zichtbaar naast het label, terwijl de dropdown er duidelijk van gescheiden staat.
