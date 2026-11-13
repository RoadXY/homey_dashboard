# Blockly-bouwsteen – databron en voorwaarde vergelijken

**Status:** eerste functionele ontwerpschets, nog niet geïmplementeerd  
**Fase:** 1  
**Doel:** de gebruiker moet in Blockly zelf een Homey-databron kunnen kiezen, de actuele waarde uitlezen en daar een eenvoudige voorwaarde mee samenstellen voor een dashboardmelding.

## 1. Leidende uitgangspunten

- Homey Pro 2023 is de bron voor actuele apparaatgegevens, beschikbaarheidsstatussen en Logic-variabelen.
- De dashboardapplicatie leest Homey uitsluitend read-only uit.
- De gebruiker kiest per melding zelf de databron in Blockly; er wordt geen vaste bron voor bijvoorbeeld CO₂ voorgeschreven.
- Toegestane bronsoorten zijn:
  1. een Homey-apparaat en een capability/waarde van dat apparaat;
  2. een bestaande Homey Logic-variabele.
- Als een Logic-variabele wordt gekozen, is de gebruiker verantwoordelijk voor het vullen en actueel houden van die variabele. De dashboardapplicatie leest de waarde alleen.
- De voorwaarde en de evaluatie worden intern in de dashboardapplicatie uitgevoerd. Er worden geen Homey Flows gestart of uitgevoerd.
- De prioriteit is een vaste eigenschap van de afzonderlijke melding. De prioriteit verandert niet dynamisch op basis van de bronwaarde of een voorwaarde. Voor verschillende prioriteiten maakt de gebruiker afzonderlijke meldingen met eigen voorwaarden.
- Dezelfde bronselectie- en vergelijkingsbouwstenen moeten herbruikbaar zijn voor verschillende soorten dashboardmeldingen.

## 2. Voorgestelde opbouw in Blockly

De gebruiker bouwt een regel met drie herkenbare onderdelen:

1. **Databron kiezen** – selecteer een Homey-apparaat/capability of een Logic-variabele.
2. **Waarde ophalen** – de applicatie leest de actuele waarde van de geselecteerde bron.
3. **Voorwaarde vergelijken** – vergelijk de waarde met een ingestelde waarde of andere eenvoudige operand.

Schematisch:

```
[Homey-apparaat/capability OF Logic-variabele]
                    |
                    v
             [Actuele waarde]
                    |
                    v
       [Vergelijking + ingestelde waarde]
                    |
                    v
            [Waar / Onwaar]
```

De uitkomst van de vergelijking kan vervolgens onderdeel zijn van een samengestelde meldingsvoorwaarde.

## 3. Bronselectie

### 3.1 Homey-apparaat

De gebruiker selecteert:
- een apparaat uit de Homey-apparatenlijst;
- vervolgens een beschikbare capability/waarde van dat apparaat.

De keuzelijst moet begrijpelijke apparaatnamen tonen en de technische capability-identificatie herkenbaar beschikbaar maken, zodat gelijksoortige apparaten of waarden niet met elkaar worden verward.

### 3.2 Homey Logic-variabele

De gebruiker selecteert een bestaande Logic-variabele uit de Homey Logic-inventarisatie. De actuele waarde en het datatype worden uit Homey gelezen. De gebruiker blijft verantwoordelijk voor het vullen en bijwerken van de variabele.

### 3.3 Read-only en foutafhandeling

- Blockly biedt geen actie om Homey-apparaten, capabilities of Logic-variabelen te wijzigen.
- De bron wordt tijdens runtime opnieuw read-only uitgelezen volgens het ingestelde verversings-/evaluatiemodel van de dashboardapplicatie.
- Een niet beschikbare bron of een niet uitleesbare waarde mag niet stilzwijgend als `false`, nul of een normale status worden behandeld.
- De exacte fout-/onbekend-afhandeling en diagnoseweergave worden verder uitgewerkt binnen de fase-1-scope; detectie van verouderde meetwaarden blijft fase 3.

## 4. Vergelijkingsbouwsteen

De eerste versie moet eenvoudige voorwaarden kunnen uitdrukken. De definitieve operatorlijst en ondersteuning per datatype moeten nog worden bevestigd.

