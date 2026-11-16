# Ontwerpbesluiten

Dit document bundelt de actuele ontwerpuitgangspunten. De detailgeschiedenis en eerdere besluiten blijven in `docs/01-project/besluitenlog.md` en `docs/07-ontwerp/README.md` staan.

## Hoofddashboard
- Donkere, minimalistische stijl met subtiele gradient/textuur.
- Kolomverhouding 40% links / 60% rechts.
- Links: klok/datum, weer en vier temperatuurtegels in vaste 2×2-indeling: Woonkamer, Keuken, Sem, Bram.
- Rechts: acht Quick Actions in één horizontale rij.
- In de eerste oplevering (fase 1A) worden meldingen niet getoond; dit verandert de goedgekeurde basisindeling niet definitief.
- Geen zichtbaar instellingenicoon; lang indrukken op de tijdkaart opent instellingen.
- Tablet: Samsung Galaxy Tab A SM-T515, landscape, Fully Kiosk Browser.

## Quick Actions
Volgorde: Q-Music, Q-Music Foute Uur, Rolluiken openen, Verjaardagmodus, Woonkamerverlichting uit, Sfeerverlichting, TV-modus, Bedtijd. Knoppen neutraal en monochroom volgens thema. De gebruiker maakt de benodigde Homey-Flows; dashboardintegratie wordt door ons uitgewerkt.

## Instellingen
- Donkere stijl, linker navigatiekolom, content rechts, duidelijke terugactie.
- Categorieën: Algemeen, Dashboard, Meldingen, Apparaten, Homey, Systeem.
- Algemene pagina: compacte instellingenlijst en compacte statuskaarten; datum/tijd, tijdzone en verversinstellingen.
- Dashboard: vier configureerbare temperatuurtegels, acht weeronderdelen met zichtbaarheidstoggles en configureerbare Quick Actions.
- Instellingen zijn bereikbaar vanaf tablet, computer en telefoon; PIN-beveiliging, sessie-time-out en expliciet opslaan.

## Meldingen – eigenaarschap en evaluatie (13 november 2026)
- Homey Pro 2023 is de databron: het dashboard leest de actuele apparaat-capabilities en eventueel geselecteerde Logic-variabelen read-only uit.
- Homey bepaalt niet welke meldingskaart op het dashboard zichtbaar wordt. Homey Dashboard is eigenaar van de presentatielogica en beslist zelf of een melding relevant/actief is.
- De gebruiker definieert de voorwaarden met Blockly. Blockly is de visuele editor voor het centrale, versiebeheerde JSON-voorwaardenmodel; de backend valideert en evalueert datzelfde model. Er komt geen afzonderlijke Blockly-evaluator.
- De backend moet hiervoor worden uitgebreid. De huidige evaluator ondersteunt nog niet alle beoogde constructies, waaronder duur- en tijdschema-voorwaarden. Deze uitbreiding hoort bij de implementatie van de meldingeneditor.
- Meldingen verdwijnen zodra hun voorwaarden niet meer actief zijn; de afgesproken dashboardweergave en sortering blijven leidend.
- Er zijn exact drie niveaus: **kritiek**, **waarschuwing** en **info**. De bestaande styling in `docs/03-dashboard/README.md` is leidend: kritiek = donkerroodgetinte kaart met contrasterende leesbare tekst; waarschuwing = donker geel/ambergetinte kaart met contrasterende leesbare tekst; info = neutrale donkere kaart. Sortering: kritiek, waarschuwing, info; binnen ieder niveau nieuwste activering eerst.
- Dit onderscheidt configureerbare, door Dashboard geëvalueerde meldingsregels van meldingen die later via de externe API worden gepubliceerd. De API-ingang mag de eigenaarschap-/presentatieregels van het dashboard niet omzeilen.

## Ontwerpstatus
Zie `goedkeuringsstatus.md` voor de actuele status per scherm. Visuele besluiten worden niet afgeleid uit niet-goedgekeurde voorbeeldinhoud van mockups.


## Meldingen – canoniek voorwaardenmodel (13 november 2026)

