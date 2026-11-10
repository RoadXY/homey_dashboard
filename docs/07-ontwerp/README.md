# Mockups en ontwerpgoedkeuring

## Status
De gebruiker heeft de hoofdschermmockup en de meldingskaartvormgeving goedgekeurd, inclusief de correctie dat kritieke meldingen een donker roodgetinte achtergrond krijgen. De instellingenpagina en het volledige functionele ontwerp moeten nog worden besproken en goedgekeurd; implementatie start nog niet.

## Vastgestelde visuele richting
- Donkere, rustige en minimalistische basis.
- Achtergrond mag een subtiel speels verloop/organische vormgeving hebben, geïnspireerd op de eerste mockup, maar zonder heftige of felle kleurvlakken.
- Actieknoppen zijn neutraal en onderling gelijk vormgegeven; geen decoratieve knopkleuren.
- Kleur wordt uitsluitend functioneel ingezet, bijvoorbeeld voor meldingsniveaus en relevante statussen.
- Hoge leesbaarheid vanaf circa vier meter afstand; duidelijke, grote tekst en waarden.

## Hoofdschermindeling
- Kolomverhouding: links 40%, rechts 60%; dit vervangt de eerdere voorlopige 50/50-verdeling.
- Kolomverhouding: links 40%, rechts 60%.
- Linkerzijde: grote klok en datum, weerinformatie en vier temperatuurtegels.
- Temperatuurtegels: vier bijna vierkante tegels in een 2×2-indeling.
- Temperatuur-iconen zijn verwijderd; ruimtenamen en temperatuurwaarden worden groter weergegeven binnen dezelfde vaste tegelafmetingen.
- De vier labels zijn Woonkamer, Keuken, Sem en Bram; bij Sem en Bram staat niet het woord ‘Slaapkamer’.
- Rechterzijde: acht actieknoppen bovenaan, zonder afzonderlijke kop/balk ‘Snelle acties’; de bovenkant van de knoppenrij lijnt uit met de bovenkant van de klok-/datumkaart.
- Het meldingenpaneel staat direct onder de actieknoppen en wordt omhooggeschoven om meer ruimte voor meldingskaarten te creëren.
- De twee mediaspelerkaarten/-knoppen vervallen volledig uit het dashboard.
- Meldingen onder de actieknoppen in twee kolommen.
- Alle meldingskaarten hebben dezelfde vaste afmetingen, bijna vierkant; tekst mag over meerdere regels lopen.
- Alleen het meldingenpaneel mag scrollen wanneer er meer meldingen zijn dan passen.

## Meldings- en kleurgebruik
- Kritiek: een duidelijk roodgetinte achtergrond met contrasterende, goed leesbare tekst; alleen een rood icoon of rode rand is niet voldoende.
- Waarschuwing: een donker geel/ambergetinte achtergrond met contrasterende, goed leesbare tekst.
- Info en overige meldingen behouden de neutrale donkere achtergrond van de gewone kaarten.
- Waarschuwing en info krijgen herkenbare, maar beheerste functionele accenten.
- Geen decoratieve kleurvlakken op actieknoppen of temperatuurtegels.
- Meldingskaarten blijven qua afmetingen uniform, ongeacht inhoud.


- De vier temperatuurtegels zijn exact even groot en staan in een vast 2×2-raster.


- De acht actieknoppen staan in één horizontale rij boven de meldingen, zoals in de mockup. De knoppen behouden de eerder afgesproken volgorde. De gebruiker accepteert dat de knoppen op het tabletscherm compact naast elkaar staan, omdat bediening bewust dichtbij het scherm gebeurt.

## Nog te bespreken / goed te keuren
1. Instellingenpagina-mockup.
2. Functionele beschrijving van meldingen en knoppen.
3. Open technische keuzes.

Geen implementatie starten voordat de mockups en het functioneel ontwerp expliciet zijn goedgekeurd.


