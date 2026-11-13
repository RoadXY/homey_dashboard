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