- Het enige officiële meldingsmodel is `schemaVersion: 1`, vastgelegd in `docs/04-configuratie/schemas/notification-v1.schema.json`.
- Dit schema gebruikt één expliciete conditieboom met comparison-, AND/OR-, duration- en schedule-nodes.
- Homey-apparaatbronnen gebruiken device-ID + capability-ID. Logic-bronnen gebruiken uitsluitend de stabiele Logic variable-ID; namen zijn geen bronidentiteit.
- Het eerdere legacy-v1-formaat en de tussentijdse schemaVersion 2 worden niet ondersteund.
- Er is geen compatibiliteitslaag, normalisatie of migratiepad. Het project bevindt zich in de ontwikkelfase en hoeft geen eerdere configuraties te bewaren.
- De zes bestaande ontwikkelconfiguraties zijn op het canonieke model gezet door uitsluitend het versienummer van 2 naar 1 te veranderen; de condities zijn inhoudelijk ongewijzigd.
- Blockly, JSON-configuraties en backend gebruiken hetzelfde schema en dezelfde evaluator. Een tweede evaluatie-implementatie in Blockly is niet toegestaan.

## Blockly – afzonderlijke Homey-bronblokken (13 november 2026)

De gebruiker kiest voor twee afzonderlijke bronblokken in de Blockly-editor:
- **Homey-apparaat**: selecteert een apparaat en capability.
- **Homey Logic-variabele**: selecteert een Logic-variabele.

De twee bronnen worden niet samengevoegd tot één generiek bronblok met een keuzeschakelaar. Dit maakt voor de gebruiker direct zichtbaar welk type bron wordt gebruikt. Beide blokken moeten naar de bestaande bronstructuren in het canonieke voorwaardenmodel worden vertaald; de stabiele apparaat-/capability-ID's en Logic-variable-ID's blijven de opgeslagen identiteit, niet de zichtbare namen.

## Blockly – vergelijkingsoperatoren (13 november 2026)

De gebruiker keurt voor de eerste volledige Blockly-editor de volgende zes vergelijkingsoperatoren goed:
- Is gelijk aan (`equals`)
- Is niet gelijk aan (`notEquals`)
- Groter dan (`greaterThan`)
- Groter dan of gelijk aan (`greaterThanOrEqual`)
- Kleiner dan (`lessThan`)
- Kleiner dan of gelijk aan (`lessThanOrEqual`)

De editor toont alleen operatoren die bij het verwachte brontype passen: booleaanse bronnen krijgen gelijk aan / niet gelijk aan met boolean-waarden; numerieke bronnen krijgen alle zes operatoren met numerieke waarden. De bronselectie bepaalt het verwachte type en de editor voorkomt ongeldige combinaties.

**Technische consequentie:** het huidige canonieke JSON-schema en de backend ondersteunen op dit moment alleen `equals`, `lessThan` en `greaterThan`. De twee nieuwe relationele operatoren en `notEquals` moeten daarom als uitbreiding worden toegevoegd aan schema, validator, evaluator en tests voordat de bijbehorende Blockly-blokken worden vrijgegeven. Bestaande JSON-configuraties met de huidige operatoren blijven ongewijzigd geldig.

## Blockly – logische combinatieblokken (13 november 2026)

De gebruiker keurt de volgende drie logische blokken goed voor de volledige Blockly-editor:
- **EN** (`and`): alle aangesloten onderliggende voorwaarden moeten waar zijn.
- **OF** (`or`): minimaal één aangesloten onderliggende voorwaarde moet waar zijn.
- **NIET** (`not`): keert de uitkomst van precies één onderliggende voorwaarde om.

EN en OF sluiten aan op de bestaande conditieboomstructuur met `operator` en `conditions`. Het NIET-blok vereist een expliciete uitbreiding van het canonieke JSON-schema, backendvalidatie, evaluator en tests. Bestaande AND/OR-configuraties blijven geldig en hoeven niet te worden herschreven.

De Blockly-editor moet voorkomen dat een onvolledige logische constructie als geldige configuratie wordt opgeslagen. EN/OF moeten minimaal één aangesloten conditie hebben; NIET moet precies één aangesloten conditie hebben. De backend blijft de uiteindelijke validatie uitvoeren.

## Blockly – tijd- en duurblokken (13 november 2026)

De gebruiker keurt de volgende vier blokken goed voor de Blockly-toolbox:
- **Tijdschema actief?**: boolean-voorwaarde die waar is binnen de ingestelde weekdagen en begin-/eindtijd.
- **Gedurende X minuten actief**: onderliggende voorwaarde moet onafgebroken waar zijn gedurende de ingestelde duur.
- **Gedurende X minuten inactief**: onderliggende voorwaarde moet onafgebroken onwaar zijn gedurende de ingestelde duur.
- **Dag van de week**: boolean-voorwaarde voor één of meer geselecteerde weekdagen.