Voorbeelden van bedoelde vergelijkingen:
- numeriek: groter dan, groter dan of gelijk aan, kleiner dan, kleiner dan of gelijk aan, gelijk aan;
- tekst/status: is gelijk aan, is niet gelijk aan;
- boolean: is waar, is onwaar.

De editor moet voorkomen dat een ongeldige combinatie wordt samengesteld, bijvoorbeeld een numerieke vergelijking op een tekstwaarde. De operand en het datatype moeten aansluiten op de geselecteerde bron.

## 5. Relatie met meldingen

- De databron en voorwaarde bepalen wanneer de melding actief is.
- De prioriteit wordt apart en vast op de melding ingesteld.
- De prioriteit wordt niet afgeleid uit de uitkomst van een vergelijking.
- Een gebruiker die een waarschuwing én een kritieke melding wil, maakt twee afzonderlijke meldingen met elk een eigen voorwaarde en vaste prioriteit.
- Een melding verdwijnt volgens de bestaande dashboardafspraak zodra de onderliggende voorwaarde niet meer actief is; er wordt geen geschiedenis van beëindigde meldingen bijgehouden.

## 6. Voorbeeld – CO₂

De gebruiker kan zelf kiezen uit:
- multisensor woonkamer → `measure_co2`; of
- Logic-variabele `eco2_woonkamer_status`.

Er wordt geen van beide bronnen verplicht voorgeschreven. De gebruiker configureert de gewenste vergelijking(en) en maakt afzonderlijke meldingen met vaste prioriteit als meerdere meldingsniveaus gewenst zijn.

De eerder besproken CO₂-waarden (waarschuwing vanaf 1000 ppm, kritiek vanaf 2000 ppm en herstel onder 990 ppm) blijven functionele referentiewaarden uit de meldingenmatrix. Ze leggen niet vast welke bron de gebruiker in Blockly moet selecteren.

## 7. Nog te bevestigen

1. Welke vergelijkingsoperatoren moeten in de eerste versie beschikbaar zijn?
2. Moet de eerste versie naast enkele eenvoudige vergelijkingen direct AND/OR-combinaties ondersteunen, of wordt dat een afzonderlijke bouwsteen/stap?
3. Hoe wil de gebruiker in Blockly een bron kiezen: via twee aparte bronblokken (apparaatwaarde en Logic-variabele) of één bronblok met een keuzetype?

## 8. Acceptatiecriteria voor de eerste bouwsteen

- De gebruiker kan een Homey-apparaat selecteren en een capability daarvan kiezen.
- De gebruiker kan een Homey Logic-variabele selecteren.
- Beide bronnen worden uitsluitend read-only uitgelezen.
- De gebruiker kan een eenvoudige vergelijking samenstellen die een boolean-uitkomst oplevert.
- De applicatie voert de vergelijking zelf uit; er is geen Homey Flow nodig.
- Bronkeuze en meldingsprioriteit zijn afzonderlijke instellingen.
- De gebruiker kan verschillende meldingen met verschillende vaste prioriteiten aanmaken.
- Ongeldige datatype-/operatorcombinaties worden in de editor voorkomen.


## 9. Implementatievolgorde – bewust uitgesteld

Deze bouwsteen wordt **niet** geïmplementeerd voordat de eerste JSON-gedreven meldingen werken. Eerst worden de bestaande goedgekeurde meldingen uit de Home Assistant-YAML naar JSON-configuratie vertaald en door de dashboardapplicatie uitgevoerd. Daarna wordt Blockly als editor op die bestaande JSON-configuratie aangesloten, zodat Blockly configuraties kan lezen, bewerken en genereren.

Deze schets beschrijft dus het latere Blockly-doel en is geen opdracht om nu al Blockly te bouwen.


## 10. Implementatiestap – read-only broncatalogus

De backend biedt nu een afzonderlijke broncatalogus voor de meldingeneditor via `GET /api/settings/notification-sources`.

