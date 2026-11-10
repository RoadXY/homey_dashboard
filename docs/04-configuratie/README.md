# Configuratie

## Fase 1
Instellingenpagina beheert:
- Homey-verbinding en basisinstellingen.
- Selectie van apparaten en capabilities voor weer/temperaturen.
- Quick buttons: per knop kan de gebruiker kiezen tussen een Homey Flow en directe apparaatbediening.
- Meldingen: bestaande meldingen aan/uit zetten, naam aanpassen en prioriteit wijzigen. Onderliggende voorwaarden en meetwaarden worden in fase 1 niet via de beheerpagina bewerkt.

Apparaatselectie: toon een overzichtelijke lijst met gevonden Homey-apparaten. Na apparaatselectie kiest de gebruiker de gewenste meetwaarde/capability.

Wijzigingen worden pas definitief na expliciete actie op knop ‘Opslaan’. Als de gebruiker de pagina probeert te verlaten met niet-opgeslagen wijzigingen, verschijnt een waarschuwing.

De beheerpagina is bereikbaar via tablet, computer en telefoon en wordt met een pincode beveiligd. De gebruiker voert de pincode eenmaal per sessie in; na een instelbare periode zonder activiteit wordt automatisch uitgelogd.

De instellingenpagina biedt een testmogelijkheid voor de Homey-verbinding.

## Configuratiebestanden
Voorstel voor beheerbare, versieerbare configuratie:
- config/dashboard.json
- config/devices.json
- config/notifications/ (opgesplitst per categorie)
- config/actions/buttons.json
- config/actions/confirmations.json

JSON moet een schema-versie, stabiele IDs, validatie en begrijpelijke foutmeldingen ondersteunen. Condities verwijzen naar Homey device-ID's en capability-ID's, niet naar veranderlijke displaynamen.

## Fase 2
- Overzicht van alle definieerbare meldingen.
- Bewerken via potloodknop.
- Gespecialiseerde WYSIWYG-meldingeneditor.
- Samengestelde AND/OR-condities.
- Pushmeldingen vanuit Homey Flows.
- JSON blijft compatibel met de editor; fase 1 moet hier architectonisch op voorbereiden.

## Beveiliging
Pincode en eventuele API-keys/secrets worden nooit in Git opgeslagen. PIN-sessies verlopen na een instelbare periode van inactiviteit. Details zoals opslag, rate limiting en herstelprocedure moeten nog worden ontworpen.


## Algemeen – afgesproken instellingenpagina-onderdelen
De pagina Algemeen bevat naast algemene informatie/dashboardstatus ook instellingen voor datumweergave, tijdweergave en verversingssnelheid. De precieze opties en standaardwaarden worden nog vastgesteld.

De tijdweergave is instelbaar tussen 24-uursnotatie en 12-uursnotatie (AM/PM).

De datumweergave gebruikt de korte variant, bijvoorbeeld: `di. 10 nov. 2026`.

Dashboardgegevens worden automatisch ververst met verschillende intervallen: belangrijke gegevens vaker dan minder belangrijke gegevens. De concrete intervallen worden later per gegevenscategorie bepaald.

Op de pagina **Algemeen** worden de volgende statusgegevens getoond: verbindingsstatus Homey Pro, verbindingsstatus dashboardserver, laatste succesvolle gegevensverversing, dashboardversie, uptime van de dashboardserver en opslag- en geheugengebruik.

Op de pagina **Algemeen** zijn de volgende datum- en tijdinstellingen beschikbaar: tijdnotatie, datumweergave en tijdzone.

De standaardtijdzone is `Europe/Amsterdam`, inclusief automatische overgang tussen zomer- en wintertijd.

Opslag- en geheugengebruik worden als tekstuele waarden weergegeven, zonder grafische voortgangsbalken.

Op de pagina Algemeen worden geen serverwaarschuwingen getoond; alleen de statuswaarden worden weergegeven.

De dashboardversie wordt weergegeven met het versienummer en de datum van de laatste update.

De uptime van de dashboardserver wordt compact weergegeven, bijvoorbeeld `3d 04u 12m`.

Instellingen worden centraal opgeslagen met één algemene knop **Opslaan** onderaan de pagina.