### Semantiek van tijdschema als gewone conditie

Een tijdschema is een herbruikbare boolean-voorwaarde in de conditieboom; het is geen zelfstandige trigger en toont niet op zichzelf een melding. De gebruiker combineert het schema met andere voorwaarden via EN/OF/NIET.

Voorbeeld: de melding **Raam Bram niet open** wordt getoond wanneer (1) het tijdschema actief is, bijvoorbeeld tussen 08:00 en 20:00, EN (2) de contactcapability van het bovenraam Bram onwaar is. Buiten het tijdschema is de samengestelde conditie onwaar, ook wanneer het raam dicht is. De tijden in dit voorbeeld zijn illustratief; de concrete bestaande weekplanning van `boven_ramen_open` blijft vastgelegd in `blockly-bouwsteen-tijdschema.md`.

Tijdschema-, dag-van-de-week- en duurblokken leveren boolean-condities en moeten daarom op dezelfde manier als andere voorwaarden in EN/OF/NIET kunnen worden aangesloten. De duurblokken bevatten precies één onderliggende conditie. De evaluator moet de bestaande duursemantiek behouden: de timer loopt alleen zolang de onderliggende conditie ononderbroken in de vereiste toestand blijft.


## Instellingen – mobiele navigatie (13 november 2026)

De instellingen-navigatie blijft op desktop een linker zijbalk. Op schermen tot en met 700 px wordt deze omgezet naar één compacte horizontale navigatierij boven de inhoud. De rij kan horizontaal worden verschoven; knoppen wrappen niet en rekken niet verticaal uit. Zo blijven alle zes categorieën bereikbaar op smalle telefoons zonder de content onnodig naar beneden te duwen. De actieve categorie behoudt dezelfde blauwe accentkleur.


## Blockly – vaste hoofdconstructie Genereer melding (13 november 2026)

De gebruiker kiest als definitieve basisstructuur één vaste hoofdconstructie **Genereer melding**. Dit is het enige start-/hoofdelement van een melding en bevat de volledige conditieflow plus een vaste actiepresentatie onderaan. De actie is inherent aan de meldingsconfiguratie en wordt niet als nieuwe JSON-node opgeslagen; het bestaande canonieke conditiemodel en de backend-evaluator blijven leidend.

- Meerdere directe onderdelen in de hoofdconstructie worden impliciet met EN gecombineerd.
- EN en OF zijn nestbare C-vormige statementcontainers met één invoerpunt voor een keten van voorwaarden en andere containers.
- Meerdere containers van verschillende typen mogen naast elkaar in de hoofdconstructie staan.
- EN vereist dat alle ingesloten voorwaarden waar zijn; OF vereist minimaal één ware voorwaarde. Beide vereisen minimaal twee kinderen.
- NIET en duurblokken blijven voorwaarden die in EN/OF-containers geplaatst kunnen worden.
- Een Homey-apparaat- of Logic-variabeleblok bevat bron, operator en waarde als één voorwaarde. Het losse vergelijkingsblok verdwijnt uit de toolbox.
- Bestaande conditie-JSON wordt in de vaste hoofdconstructie gehydrateerd. Eén direct onderdeel blijft ongewijzigd; meerdere directe onderdelen worden bij serialisatie een canonieke AND-node.
- De JSON-schema's en backend-evaluator blijven ongewijzigd; er komt geen tweede evaluatie-implementatie in Blockly.


## Dashboard – meldingenindicator (13 november 2026)
In de rechterbovenhoek van de kopregel **Meldingen** staat een ronde uitroeptekenindicator wanneer er aandacht nodig is:
- **Rood, knipperend:** minimaal één melding heeft status `active`.
- **Amber, knipperend:** minimaal één melding heeft status `unknown` of de meldingen-API kon niet worden geladen. Dit duidt op een onbetrouwbare/onvolledige status en niet op een bevestigde actieve melding.
- **Niet zichtbaar:** alle meldingsvoorwaarden zijn betrouwbaar geëvalueerd en er zijn geen actieve meldingen.

De indicator heeft een toegankelijke label en tooltip in Nederlands en Engels. Bij `prefers-reduced-motion` blijft het symbool zichtbaar maar knippert het niet.