## Spatiëring – aanvullende ontwerpregel (10 november 2026)
De gebruiker wil dat alle met rode markeringen aangegeven afstanden dezelfde tussenruimte krijgen. Dit geldt expliciet voor:
- tijdkaart naar weerkaart;
- weerkaart naar temperatuurtegels;
- linkerkolom naar rechterkolom;
- actieknoppenrij naar meldingenpaneel;
- horizontale en verticale tussenruimtes tussen meldingskaarten en actieknoppen.

De mockup is hierop aangepast met één consistente standaardafstand tussen de dashboardkaarten en onderdelen. Binnenruimte in een kaart mag passend blijven bij de inhoud, maar de buitenste tussenruimtes moeten uniform zijn.


## Meldingenpaneel – symmetrische randruimte en lijnaccenten (10 november 2026)
De rechterzijde van het meldingenpaneel krijgt dezelfde binnenmarge als de linkerzijde: de afstand van de buitenste meldingskaarten tot de paneelrand moet links en rechts gelijk zijn. De decoratieve verticale lijnaccenten aan beide zijkanten moeten even lang zijn en geleidelijk over een langere lengte vervagen in de achtergrond. De gebruiker wil een zachte, langzame overgang zoals in het bestaande ontwerp, maar uitgesmeerd over een grotere afstand.


## Verfijning fade links van meldingen (10 november 2026)
De gebruiker vraagt specifiek om de verticale overgang links van het meldingenpaneel (in de gemarkeerde cirkel) langzamer en over een grotere lengte te laten vervagen. Maak deze overgang langer uitgesmeerd en zachter, zodat de lijn vrijwel ongemerkt in de achtergrond verdwijnt. Overige onderdelen blijven gelijk.


## Instellingen openen – verborgen bediening (10 november 2026)
De gebruiker kiest expliciet voor lang indrukken op de tijdkaart als verborgen manier om de instellingen te openen. Er wordt geen tandwiel, instellingenicoon of zichtbare knop toegevoegd. De tijdkaart behoudt zijn bestaande uiterlijk. De gegenereerde variant met extra knop en vervormde labels/iconen is nadrukkelijk afgekeurd en wordt niet als referentie gebruikt.


## Eerste concept instellingenpagina (10 november 2026)
- Eerste visuele verkenning gemaakt in dezelfde donkere, rustige stijl als het goedgekeurde hoofdscherm.
- Voorlopige indeling: navigatie links en inhoud/rechterpaneel rechts, met een duidelijke terugkeeractie naar het dashboard.
- Voorlopige navigatiecategorieën in de conceptmockup: Algemeen, Dashboard, Meldingen, Apparaten, Homey en Systeem.
- Dit is uitsluitend een eerste layoutverkenning en nog niet door de gebruiker goedgekeurd. De getoonde voorbeeldinstellingen (zoals thema, helderheid, verversinterval, taal en schermoriëntatie) zijn niet automatisch functionele eisen of definitieve opties.
- De definitieve inhoud en navigatiestructuur worden iteratief met de gebruiker vastgesteld voordat implementatie start.


## Instellingenpagina – pagina Algemeen
De gebruiker kiest ervoor om op de pagina Algemeen ook datum-, tijd- en verversingsinstellingen op te nemen, naast algemene informatie en dashboardstatus. De concrete keuzemogelijkheden en standaardwaarden moeten nog worden ontworpen.

### Tijdweergave
De gebruiker kiest voor beide tijdnotaties als instelbare opties: 24-uursnotatie en 12-uursnotatie (AM/PM). De concrete bediening (bijvoorbeeld keuzelijst of schakelaar) wordt later in de mockup bepaald.

### Datumweergave
Gekozen is voor de korte datumvariant, bijvoorbeeld `di. 10 nov. 2026`.

### Vernieuwen van dashboardgegevens
Gekozen is voor automatische verversing met verschillende intervallen: belangrijke gegevens vaker dan minder belangrijke gegevens. De exacte intervallen per categorie worden later uitgewerkt.

### Pagina Algemeen – statusinformatie
De pagina toont zes onderdelen: verbindingsstatus Homey Pro, verbindingsstatus dashboardserver, laatste succesvolle gegevensverversing, dashboardversie, uptime van de dashboardserver en opslag- en geheugengebruik.