- De route is uitsluitend beschikbaar met een geldige instellingen-PIN-sessie.
- De catalogus bevat Homey-apparaten, hun boolean- en numerieke capabilities, ruimtes en boolean-/numerieke Logic-variabelen.
- Apparaat-ID's, capability-ID's en Logic-variable-ID's zijn de opgeslagen sleutels; namen zijn uitsluitend presentatietekst.
- Tekst- en enum-capabilities/variabelen worden bewust nog niet aangeboden, omdat het huidige canonieke notification-v1-bronmodel alleen `boolean` en `number` ondersteunt.
- De bestaande meetwaardetegelcatalogus blijft ongewijzigd en numeriek; deze uitbreiding beïnvloedt de instellingen voor meetwaardetegels niet.
- Deze stap levert alleen de broncatalogus. De Blockly-blokken en JSON-roundtrip volgen in de volgende implementatiestappen.

### 10.1 Praktijktest op de Ubuntu-server – 13 november 2026

Na het uitrollen van de versie met de broncatalogus heeft de gebruiker de endpoint getest vanuit een ingelogde dashboardinstellingen-sessie via de browserconsole. De response was succesvol:

- HTTP-status: `200`.
- `devices`: 127 apparaten.
- `variables`: 23 Logic-variabelen.
- `zones`: 22 ruimtes.
- `retrievedAt`: timestamp aanwezig.

Hiermee is bevestigd dat de beveiligde instellingenroute op de draaiende Docker-installatie bereikbaar is en dat de backend de Homey-inventarisatie succesvol kan ophalen. De aantallen zijn een momentopname van deze test en kunnen veranderen wanneer de Homey-inventaris wijzigt.

De test bevestigt nog niet dat bronselectie al in Blockly beschikbaar is; dat blijft onderdeel van de volgende frontend-implementatiestap.

## 11. Eerste frontend-koppeling broncatalogus

De instellingenpagina voor meldingen laadt nu naast de bestaande meldingsconfiguraties ook `GET /api/settings/notification-sources`. De catalogus wordt gebruikt voor een eerste bronkeuzecontrole met:

- apparaatnaam en capabilitytitel;
- capabilitytype (boolean/getal) en eventuele eenheid;
- Logic-variabelen met hun datatype;
- beschikbaarheidsinformatie in de apparaatopties.

De catalogusfout is bewust onafhankelijk van het laden van meldingsconfiguraties: als Homey tijdelijk niet bereikbaar is, blijven bestaande meldingen en de editorpagina beschikbaar. De bronkeuze is in deze tussenstap nog niet gekoppeld aan de opgeslagen condition-JSON; de UI meldt dit expliciet. De volgende stap is de bronkeuze als Blockly-bouwsteen modelleren en de bestaande JSON-configuraties round-trip veilig houden.

### 11.1 Bronkeuze schrijft nu naar het bestaande condition-model

De bronkeuze op de meldingeninstellingenpagina is aangesloten op het opgeslagen condition-model. Bij een melding met een vergelijkingsnode wordt de geselecteerde apparaat-capability of Logic-variabele als bron op de eerste vergelijkingsnode toegepast. De rest van de condition-boom blijft behouden. De selectie gebruikt uitsluitend stabiele Homey-ID's; namen en eenheden dienen alleen voor de presentatie.

Bij een bronwissel blijft de vergelijking behouden als de waarde bij het datatype past. Past deze niet, dan wordt voor een numerieke bron `equals 0` en voor een booleaanse bron `equals false` gebruikt. Zo wordt geen ongeldige datatype/operator-combinatie in het JSON-model opgeslagen. Meldingconfiguraties zonder vergelijkingsnode houden de bronkeuze uitgeschakeld. Dit is een tussenstap richting het uiteindelijke Blockly-bronblok; de huidige bronkeuze is nog een instellingenveld en nog geen Blockly-bouwsteen.

### 11.2 Homey-bron als zichtbare Blockly-bouwsteen

De losse HTML-bronkeuze is vervangen door een eigen Blockly-blok `homey_notification_source`. De dropdown in dit blok wordt gevuld vanuit de opgehaalde broncatalogus en toont apparaat/capability of Logic-variabele. De geselecteerde waarde blijft gebaseerd op stabiele IDs en wordt doorgegeven aan de bestaande bron-updatefunctie voor het condition-model.