Wanneer de gebruiker de pagina verlaat met niet-opgeslagen wijzigingen, verschijnt een bevestigingsvenster met de keuzes: wijzigingen opslaan, wijzigingen weggooien of op de pagina blijven.

De pagina **Algemeen** presenteert alle gekozen instellingen en systeemstatusinformatie in één gecombineerd overzicht, zonder deze onder te verdelen in afzonderlijke blokken.

De pagina combineert twee presentatiestijlen: instellingen worden als compacte lijst weergegeven en systeemstatusinformatie als compacte kaarten.

De systeemstatuskaarten worden in één horizontale rij geplaatst, voor zover de beschikbare schermbreedte dit toelaat.

De instellingenpagina krijgt linksboven een duidelijke terugkeerknop met het label **← Dashboard**.

In de navigatiekolom wordt de actieve pagina aangegeven met een subtiele lichtere achtergrond achter de geselecteerde optie.

Elk navigatie-item krijgt een klein pictogram vóór de categorienaam.

De instellingen-navigatie bevat de zes categorieën: **Algemeen**, **Dashboard**, **Meldingen**, **Apparaten**, **Homey** en **Systeem**.

Op de pagina **Dashboard** zijn deze onderdelen instelbaar: welke kamers en sensoren zichtbaar zijn in de temperatuurtegels; welke weergegevens zichtbaar zijn; en de zichtbaarheid, volgorde en instellingen van snelle actieknoppen.

Het aantal temperatuurtegels staat vast op **vier**. Per tegel kan de gebruiker selecteren welke beschikbare Homey-temperatuursensor de temperatuur aanlevert. Het aantal tegels en de tegelindeling zijn niet instelbaar.

Naast de sensorselectie kan de gebruiker ook de naam van elk van de vier temperatuurtegels zelf aanpassen.

De sensorselectie voor temperatuurtegels is één keuzelijst met alle Homey-apparaten die een temperatuurmeting aanbieden; apparaten worden niet op ruimte gegroepeerd.

**Correctie sensorselectie:** de eerdere keuze voor één ongesorteerde lijst vervalt. De selectie volgt de Homey mobiele app: eerst een Homey-kamer/ruimte kiezen en daarna een temperatuursensor binnen die ruimte. In fase 2 wordt zoeken toegevoegd om sensoren sneller te vinden.

Bij de selectie via kamer/ruimte en daarna sensor is op elk niveau een duidelijke navigatieoptie **Terug** beschikbaar om naar het vorige niveau te gaan (van sensorlijst terug naar kamers/ruimtes).

Op de pagina **Dashboard** kan de gebruiker alle volgende weergegevens afzonderlijk aan- of uitzetten: buitentemperatuur, gevoelstemperatuur, weericoon en weersomschrijving, windsnelheid en windrichting, luchtvochtigheid, neerslag, luchtdruk en zonsopkomst en zonsondergang.

Bij een nieuwe installatie zijn standaard alleen de belangrijkste weeronderdelen ingeschakeld. Welke onderdelen precies als belangrijkste gelden, moet nog worden vastgesteld; de overige onderdelen blijven optioneel en afzonderlijk aan-/uitzetbaar.

De volgende vier weeronderdelen staan standaard aan bij een nieuwe installatie: buitentemperatuur, gevoelstemperatuur, weericoon en weersomschrijving, en windsnelheid en windrichting. Luchtvochtigheid, neerslag, luchtdruk en zonsopkomst en zonsondergang staan standaard uit.

Per snelle actieknop kan de gebruiker de zichtbaarheid, volgorde, naam, pictogram en actie-instelling configureren.

Per snelle actieknop kiest de gebruiker het actietype: **Homey Flow starten** of **Homey-apparaat bedienen**. De verdere configuratie hangt af van het gekozen actietype.

Bij het actietype **Homey Flow starten** selecteert de gebruiker een Flow uit een lijst met Flow-namen. De lijst heeft een zoekfunctie.

Bij het actietype **Homey-apparaat bedienen** kiest de gebruiker eerst een Homey-kamer/ruimte en daarna een apparaat uit die ruimte.