## Instellingen – omschrijving meldingenpagina (13 november 2026)
De pagina Instellingen → Meldingen toont bovenaan dezelfde links uitgelijnde korte toelichting als de overige instellingenpagina's. De tekst gebruikt de bestaande i18n-sleutel `notifications.subtitle` (NL: 'Beheer de voorwaarden achter dashboardmeldingen met Blockly.'). Er wordt geen dubbele paginatitel toegevoegd, omdat de selectiekaart en editor hun eigen koppen hebben.


## Meldingsindicator – rustiger knipperen (13 november 2026)
Op verzoek is de knippercyclus van de meldingsindicator vertraagd van 1,15 naar 2,4 seconden. De bestaande animatievorm, kleuren en `prefers-reduced-motion`-ondersteuning blijven ongewijzigd.


## Meldingsindicator – 20% langzamer knipperen (13 november 2026)
Op verzoek is de knippercyclus nogmaals met 20% verlengd: van 2,4 naar 2,88 seconden. Kleuren, animatievorm en ondersteuning voor `prefers-reduced-motion` blijven ongewijzigd.


## Instellingen – gedeeld ontwerpsysteem en voorbereiding op thema's (15 november 2026)

Alle instellingenonderdelen volgen één gedeeld ontwerpsysteem: Algemeen, Snelle acties, Meldingen, Meetwaardetegels, Weer, de navigatie en de bijbehorende keuzemenu's/editors. Componenten gebruiken semantische CSS-tokens in plaats van eigen hardgecodeerde themakleuren. De gedeelde klasse `settings-interactive` bepaalt hover-, focus-, touch- en overgangsgedrag. Geselecteerde opties behouden hun eigen geselecteerde achtergrond en krijgen bij hover een afzonderlijke omlijning.

De huidige tokenwaarden vormen het donkere standaardthema. De structuur is voorbereid op toekomstige thema's die de semantische `--settings-*` tokens en `--ui-color-scheme` overschrijven. Een themawisselaar, themakeuze-opslag en een licht thema vallen nadrukkelijk nog buiten deze implementatie; eerst wordt de huidige instellingeninterface op de tablet visueel gevalideerd. De technische conventies staan in de [Settings UI design system developer guide](../10-ontwikkelaarshandleiding/settings-design-system.md).


## Instellingen – beperkte themascope en componentstandaarden (15 november 2026)

- De instellingen behouden de bestaande donkere vormgeving als uitgangspunt; deze refactor mag de huidige visuele presentatie en werking niet onbedoeld veranderen.
- Een toekomstig thema mag uitsluitend visuele eigenschappen aanpassen: achtergronden/oppervlakken, tekstkleuren, accentkleur, randkleuren, schaduwen en optioneel hoekradius.
- Afmetingen, positionering, typografie, fontgroottes, spacing, interacties, overgangen en responsive gedrag blijven gelijk tussen thema's.
- De gedeelde componentstandaarden omvatten kaarten/panelen, instellingenrijen, labels/beschrijvingen, invoervelden/selects, primaire/secundaire/gevaarlijke knoppen, toggles/selecties en statusmeldingen/badges.
- Er wordt geen themawisselaar, opgeslagen themavoorkeur, licht thema of uitgebreid themasysteem gebouwd in deze stap.
- Uitvoering gebeurt op featurebranch `feature/settings-design-system-v2`; `phase_1_foundation` blijft onaangeroerd totdat de gebruiker de integratie goedkeurt.


### Implementatiestatus v2 (15 november 2026)

- De vier circulaire CSS custom properties voor Blockly-workspace en source-menu oppervlakken hebben concrete donkere standaardwaarden gekregen.
- Instellingenregels die voor oppervlakken, tekst en tab-/accentkleuren nog dashboardbrede tokens gebruikten, zijn omgezet naar de instellingen-tokens `--settings-panel-*`, `--settings-tab-*` en `--settings-accent-*`. De standaardwaarden verwijzen naar de bestaande dashboardpaletwaarden om de huidige vormgeving te behouden.
- De statusrij- en tokenlijstscheidingslijnen en Blockly-veldoutline gebruiken nu semantische instellingen-tokens.
- De enige resterende letterlijke kleuren in het instellingen-CSS-gedeelte zijn de multicolor merkbol en de herkenbare weerconditiekleuren. Dit zijn expliciete semantische uitzonderingen.
- Broncontrole: geen zelfverwijzende CSS custom properties, geen ongedefinieerde `var(--...)`-verwijzingen en alle 15 native select-elementen in `main.tsx` gebruiken `settings-interactive`.
- Build, tests, CI en visuele controle op de tablet zijn op dit moment nog niet bevestigd; deze blijven onderdeel van de afronding.