Het bestaande tijdschema-blok blijft in dezelfde Blockly-workspace beschikbaar. De Homey-bron en het tijdschema zijn op dit moment afzonderlijke zichtbare blokken; de volledige verbinding van bron → vergelijking → logische combinaties en het round-trip laden van de volledige condition-boom zijn nog vervolgstappen. Deze tussenstatus is bewust expliciet: een los bronblok mag niet de indruk wekken dat de volledige visuele regel-editor al gereed is.

### 11.3 Vergelijkingsblok als volgende Blockly-bouwsteen

De Blockly-workspace bevat nu ook een afzonderlijk vergelijkingsblok met operator- en waardekeuze. De operatorlijst is datatypebewust: numerieke bronnen bieden alle zes afgesproken operatoren; booleaanse bronnen alleen `equals` en `notEquals`. Wijzigingen aan operator en waarde worden teruggeschreven naar de eerste vergelijkingsnode in het bestaande condition-model, zonder de omliggende EN/OF-structuur te vervangen.

Dit is nog een tussenstap: bron- en vergelijkingsblokken zijn zichtbaar naast elkaar en nog niet via Blockly-verbindingen tot één expressie gekoppeld. Het round-trip laden van willekeurige bestaande condition-bomen en de visuele EN/OF/NIET-compositie volgen hierna. Tot die tijd blijft de bestaande JSON-configuratie de bron van waarheid.
### 11.4 Eerste logische Blockly-blokken

De Blockly-workspace toont nu drie aanvullende logische blokken:

- **EN** (`homey_notification_logic_and`): twee boolean-aansluitingen; beide voorwaarden moeten waar zijn.
- **OF** (`homey_notification_logic_or`): twee boolean-aansluitingen; minimaal één voorwaarde moet waar zijn.
- **NIET** (`homey_notification_logic_not`): één boolean-aansluiting; keert de uitkomst om.

Het vergelijkingsblok levert nu eveneens een boolean-uitgang, zodat het technisch op de logische aansluitingen kan worden aangesloten. De blokken gebruiken het afgesproken canonieke typegedrag; de backend combineert bestaande AND/OR-nodes al met drie-waardige logica en ondersteunt ook de NOT-node.

**Status en beperking:** dit is de eerste visuele/verbindingstechnische stap, nog geen complete Blockly-editor. De workspace maakt de blokken zichtbaar, maar laadt de volledige bestaande conditieboom nog niet als verbonden blokken en vertaalt gewijzigde verbindingen nog niet terug naar JSON. Ook is de bediening van EN/OF momenteel op twee ingangen ingericht. Het bestaande JSON-model en de backend blijven leidend; er wordt nog niets beweerd over round-trip of opslaan van een via verbindingen gebouwde logische boom. De volgende stap is de volledige conditieboom veilig inlezen en serialiseren, inclusief behoud van onbekende of niet-bewerkbare constructies.
### 11.5 Bronblok aangesloten op vergelijkingsblok

Het Homey-bronblok heeft nu een eigen Blockly-uitgangstype (`HomeySource`) en het vergelijkingsblok een bijpassende broninvoer. De workspace verbindt de geselecteerde bron direct met het vergelijkingsblok. Daardoor is de eerste keten **Homey-bron → vergelijking** ook als Blockly-verbinding zichtbaar, in plaats van twee losse blokken naast elkaar.

De selectie blijft gekoppeld aan de bestaande updatefunctie en gebruikt stabiele bron-ID's. Deze stap serializeert nog niet de volledige Blockly-verbindingen naar de condition-boom; dat blijft onderdeel van de round-trip-implementatie. De EN/OF/NIET-blokken zijn momenteel losse bouwstenen die als volgende met de conditieboom verbonden moeten worden.
### 11.6 Meldingsselectie boven de editor en meer werkruimte

De aparte lijstkolom met meldingen is vervangen door een compacte dropdown boven de Blockly-editor. De gebruiker kiest daar de melding die wordt bewerkt; wisselen van selectie behoudt de bestaande selectie-/configuratiestroom. De editor gebruikt nu de volledige beschikbare kaartbreedte.