Bij apparaatselectie is op ieder niveau een duidelijke knop **Terug** beschikbaar, zodat de gebruiker vanuit de apparatenlijst terug kan naar de kamer-/ruimtelijst.

Bij een geselecteerd Homey-apparaat toont de configuratie automatisch uitsluitend de acties die dat apparaat daadwerkelijk ondersteunt.

De volgorde van snelle actieknoppen wordt aangepast door de knoppen te verslepen (drag-and-drop).

### Pictogrammen snelle actieknoppen
De gebruiker kiest per snelle actieknop zelf het MDI-pictogram. Kleur en grootte worden centraal door het dashboard bepaald en zijn niet door de gebruiker instelbaar. De pictogramkleur volgt de severity-/statuskleur volgens de afgesproken kleurcodering: rood, geel, blauw of groen.

### Correctie pictogrammen en thema's
Voor snelle actieknoppen kiest de gebruiker uitsluitend het MDI-pictogram. De kleur van alle actieknoppictogrammen is uniform en wordt automatisch bepaald door het actieve dashboardthema; de gebruiker stelt kleur of grootte niet afzonderlijk in. Severity-kleuren zijn niet van toepassing op actieknoppen.

Voor fase 3 wordt voorzien in een aantal vooraf ontworpen thema's. De concrete themavarianten en hun kleuren worden later uitgewerkt.

Voor het kiezen van een actieknoppictogram gebruikt de gebruiker één doorzoekbaar overzicht met alle beschikbare MDI-pictogrammen en een live voorbeeld van het geselecteerde pictogram.

### Zoeken MDI-pictogrammen en meertaligheid
In de huidige fase gebruikt de pictogramkiezer uitsluitend de namen/zoektermen zoals de MDI-website deze aanlevert. Nederlandse zoektermen, Engelse vertalingen en synoniemen vallen buiten de huidige fase.

### Dashboardtaal huidige fase
De standaarddashboardtaal is Nederlands. Alle zichtbare dashboardteksten worden vanaf de huidige fase via JSON-vertaalbestanden beheerd, zodat uitbreiding naar meerdere talen in fase 3 mogelijk is zonder teksten uit de applicatiecode te hoeven halen.

### Indeling JSON-vertaalbestanden
Vertalingen worden per taal én per onderdeel opgesplitst in meerdere JSON-bestanden, bijvoorbeeld afzonderlijke bestanden voor dashboard, meldingen en instellingen. De dashboardtaal is in de huidige fase Nederlands; deze structuur bereidt uitbreiding naar meerdere talen in fase 3 voor.

### Taalkeuze en terugvalgedrag
Engels is de standaard- en terugvaltaal van het dashboard. Nederlands is een optionele keuzetaal, net als toekomstige talen. Als een vertaling ontbreekt in de gekozen taal, wordt de Engelse tekst getoond.

### Standaardtaal nieuwe installatie
Bij een nieuwe installatie wordt Engels standaard geselecteerd. De gebruiker kan daarna zelf een andere beschikbare taal kiezen.

### Correctie: initiële taal op basis van Homey
Bij de eerste installatie wordt de taalinstelling van Homey uitgelezen. Als voor die taal vertalingen beschikbaar zijn, wordt die taal automatisch als dashboardtaal geselecteerd. Als die taal niet beschikbaar is, gebruikt het dashboard Engels als terugvaltaal en meldt het duidelijk welke Homey-taal is gedetecteerd en dat deze nog niet beschikbaar is. De gebruiker kan vervolgens zelf een beschikbare taal kiezen. Engels blijft de terugvaltaal voor ontbrekende vertaalwaarden.

### Taalkeuzelijst
De taalkeuzelijst bevat bovenaan de optie **Automatisch (taalnaam)**, waarbij de taalnaam de door Homey gedetecteerde taal is, bijvoorbeeld **Automatisch (Nederlands)**. Daarnaast toont de lijst alle talen waarvoor ten minste een gedeeltelijke vertaling beschikbaar is. Bij Automatisch volgt het dashboard de Homey-taal; als daarvoor geen vertaling beschikbaar is, wordt Engels gebruikt en wordt de gebruiker hierover geïnformeerd.