### Datum- en tijdinstellingen
Op de pagina Algemeen kan de gebruiker tijdnotatie, datumweergave en tijdzone instellen.

### Standaardtijdzone
De standaardtijdzone is `Europe/Amsterdam`, met automatische zomer- en wintertijd.

### Weergave serverresources
Opslag- en geheugengebruik worden tekstueel getoond, zonder grafische balken.

### Serverwaarschuwingen
Er worden op de pagina Algemeen geen waarschuwingen getoond. De serverstatussen blijven wel zichtbaar als tekstuele waarden.

### Dashboardversie
Toon zowel het versienummer als de datum van de laatste update.

### Uptimeweergave
De uptime wordt compact weergegeven, bijvoorbeeld `3d 04u 12m`.

### Instellingen opslaan
De pagina gebruikt één algemene knop **Opslaan** onderaan de pagina voor alle gewijzigde instellingen.

### Niet-opgeslagen wijzigingen
Bij het verlaten van de pagina met niet-opgeslagen wijzigingen verschijnt een bevestigingsvenster met drie keuzes: opslaan, weggooien of blijven.

### Indeling pagina Algemeen
Alle instellingen en statusinformatie worden in één gecombineerd overzicht getoond; er komen geen afzonderlijke gegroepeerde blokken.

### Presentatiestijl pagina Algemeen
Combinatie van compacte lijst voor instellingen en compacte kaarten voor systeemstatusinformatie.

### Rangschikking systeemstatuskaarten
De kaarten staan in één horizontale rij, voor zover de schermbreedte dit toelaat.

### Terugkeerknop
Linksboven staat een duidelijke knop **← Dashboard** om terug te keren naar het dashboard.

### Actieve navigatieoptie
De geselecteerde optie in de navigatiekolom krijgt een subtiele lichtere achtergrond.

### Pictogrammen navigatie
Alle navigatie-items krijgen een klein pictogram vóór de categorienaam.

### Navigatiecategorieën
De navigatie bevat zes categorieën: Algemeen, Dashboard, Meldingen, Apparaten, Homey en Systeem.

### Instelbare onderdelen pagina Dashboard
- Temperatuurtegels: kiezen welke kamers en sensoren zichtbaar zijn.
- Weerweergave: kiezen welke weergegevens zichtbaar zijn.
- Snelle actieknoppen: zichtbaarheid, volgorde en instellingen beheren.

### Temperatuurtegels beheren
Het dashboard heeft altijd vier temperatuurtegels. Per tegel kan een beschikbare Homey-temperatuursensor worden geselecteerd. Het aantal tegels blijft vast op vier.

### Namen temperatuurtegels
Per vaste temperatuurtegel zijn zowel de Homey-temperatuursensor als de weergegeven tegelnaam instelbaar.

### Selectie temperatuursensoren
Gebruik één keuzelijst met alle Homey-apparaten die een temperatuurmeting aanbieden.

### Correctie sensorselectie temperatuurtegels
De sensorselectie werkt zoals in de Homey mobiele app: eerst een kamer/ruimte selecteren en vervolgens een sensor uit die ruimte. Dit vervangt de eerder beschreven enkele lijst met alle sensoren. Zoeken wordt in fase 2 toegevoegd.

### Terugnavigatie sensorselectie
De sensorselectie bevat op ieder niveau een duidelijke optie **Terug** om naar het vorige niveau te gaan, bijvoorbeeld vanuit de sensorenlijst terug naar het overzicht van kamers/ruimtes.

### Instelbare weergegevens
Alle volgende onderdelen zijn afzonderlijk zichtbaar te maken of te verbergen: buitentemperatuur, gevoelstemperatuur, weericoon en weersomschrijving, windsnelheid en windrichting, luchtvochtigheid, neerslag, luchtdruk en zonsopkomst en zonsondergang.

### Standaardinstellingen weer
Bij een nieuwe installatie staan alleen de belangrijkste weeronderdelen standaard aan. De precieze selectie van die belangrijkste onderdelen moet nog worden bepaald. Alle acht weeronderdelen blijven afzonderlijk instelbaar.