De grote paginaheading met meldingenicoon en titel is verwijderd, zodat de editor hoger op de pagina begint. De titel van de geselecteerde melding en de ernstbadge in de editorkaart blijven staan als context voor de actieve regel. Op smalle schermen stapelt de dropdownlabel en keuzelijst onder elkaar.
### 11.7 Bestaande conditieboom in Blockly laden

De instellingeneditor ontvangt nu de volledige `condition`-boom van de geselecteerde melding en bouwt daaruit een verbonden Blockly-structuur op. De eerste loader ondersteunt:
- `comparison`: bron-ID, operator en vergelijkingswaarde;
- `schedule`: weekdagen en begin-/eindtijd;
- `weekday`: geselecteerde weekdag;
- `and` en `or`: alle onderliggende condities, inclusief meer dan twee kinderen;
- `not`: precies één onderliggende conditie;
- `duration`: duur in minuten en de geneste conditie.

Een onbekend of nog niet ondersteund node-type wordt als expliciet blok **Niet-ondersteunde voorwaarde** weergegeven in plaats van stilzwijgend uit de werkruimte te verdwijnen. De oorspronkelijke JSON wordt aan dat blok meegegeven als Blockly block-data.

**Status en beperking:** dit is de laad-/visualisatiestap. De volledige workspace wordt nog niet teruggeserialiseerd naar JSON en er is nog geen nieuwe opslagactie vanuit Blockly. De bestaande save-flow blijft de huidige config-data opslaan; deze loader schrijft geen wijzigingen terug. Daarmee kan de conditieboom nu worden bekeken als verbonden blokken, maar bewerken en round-trippen is nog niet afgerond. De onbekende-node placeholder is op dit moment alleen een zichtbare veiligheidsmarkering; behoud bij toekomstige serialisatie moet nog expliciet worden getest.
### 11.8 Blockly-conditieboom terugschrijven naar JSON

De editor heeft nu een eerste serializer die wijzigingen in de verbonden conditieblokken terugschrijft naar de `condition`-property van de geselecteerde melding. De serializer ondersteunt vergelijking, tijdschema, weekdag, EN, OF, NIET en `duration`. Bij een duurblok wordt de Blockly block-ID gebruikt als stabiele `duration.id` en wordt de ingestelde duur omgerekend naar milliseconden.

De serializer controleert onder meer dat:
- ieder vergelijkingsblok een bestaande bron uit de geladen Homey-catalogus gebruikt;
- numerieke vergelijkingswaarden geldige getallen zijn;
- NIET en duurblokken precies één voorwaarde bevatten;
- EN/OF minimaal twee voorwaarden bevatten;
- de werkruimte één verbonden hoofdconditie bevat;
- onbekende/unsupported blokken niet opgeslagen kunnen worden.

Onvolledige of ongeldige werkruimtes worden niet naar de configuratie geschreven. De gebruiker kan daardoor tijdens het bouwen tijdelijk een onvolledige boom hebben zonder dat die ongeldige toestand direct de opgeslagen configuratie vervangt.

**Beperkingen van deze serializer:** de huidige zichtbare editor gebruikt statementblokken voor de conditieboom. De oudere losse visuele blokken en de aparte `homey_notification_duration_active/inactive` proefblokken worden niet geserialiseerd. De inactieve duurvariant is inmiddels wel beschikbaar als `duration(not(child))` en wordt bij opnieuw openen weer als inactief duurblok getoond. Geautomatiseerde frontend round-trip-testdekking is nog nodig; CI/build valideert de code, maar bewijst op zichzelf nog niet dat iedere Blockly-verbinding correct heen en terug wordt vertaald.


### 11.9 Toolbox voor het samenstellen van voorwaarden

De Blockly-editor heeft nu een toolbox met drie categorieën, zodat voorwaarden niet alleen kunnen worden bekeken en aangepast, maar ook vanuit een lege of bestaande conditieboom kunnen worden toegevoegd:

- **Voorwaarden:** vergelijking met een selecteerbare Homey-bron, operator en waarde.
- **Logica:** EN, OF en NIET.
- **Tijd:** tijdschema actief, dag van de week, gedurende X minuten actief en gedurende X minuten inactief.