## Meetwaardetegels – bronselectie (16 november 2026)

- De aparte selectie van een ruimte vervalt. Een apparaat wordt rechtstreeks gekozen uit de volledige apparatenlijst; er wordt niet langer eerst op Homey-ruimte gefilterd.
- De apparaatkeuze is variant B: searchable dropdown met zoekbalk. Offline apparaten blijven selecteerbaar en krijgen een amberkleurig statuslabel.
- De capability-/meetwaardekeuze blijft in deze stap een gewone dropdown. De keuze voor eventuele verdere dropdownmigraties wordt per onderdeel met de gebruiker afgestemd.
- De opgeslagen bronstructuur (apparaat-ID + capability-ID) en de backend-API blijven ongewijzigd; de ruimte was alleen een frontendfilter.

## Meetwaardetegels – veilige initiële render (16 november 2026)

De instellingenpagina wordt al gerenderd terwijl de meetwaardetegels nog asynchroon worden geladen. In die eerste render bestaat er nog geen geselecteerde tegel. Afgeleide waarden van de Logic-picker moeten daarom zowel de selectie als de bron defensief uitlezen. De UI mag niet aannemen dat er vóór afronding van het laden al een geselecteerde tegel bestaat. Dit voorkomt een JavaScript-crash en een leeg/zwart instellingenmenu.

## Snelle acties – apparaatpicker Variant B (16 november 2026)

De apparaatselectie in de editor voor Snelle acties is gestandaardiseerd als Variant B, in lijn met de apparaat- en Logic-picker bij Meetwaardetegels. De picker behoudt zoeken op apparaatnaam, geselecteerde status, offline-waarschuwing, lege-resultatenmelding en resultatenteller. De gedeelde CSS-klassen zijn toegevoegd aan trigger, zoekrij, resultatenlijst, opties, lege status en footer; de bestaande selectie- en opslaglogica blijft ongewijzigd.

## Weer – gedeelde searchable picker-klassen (16 november 2026)

De negen bronselecties op de Weer-instellingenpagina gebruiken nu ook de ontbrekende gedeelde klassen voor de resultatenlijst, alle opties (apparaten én Logic-variabelen) en beide lege-resultatenmeldingen. De bestaande groepskoppen voor apparaten en Logic-variabelen, bronlabels en offline-status blijven behouden. Er is bewust geen resultatenteller/footer toegevoegd: de twee expliciet benoemde resultaatgroepen geven de indeling al aan. Er is geen wijziging aangebracht aan bronselectie, filtering, inschakelen/uitschakelen of opslaggedrag.


## Instellingen – Annuleren alleen bij niet-opgeslagen wijzigingen (16 november 2026)

De knop **Annuleren** wordt op alle instellingenpagina's met een Opslaan/Annuleren-actievoet uitsluitend getoond wanneer er niet-opgeslagen wijzigingen zijn ten opzichte van de laatst opgeslagen configuratie. Zonder wijzigingen is de knop verborgen (niet slechts uitgeschakeld). Na Annuleren worden de laatst opgeslagen waarden hersteld en verdwijnt de knop weer. Ook wanneer de gebruiker alle wijzigingen handmatig terugdraait naar de opgeslagen waarden, wordt de knop verborgen. Dit gedrag is consistent op alle instellingenpagina's.


## Instellingen – veilige onderruimte bij scrollen (16 november 2026)

Instellingenpagina's houden onderaan het scrollbare contentgebied minimaal 44px vrije ruimte. De gedeelde `.quick-settings-page` voegt 24px interne onderpadding toe. Hierdoor staan Opslaan-/Annuleren-acties niet tegen de viewport-onderrand en blijft de volledige onderrand van de laatste editor-kaart zichtbaar. Op lage schermen blijft de inhoud scrollbaar; kaartinhoud of actieknoppen worden niet afgeknipt om alles in één viewport te forceren.


## Instellingen – actievoet met vaste vrije ondermarge (16 november 2026)

Aanvullend op de onderpadding van het scrollgebied krijgt de gedeelde actievoet `.settings-bottom` een eigen ondermarge van 20px en `flex: 0 0 auto`. Dit voorkomt dat `margin-top:auto` de actieknoppen alsnog tegen de onderrand van de beschikbare flexruimte plaatst. De pagina blijft normaal scrollbaar; de actievoet overlapt de editor-kaarten niet.