### Standaard zichtbare weergegevens
Standaard ingeschakeld: buitentemperatuur, gevoelstemperatuur, weericoon en weersomschrijving, windsnelheid en windrichting. Standaard uitgeschakeld: luchtvochtigheid, neerslag, luchtdruk en zonsopkomst en zonsondergang.

### Instelbare eigenschappen snelle actieknoppen
Per knop zijn zichtbaarheid, volgorde, naam, pictogram en actie-instelling configureerbaar.

### Actietype snelle actieknop
Per knop kan worden gekozen tussen het starten van een Homey Flow en het rechtstreeks bedienen van een Homey-apparaat. De configuratievelden worden afhankelijk van die keuze getoond.

### Selectie Homey Flow
Toon een lijst met Flow-namen met een zoekfunctie, zodat de gebruiker de gewenste Homey Flow kan vinden en selecteren.

### Selectie Homey-apparaat
De apparaatselectie verloopt in twee stappen: eerst een Homey-kamer/ruimte kiezen en daarna het gewenste apparaat uit die ruimte selecteren.

### Terugnavigatie apparaatselectie
Op ieder selectieniveau staat een duidelijke knop **Terug**. Vanuit de apparatenlijst kan de gebruiker terug naar het overzicht van Homey-kamers/ruimtes.

### Beschikbare apparaatacties
Na selectie van een apparaat worden automatisch alleen de acties getoond die het apparaat daadwerkelijk ondersteunt.

### Volgorde snelle actieknoppen
De gebruiker kan de volgorde wijzigen door knoppen te verslepen (drag-and-drop).

### MDI-pictogrammen
Per snelle actieknop kan de gebruiker een eigen pictogram uit Material Design Icons (MDI) kiezen. De dashboardstijl bepaalt centraal de grootte en kleur; de gebruiker kan deze niet aanpassen. De kleur volgt de severity-/statuscodering: rood, geel, blauw of groen.

### Correctie actieknoppen en thema's
Alle actieknoppictogrammen hebben dezelfde kleur binnen het actieve thema. Kleur en grootte volgen automatisch het thema en zijn niet afzonderlijk instelbaar. Severity-kleuren gelden niet voor actieknoppen. De gebruiker kiest per actieknop alleen het MDI-pictogram.

In fase 3 worden meerdere vooraf ontworpen dashboardthema's aangeboden; de exacte thema's worden later ontworpen.

### Selectie MDI-pictogrammen
Toon alle beschikbare MDI-pictogrammen in één doorzoekbaar overzicht. Toon een live voorbeeld van het geselecteerde pictogram.

### MDI-zoekfunctie – huidige fase
De pictogramkiezer doorzoekt de door de MDI-website aangeleverde namen. Nederlandse termen, Engelse vertalingen en synoniemen worden nog niet toegevoegd.

### Taalbeheer huidige fase
De dashboardtaal is voorlopig Nederlands. Teksten worden vanaf de huidige fase in JSON-vertaalbestanden beheerd; de daadwerkelijke keuze uit meerdere dashboardtalen volgt in fase 3.

### Structuur vertaalbestanden
Vertaalteksten worden opgeslagen in meerdere JSON-bestanden per taal, opgesplitst per applicatieonderdeel (zoals dashboard, meldingen en instellingen). Dit houdt de bestanden overzichtelijk en maakt uitbreiding naar meerdere talen in fase 3 mogelijk.

### Taalkeuze en ontbrekende vertalingen
Engels is de standaardtaal en terugvaltaal. Nederlands is een optionele taalkeuze, gelijkwaardig aan andere toekomstige talen. Ontbreekt een vertaalwaarde in de geselecteerde taal, dan valt de applicatie terug op de Engelse vertaling. De vertaalbestanden blijven per taal en per applicatieonderdeel opgesplitst.

### Initiële taalinstelling
Een nieuwe installatie start met Engels als geselecteerde dashboardtaal. Dit sluit aan op Engels als standaard- en terugvaltaal; andere beschikbare talen kunnen door de gebruiker worden gekozen.