De werkruimte toont de toolbox naast de bestaande conditieboom. Een prullenbak is ingeschakeld om blokken te verwijderen. De nieuwe blokken blijven statementblokken en worden door dezelfde serializer naar het canonieke JSON-voorwaardenmodel vertaald; er is geen aparte Blockly-evaluator.

**Afbakening (historische tussenstap):** bij de eerste toolboxversie bevatte de vergelijking zelf de bronkeuze. Dit is in stap 11.10 vervangen door twee afzonderlijke bronblokken. De opslagstructuur en stabiele bronidentiteit zijn daarbij ongewijzigd gebleven.


### 11.10 Afzonderlijke bronblokken

De vergelijking gebruikt nu twee afzonderlijke bronblokken in de toolbox:

- **Homey-apparaat:** toont uitsluitend apparaat-capabilities uit de read-only broncatalogus.
- **Homey Logic-variabele:** toont uitsluitend Logic-variabelen uit diezelfde catalogus.

Een bronblok wordt direct vóór het vergelijkingsblok geplaatst. De combinatie wordt door de serializer als één canonieke `comparison`-node opgeslagen. Bij het opnieuw openen wordt de bronnode weer als het juiste afzonderlijke blok opgebouwd. De opgeslagen bronidentiteit blijft device-ID + capability-ID of Logic-variable-ID; de zichtbare namen worden niet als sleutel gebruikt.

De vergelijking zelf bevat alleen de operator en vergelijkingswaarde. Daardoor is het type bron in de Blockly-werkruimte direct herkenbaar en kan de gebruiker niet per ongeluk een Logic-variabele kiezen in het apparaatbronblok of andersom.

**Nog te testen:** de complete keten moet in de draaiende dashboardomgeving worden gecontroleerd op laden, wijzigen, opslaan en opnieuw openen. Ook blijven geautomatiseerde frontend round-trip-tests een openstaand kwaliteitscriterium.


### 11.11 Gerichte tests voor Blockly-conversies

De bron- en duurconversies zijn uit de React/Blockly-component gehaald naar `src/client/notification-condition-blockly.ts`. De editor gebruikt deze gedeelde functies daadwerkelijk; de tests valideren dus dezelfde conversielogica die tijdens runtime wordt gebruikt.

De nieuwe Vitest-tests controleren:

- bronresolutie op stabiele apparaat-ID + capability-ID en Logic-variable-ID;
- afwijzing van ontbrekende of ongeldige bronkeys;
- datatypebewuste conversie van numerieke en booleaanse vergelijkingswaarden;
- afwijzing van ongeldige operator-/datatypecombinaties en ongeldige waarden;
- round-trip van actieve en inactieve duurblokken;
- behoud van de bestaande `duration.id` bij opnieuw openen en opslaan;
- gebruik van een nieuwe Blockly-ID uitsluitend voor nieuw aangemaakte duurblokken;
- afwijzing van ontbrekende onderliggende voorwaarden en duurwaarden buiten 1–1440 minuten.

Dit zijn gerichte unit-tests van de conversiehelpers die de editor gebruikt. Ze vervangen nog niet de volledige browser-/Blockly-integratietest waarbij een gebruiker blokken sleept, opslaat en de melding opnieuw opent. Die integratietest blijft een afzonderlijk acceptatiepunt.


### 11.12 Zichtbare validatie en ontbrekende Homey-bronnen

De Blockly-editor toont nu de reden wanneer een onvolledige of ongeldige werkruimte niet naar het configuratiemodel kan worden geschreven. Geldige wijzigingen wissen deze foutmelding weer. De bestaande configuratie wordt bij een ongeldige werkruimte niet overschreven.

Bij het opnieuw openen wordt een vergelijking waarvan de Homey-bron niet meer in de actuele broncatalogus voorkomt als expliciet niet-ondersteund blok getoond, met de oorspronkelijke node-JSON als block-data. De editor probeert zo'n bron niet stilzwijgend naar een andere dropdownoptie om te zetten. Opslaan blijft geblokkeerd zolang dit blok aanwezig is.