## Instellingen – actievoet sticky binnen scrollgebied (16 november 2026)

De gedeelde actievoet is op desktop/tablet sticky aan de onderzijde van `.settings-content` met 20px afstand tot de onderrand en 20px eigen ondermarge. Dit geeft een voorspelbare zichtbare marge, ook bij lange instellingenpagina's. De actievoet blijft in de documentstroom zodat de inhoud niet wordt overlapt. Op mobiele layouts (maximaal 700px) is de actievoet statisch.


## Standaard dropdownvarianten (16 november 2026)

Instellingen-dropdowns worden voortaan ingedeeld in drie vaste standaarden:

- **Variant A – Eenvoudige dropdown:** kleine vaste keuzelijst, zonder zoekveld.
- **Variant B – Zoekbare dropdown:** grotere vlakke lijst met zoekveld, geselecteerde optie en lege-resultatenmelding.
- **Variant C – Gegroepeerde zoekbare dropdown:** zoekbare lijst met betekenisvolle groepen/groepskoppen en waar relevant status- of informatielabels.

Kies de lichtste variant die de gebruiker goed helpt. Aantal meetwaardetegels (2, 4, 6) is een Variant A-keuze. De apparaat-, Logic- en Flow-pickers zijn Variant B. De gegroepeerde Weather-bronpickers zijn Variant C. Deze indeling is de standaard voor nieuwe en om te zetten dropdowns; behoud bij aanpassingen de bestaande selectie-, opslag- en toegankelijkheidslogica.


### Variant A – aantal meetwaardetegels als referentie (16 november 2026)

De native select voor het aantal meetwaardetegels (2, 4, 6) wordt vervangen door de custom eenvoudige dropdown van Variant A. De popup toont uitsluitend de drie vaste opties, zonder zoekveld. Selectie, sluiten bij buitenklik/Escape en bestaande editor-/tegelgedrag blijven intact. Deze implementatie dient als visuele en functionele referentie voor de overige kleine vaste native select-keuzelijsten.


### Meetwaardetegels – preview schaalt mee bij zes tegels (16 november 2026)

De voorbeeldkaart moet bij zes meetwaardetegels automatisch voldoende hoogte krijgen voor het raster van twee kolommen en drie rijen. Alle previewtegels blijven volledig binnen de kaart, inclusief de onderste rij en de kaartonderrand. De bestaande tegelgrootte en representatie worden behouden; geen clipping of overlap.


## Meetwaardetegels – preview/editor/actievoet zonder overlap (16 november 2026)

De preview bij zes tegels moet de volledige drie rijen tonen. De linker tegelconfiguratiekaart en rechter previewkaart strekken binnen dezelfde gridrij mee tot de hoogte van de grootste kaart, zodat de infobalk links niet tegen of onder de onderste previewrij schuift. De editor volgt als normale volgende sectie en overlapt de preview niet. De algemene instellingenactievoet is niet sticky maar volgt in de documentstroom na alle inhoud; zo worden editorvelden en statusmeldingen nooit door Opslaan/Annuleren bedekt. Bij korte pagina's mag de actievoet met auto-marge onderaan staan.


### Meetwaardetegels – editor als derde gridrij (16 november 2026)

De meetwaardetegel-editor wordt een directe child van `.measurement-workspace`. De twee configuratie-/previewkaarten blijven de eerste rij (naast elkaar waar de ruimte dat toelaat); de editor beslaat daarna de volledige breedte als derde rij. In de smalle layout valt alles in één kolom. De editor mag niet absoluut of fixed gepositioneerd worden en mag de hoogte van de bovenste kaarten niet beïnvloeden door overlap.


## Meetwaardetegels – pagina opnieuw opgebouwd (16 november 2026)

De instellingenpagina krijgt een zelfstandige layout, los van Quick Actions: twee gelijkwaardige kaarten (configuratie en preview) verdelen de volledige contentbreedte; bij maximaal 900px stapelen ze. De bewerkkaart staat als normale derde rij over de volledige breedte. De preview hergebruikt de daadwerkelijke dashboardklassen `.temperature-grid` en `.temperature-tile` met dezelfde count-rijindeling, zodat de tegels hetzelfde vaste formaat en uiterlijk houden als op het dashboard. Geen absolute/fixed editorpositie, vaste kaarthoogtes die inhoud afknippen of overlappende actievoet.