### Taal automatisch afstemmen op Homey
Bij de eerste installatie detecteert het dashboard de ingestelde taal van Homey en selecteert die taal wanneer vertalingen beschikbaar zijn. Is de gedetecteerde taal niet beschikbaar, dan schakelt het dashboard terug naar Engels en toont het een duidelijke melding met de gedetecteerde taal en de mededeling dat deze niet wordt ondersteund. De gebruiker kan een andere beschikbare taal kiezen. Engels blijft ook de fallback voor afzonderlijke ontbrekende vertalingen.

### Weergave taalkeuze
De taalkeuzelijst toont als eerste **Automatisch (taalnaam)**, bijvoorbeeld **Automatisch (Nederlands)**, op basis van de door Homey gedetecteerde taal. Daaronder staan alle talen waarvoor een volledige of gedeeltelijke vertaling aanwezig is. De optie Automatisch volgt de Homey-taal; bij een niet-beschikbare taal valt het dashboard terug op Engels en meldt het welke taal Homey gebruikt.

### Gedrag taalwijziging
Wanneer de gebruiker een andere dashboardtaal selecteert, wordt de interface direct bijgewerkt zonder paginaherlading. De wijziging vereist geen herstart van de Docker-container.

### Opslaan van taalvoorkeur
Een handmatige taalkeuze wordt blijvend bewaard, ook na browserbezoek en containerherstart. Bij volgende bezoeken wordt deze keuze toegepast in plaats van opnieuw automatisch de Homey-taal te selecteren. Als de gebruiker Automatisch kiest, volgt het dashboard weer de taal van Homey.

### Taalkeuze in instellingen
De taalkeuze wordt geplaatst op de pagina **Algemeen**, samen met de instellingen voor datum en tijd.

### Vormgeving instellingenpagina Algemeen – eerste mockup goedgekeurd
De gebruiker heeft de algemene vormgeving van de eerste mockup voor de pagina Algemeen goedgekeurd: donkere stijl, linker navigatiekolom, tweekolomsindeling en compacte instellingenkaarten. Dit is goedkeuring van de visuele basis en indeling, niet van de voorbeeldinstellingen die in de mockup stonden (zoals thema, accentkleur, kaartgrootte en meldingsschakelaars); die zijn niet automatisch functioneel of besloten.

### Dashboardinstellingen – temperatuurtegels en navigatie
De pagina Instellingen > Dashboard toont alleen de titel **Dashboard**; er wordt geen broodkruimelpad getoond omdat de linker navigatie de huidige sectie al aangeeft. De bovenbalk bevat links de terugactie **← Back to dashboard** en rechts datum en tijd; de knop **Settings** wordt op deze pagina niet getoond. De temperatuurpreview is een vaste 2×2-grid die overeenkomt met het hoofddashboard. Temperatuurtegels bevatten geen pictogrammen. In de preview staat linksboven op iedere tegel een nummer 1 t/m 4 dat correspondeert met de configuratieregel links. De volgorde loopt links naar rechts en daarna van boven naar beneden.

### Live preview temperatuurtegels
De preview rechts wordt direct bijgewerkt wanneer de gebruiker links een tegelnaam, sensor of volgorde wijzigt. De preview toont dus de actuele conceptinstellingen, ook voordat op Opslaan is geklikt.

### Sensorpicker – definitieve navigatieafspraken
De ruimte- en sensorpicker ondersteunt een onbeperkt aantal geneste Homey-ruimteniveaus. Ruimten worden tekstueel weergegeven zonder de Homey-ruimte-iconen. Na het kiezen van een ruimte toont de picker alle apparaten in die ruimte met een geschikte temperatuurcapability, inclusief de beschikbare temperatuurwaarde(n) om de juiste meting te kiezen. Er wordt geen aparte regel **Terug** in de lijst getoond: navigeren naar een eerder niveau gebeurt via het kruimelpad. Bij lange kruimelpaden blijven de laatste drie niveaus zichtbaar (huidig niveau plus twee voorgaande); eerdere niveaus worden samengevouwen achter **…**. Via dit menu kan de gebruiker direct elk verborgen niveau kiezen.