Dit verbetert de foutfeedback en behoudt onbekende brondata. Het is geen vervanging voor de afgesproken handmatige browserintegratietest van slepen, verbinden, opslaan en opnieuw openen.


### 11.13 Alle meldingen beschikbaar maken in Blockly-instellingen

De meldingeninstellingen filterden de keuzelijst onbedoeld op regels die een tijdschema-node bevatten. Daardoor waren gewone vergelijkingsmeldingen, waaronder Logic-testmeldingen zonder tijdschema, niet selecteerbaar en werd de Blockly-editor helemaal niet getoond.

De selectie toont nu alle bestaande meldingsconfiguraties. Een tijdschema is optioneel en geen voorwaarde meer om een melding in Blockly te kunnen openen. De editor kan daardoor ook een conditieboom met alleen een Homey-apparaat- of Logic-vergelijking laden en bewerken. De keuzelijst heet voortaan **Meldingen**.


Wanneer de Homey-broncatalogus niet kan worden geladen, toont de instellingenpagina nu ook de concrete laadfout. Daarmee is onderscheid zichtbaar tussen een melding zonder bronblok, een lege broncatalogus en een mislukte API-aanvraag.


### 11.14 Blockly-werkruimte benut beschikbare schermhoogte

De Blockly-werkruimte had vaste hoogtes van 360 px op desktop en 320 px op mobiel. Daardoor bleef onder de editor onnodig veel lege ruimte over voordat de vaste Opslaan-actie in beeld kwam. De werkruimte gebruikt nu viewport-afhankelijke hoogtes met onder- en bovengrenzen: `clamp(500px, 62vh, 760px)` op grotere schermen en `clamp(400px, 58vh, 620px)` op smalle schermen. Zo groeit het werkvlak mee met de beschikbare schermhoogte zonder onbeperkt groot te worden; de bestaande Blockly-scrollbalken blijven beschikbaar voor grotere conditiebomen.


### 11.15 Contrast van Blockly-categorieën

De Blockly-toolbox gebruikte op sommige schermen de standaard lichtgrijze achtergrond, terwijl de categorie-labels licht bleven. De dark-theme styling is aangescherpt met expliciete achtergrondkleuren voor de toolbox en categorie-rijen, plus contrasterende hover- en geselecteerde toestanden. De labelkleur wordt expliciet op de toolboxcategorieën toegepast zodat deze leesbaar blijft.


### 11.16 Overbodige vaste tijdschema-uitleg verwijderd

De vaste omschrijving boven Blockly (`notifications.conditionDescription`), de toolbar-instructie (`notifications.blockHelp`) en de algemene hint onder de werkruimte (`notifications.inactiveHint`) zijn uit de meldingeneditor verwijderd. Deze teksten suggereerden dat iedere melding een tijdschema gebruikt en waren niet passend bij algemene conditiebomen. De ernstbadge blijft staan als afzonderlijke metadata.

Een eventuele toekomstige uitleg van de opgebouwde flow wordt niet met vaste tekst ingevuld, maar uitsluitend gegenereerd uit het opgeslagen conditiemodel. Voorwaarden die niet volledig en aantoonbaar ondersteund worden, moeten expliciet als niet uitlegbaar worden gemarkeerd; er mag geen gegokte samenvatting worden getoond.


### 11.17 Blockly-toolbox gebruikt expliciet dark theme

De eerdere CSS-correctie richtte zich vooral op de legacy Blockly tree-toolbox. De gebruikte category toolbox gebruikt daarnaast `.blocklyToolboxContents`, `.blocklyToolboxCategory` en `.blocklyToolboxCategoryLabel`; daardoor bleef de standaard lichtgrijze achtergrond zichtbaar. De editor initialiseert nu een expliciet `homeyDark` Blockly-theme met donkere workspace-, toolbox- en flyoutkleuren. Aanvullende CSS dekt zowel de moderne category toolbox als de legacy tree-selectors, inclusief hover- en geselecteerde categorieën.


### 11.18 Vaste hoofdconstructie Genereer melding en geneste containers