### Weerinstellingen – vaste volgorde
De acht weeronderdelen worden in een vaste volgorde getoond. Slepen om de volgorde te wijzigen is niet beschikbaar. De gebruiker kan uitsluitend de zichtbaarheid per onderdeel aan- of uitzetten. De preview volgt direct de gekozen zichtbaarheid. De vaste volgorde ondersteunt een consistente en eenvoudiger te bouwen weerkaart.

### Live preview weerinstellingen
De preview rechts past zich direct aan iedere wijziging in de zichtbaarheid van de weeronderdelen aan, nog voordat de gebruiker op Opslaan klikt. De vaste volgorde blijft gehandhaafd.

### Quick actions – Flow- en apparaatactie
De bewerkingsdialoog bevat twee expliciete, naast elkaar geplaatste keuzes: **Flow** en **Apparaat**. Flow: selecteer een bestaande Homey Flow via een doorzoekbare lijst. Apparaat: selecteer eerst een ruimte, dan een apparaat en daarna een door dat apparaat ondersteunde actie. Naam en pictogram zijn onafhankelijk van het actietype instelbaar. De actiepreview blijft monochroom; pictogramkleur en -grootte volgen het actieve thema. De live preview toont wijzigingen direct.

### Homey-stijl thema (fase 3)
Voeg in fase 3 een extra vooraf gedefinieerd thema toe: **Homey-stijl**. Visuele referentie is de door de gebruiker aangeleverde screenshot van de Homey-apparatenpagina. Richting: donkere antraciet/zwart-grijze achtergrond, sobere donkergrijze kaarten en blauwe accentkleur. Dit is een themavariant voor het bestaande Homey Dashboard; de dashboardstructuur en bediening blijven intact. Exacte kleurwaarden, contrasten, typografie en componentdetails worden bij de uitwerking van de thema's bepaald.

### Definitieve navigatie Meldingenpagina
De pagina Meldingen bevat geen tabbladen **Weergave** of **Volgorde**. Alleen **Meldingen** blijft beschikbaar. De weergave van meldingskaarten volgt de eerder vastgelegde vaste presentatie en is niet afzonderlijk configureerbaar. De volgorde wordt automatisch bepaald op basis van niveau (kritisch, waarschuwing, informatie) en binnen ieder niveau op nieuwste activatie eerst.

### Schermvullende meldingeditor en Blockly
De actie **Melding bewerken** en **Melding toevoegen** opent een volledige pagina/schermvullende editor, geen modal. De editor bevat de meldingseigenschappen (naam, pictogram, meldingsniveau, actief/inactief) én een visuele editor voor de volledige voorwaarden. Voor de voorwaarden wordt Blockly als voorkeurskandidaat gebruikt, met eigen styling en domeinspecifieke blokken voor logica zoals AND/OR, tijdsvensters, groter dan en kleiner dan. De editor moet voorwaarden kunnen opbouwen en aanpassen; bestaande of via Homey aangeleverde meldingen zijn niet alleen-lezen.

Alle meldingen zijn dashboard-eigendom qua beheer: aanmaken, bewerken en verwijderen gebeurt vanuit het dashboard, ongeacht de herkomst. In fase 2 wordt apart bepaald via welk mechanisme Homey nieuwe meldingen kan aanleveren (bijvoorbeeld API of toekomstige Homey-app). Blockly is Apache-2.0 open source; de actuele documentatie beveelt JSON-serialisatie aan voor het bewaren en terugladen van workspaces. De uiteindelijke koppeling tussen Blockly-blokken en een gevalideerd voorwaardenmodel moet technisch worden uitgewerkt.

### Responsieve meldingeditor
Ontwerp de schermvullende editor primair voor laptopformaten van 15–16 inch en ondersteun daarnaast een tabletviewport van circa 10 inch voor incidenteel of noodbeheer. Op een 30-inch scherm mag de inhoud een comfortabele maximale breedte behouden en hoeft niet alle beschikbare ruimte gevuld te worden. De Blockly-werkruimte krijgt zoveel mogelijk bruikbare ruimte; op smallere viewports stapelen of herschikken de panelen zodat bediening en voorwaardeneditor bruikbaar blijven.