De meldingeneditor gebruikt nu één vaste, niet-verplaatsbare en niet-verwijderbare Blockly-hoofdconstructie **Genereer melding**. De hoofdconstructie bevat een statement-invoegpunt voor de volledige conditieflow en toont de actie **Melding genereren zodra de voorwaarden waar zijn** als vast onderdeel onderaan. De hoofdconstructie zelf is geen nieuwe JSON-node: het bestaande canonieke conditiemodel blijft ongewijzigd en de meldingconfiguratie impliceert de actie.

Binnen de hoofdconstructie kunnen meerdere voorwaarden en EN-/OF-containers naast elkaar worden geplaatst. Meerdere directe onderdelen in de hoofdconstructie worden semantisch gecombineerd met **EN**. EN- en OF-containers hebben ieder één C-vormig statement-invoegpunt waarin meerdere voorwaarden en andere EN-/OF-containers kunnen worden genest. Hierdoor kunnen verschillende containertypen op hetzelfde niveau worden gecombineerd en onbeperkt diep worden genest, binnen de praktische grenzen van Blockly en de backend.

EN betekent dat alle ingesloten voorwaarden waar moeten zijn; OF betekent dat minimaal één ingesloten voorwaarde waar moet zijn. Een EN-/OF-container vereist minimaal twee ingesloten voorwaarden. NIET en de duurblokken blijven unary voorwaarden en kunnen in dezelfde containers worden geplaatst. De backend blijft de uiteindelijke validator en evaluator.

De Homey-apparaat- en Logic-variabeleblokken bevatten voortaan ook hun eigen vergelijkingsoperator en waarde. Het losse groene vergelijkingsblok is uit de toolbox verwijderd. Hierdoor is een bronselectie en de bijbehorende vergelijking één logisch blok; de gebruiker kan geen losse vergelijking meer toevoegen zonder bron. De operatorlijst wordt bepaald door het brontype: numeriek toont zes operatoren, boolean toont gelijk aan en niet gelijk aan.

Bij het laden wordt de bestaande conditieboom in de vaste hoofdconstructie geplaatst. Bij opslaan wordt één directe conditie ongewijzigd opgeslagen; meerdere directe onderdelen worden als canonieke AND-node opgeslagen. Geneste EN-/OF-constructies blijven canonieke operator/conditions-nodes. Er is geen nieuwe evaluator en geen wijziging van het configuratieschema nodig.


### 11.19 Numerieke Homey-meetwaarden krijgen een numerieke vergelijkingsinvoer

De Homey-broncatalogus bepaalde het datatype van een apparaat-capability uitsluitend op basis van `capabilitiesObj[capabilityId].type`. Bij een meetwaarde met een fysieke eenheid (bijvoorbeeld °C) kan die metadata onjuist of inconsistent als boolean worden aangeleverd. De catalogus behandelt capabilities met een niet-lege eenheid daarom als numeriek; de eenheid is een betrouwbare aanwijzing dat de waarde meetbaar en numeriek is. Hierdoor toont Blockly voor temperatuur-, vochtigheids-, CO₂- en vergelijkbare meetwaarden een numeriek invoerveld en de zes numerieke vergelijkingsoperatoren. Boolean-capabilities zonder eenheid behouden true/false en alleen gelijk aan/niet gelijk aan. Logic-variabelen blijven hun eigen Homey-datatype volgen.


### 11.20 Blockly synchroniseert datatype direct bij selectie van een Homey-bron

De custom doorzoekbare Blockly-bronkeuzelijst wijzigde de bron via `FieldDropdown.setValue()`. De algemene Blockly-wijzigingslistener bleek daarbij niet betrouwbaar genoeg om het bijbehorende vergelijkingsveld te vervangen. Daardoor kon een nieuw geselecteerde numerieke bron (zoals een temperatuur) visueel nog een boolean-keuzelijst met `true/false` tonen, terwijl de serialisatie de numerieke bron al gebruikte. De klikactie van de custom keuzelijst synchroniseert nu direct het datatype-afhankelijke invoerveld en de toegestane operatoren. Bij een overgang van boolean naar number wordt een ongeldige oude waarde veilig genormaliseerd; bij een overgang naar boolean wordt het true/false-veld hersteld. Dit staat los van de algemene Blockly-wijzigingslistener en werkt daardoor ook bij de custom zoekdropdown.
