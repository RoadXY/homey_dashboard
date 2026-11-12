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

Het aantal meetwaardetegels staat vast op **vier**. Het aantal tegels en de tegelindeling zijn niet instelbaar. Iedere tegel heeft uitsluitend twee instelbare eigenschappen: een eigen weergavenaam en één numerieke meetwaardebron.

De term **meetwaardetegels** vervangt hier de eerdere, te beperkte term temperatuurtegels. Een tegel mag iedere numerieke meetwaarde tonen die via Homey beschikbaar is, bijvoorbeeld temperatuur, luchtvochtigheid, CO₂, PM2.5 of een andere numerieke capability. Ook numerieke Homey Logic-variabelen zijn toegestane bronnen. Boolean- en tekstwaarden worden niet aangeboden.

Bronselectie voor Homey-apparaten: eerst een Homey-kamer/ruimte kiezen en daarna een apparaat en één van de numerieke capabilities van dat apparaat. De ruimtehiërarchie is volledig genest en wordt zonder vaste maximale diepte ondersteund. Alleen apparaten met ten minste één geschikte numerieke meetwaarde worden getoond. De sensorselectie wordt op stabiele Homey-ID's gebaseerd: apparaat-ID plus capability-ID; veranderlijke namen zijn uitsluitend presentatietekst.

Bronselectie voor Homey Logic: een afzonderlijke lijst met numerieke Logic-variabelen. De bron wordt opgeslagen op basis van de stabiele Logic-variabele-ID; de variabelenaam is uitsluitend presentatietekst.

Per meetwaardebron wordt waar beschikbaar de capabilitymetadata gebruikt, waaronder de eenheid (units) en het aantal decimalen (decimals). De eenheid wordt niet handmatig door de gebruiker ingesteld. Bij ontbrekende metadata wordt geen eenheid verzonnen of afgeleid uit alleen de displaynaam. Homey Logic-variabelen bieden niet dezelfde capabilitymetadata; daarvoor wordt standaard geen eenheid getoond. Een toekomstige expliciete handmatige eenheidsinstelling valt buiten de huidige eenvoudige editor.

De backend moet capabilitytype en actuele waarde controleren en uitsluitend eindige numerieke waarden aanbieden/weergeven. Onbeschikbare apparaten, verdwenen capabilities of verwijderde Logic-variabelen mogen de overige tegels niet blokkeren; de betreffende tegel toont een neutrale onbekende/niet-beschikbaar-weergave.

De editor toont vier vaste tegelconfiguraties met naam en bron. De preview wordt direct bijgewerkt bij iedere wijziging, vóór Opslaan. Opslaan bewaart de wijzigingen definitief. Er zijn geen instelbare tegelvolgorde, kleur, pictogram, formaat of eenheid.

De Homey-ruimtepicker volgt de volledige geneste ruimtestructuur. De navigatie gebruikt het aanklikbare kruimelpad; bij lange paden worden de laatste niveaus getoond en tussenliggende niveaus achter een aanklikbare ellipsis verborgen. In fase 2 kan zoeken aan de bronselectie worden toegevoegd.

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

### Direct toepassen taalwijziging
Een handmatige wijziging van de dashboardtaal wordt direct toegepast, zonder de dashboardpagina opnieuw te laden of de Docker-container te herstarten.

### Taalkeuze blijvend onthouden
Een handmatig gekozen dashboardtaal wordt persistent opgeslagen en blijft behouden bij volgende bezoeken en na herstart van de Docker-container. De opgeslagen handmatige keuze heeft voorrang op de automatisch gedetecteerde Homey-taal. De optie Automatisch blijft beschikbaar om weer de Homey-taal te volgen.

### Locatie taalinstelling
De taalkeuze staat op de instellingenpagina **Algemeen**, bij de datum- en tijdinstellingen.

### Live preview temperatuurtegels
De voorbeeldweergave van de temperatuurtegels wordt direct bijgewerkt bij iedere wijziging aan naam, geselecteerde sensor of volgorde. Dit gebeurt al vóórdat de gebruiker op Opslaan klikt; Opslaan bewaart de wijzigingen definitief.

### Sensorselectie – geneste Homey-ruimtes en kruimelpad
De sensorpicker volgt de volledige geneste Homey-ruimtestructuur zonder vaste maximale diepte. Bij selectie van een ruimte worden alleen apparaten getoond die een geschikte temperatuursensor aanbieden; per apparaat wordt de beschikbare temperatuurwaarde getoond en selecteerbaar gemaakt. Ruimte-iconen uit Homey worden niet overgenomen. Navigatie terug gebeurt uitsluitend via het aanklikbare kruimelpad; er staat geen aparte optie Terug tussen de ruimtes of apparaten. Bij lange paden worden het laatste niveau en de twee voorgaande niveaus getoond; tussenliggende niveaus worden achter een aanklikbare ellipsis (…) verborgen, waarmee elk verborgen niveau bereikbaar blijft.

### Weerkaart – vaste volgorde en zichtbaarheid
De volgorde van de acht weeronderdelen staat vast en is niet door de gebruiker te wijzigen. De gebruiker kan wel ieder onderdeel afzonderlijk in- of uitschakelen. Dit houdt de opbouw van de weerkaart voorspelbaar en vereenvoudigt de implementatie en vormgeving van de kaart.

### Live preview weerkaart
De preview van de weerkaart wordt direct bijgewerkt wanneer de gebruiker een van de acht weeronderdelen aan- of uitzet. De preview toont de conceptinstellingen vóór Opslaan; Opslaan bewaart de gekozen zichtbaarheid definitief.

### Quick actions – actietype kiezen
Bij het bewerken van een snelactie kiest de gebruiker expliciet tussen twee actietypen via twee duidelijke keuzeknoppen: **Flow** of **Apparaat**. Bij Flow wordt een bestaande Homey Flow gekozen uit een doorzoekbare lijst; de snelactie start die Flow en de Flow blijft ook handmatig vanuit Homey startbaar. Bij Apparaat kiest de gebruiker eerst een Homey-ruimte, daarna een apparaat en vervolgens een van de acties die dat apparaat ondersteunt. Naam en MDI-pictogram blijven onderdeel van dezelfde bewerking. De preview wordt live bijgewerkt en de pictogrammen blijven monochroom volgens het actieve thema.

### Fase 3 – Homey-stijl thema
Voor fase 3 wordt naast de overige vooraf gedefinieerde dashboardthema's ook een **Homey-stijl thema** toegevoegd. De door de gebruiker gedeelde Homey-apparatenpagina dient als visuele referentie. Het thema krijgt een donkere antraciet/zwart-grijze basis, ingetogen kaartvlakken en blauwe accenten, met behoud van de eigen dashboardindeling en leesbaarheid. De precieze kleuren, contrasten en componentstijlen worden tijdens het themaontwerp in fase 3 uitgewerkt.

### Meldingenpagina – tabblad Weergave verwijderd
Het aparte tabblad **Weergave** wordt niet opgenomen in de instellingenpagina Meldingen. De presentatie van meldingskaarten is al vastgelegd (pictogram, titel en actuele waarde; vormgeving en niveaukleuren volgens de bestaande afspraken) en krijgt in deze fase geen afzonderlijke configuratieopties. De pagina bevat daarom alleen het tabblad **Meldingen**. Het tabblad **Volgorde** blijft eveneens verwijderd; sortering volgt automatisch de afgesproken prioriteit en activatietijd.

### Meldingen – centraal beheer en volledige editor
Alle meldingen worden beheerd door het dashboard, ongeacht of ze handmatig zijn aangemaakt of later via Homey worden aangeleverd. Iedere melding kan in het dashboard worden aangemaakt, bewerkt en verwijderd. Ook de voorwaarden zijn volledig bewerkbaar; meldingen die door Homey zijn aangeleverd zijn niet alleen-lezen. Het bewerken en aanmaken gebeurt in een aparte schermvullende editor in plaats van een klein dialoogvenster. In deze editor kunnen metadata (naam, pictogram, niveau, actief/inactief) en de voorwaarden worden aangepast.

### Blockly als kandidaat voor de voorwaardeneditor
Blockly wordt gekozen als voorkeurskandidaat voor een visuele blokeditor voor meldingsvoorwaarden. De interface wordt met eigen styling en eigen domeinspecifieke blokken ingericht, onder andere voor AND/OR, tijdsvensters, hoger dan en lager dan. Blockly is een open-source client-side bibliotheek onder Apache 2.0. De Blockly-workspace kan met de aanbevolen JSON-serialisatie worden opgeslagen. De definitieve technische architectuur, de set ondersteunde blokken en de omzetting naar een gevalideerd, uitvoerbaar voorwaardenmodel worden tijdens de technische uitwerking vastgesteld.

### Homey als bron van meldingen – fase 2
In fase 2 wordt onderzocht en besloten hoe Homey meldingen aan het dashboard kan aanleveren, bijvoorbeeld via een API-aanroep of een toekomstige Homey-app. Dit verandert niets aan het centrale beheer: na ontvangst worden ook deze meldingen volledig in het dashboard beheerd en zijn ze bewerkbaar en verwijderbaar.

### Responsieve instellingen- en meldingeditor
De instellingen zijn bereikbaar vanaf tablet, laptop en desktop. De ontwerpdoelen zijn een tablet van circa 10 inch (voor incidenteel/noodgebruik) en laptops van 15–16 inch (primair gebruik). Op grotere schermen, zoals 30 inch, mag vrije ruimte overblijven; de interface hoeft niet uitgerekt te worden om de volledige breedte te vullen. De schermvullende meldingeditor en Blockly-werkruimte moeten zich aanpassen aan de beschikbare viewport en op tablet bruikbaar blijven, zonder de laptopervaring te benadelen.

### Fase 1 – meldingen uit Home Assistant importeren
In fase 1 bouwen we nog geen algemene visuele voorwaardeneditor en geen configureerbare blokkenbibliotheek. We nemen de bestaande meldingskaarten/definities uit de Home Assistant YAML over in de dashboardimplementatie als vast geprogrammeerde meldingen, zodat de gebruiker de werking van het dashboard naast Home Assistant kan testen. Alle bestaande HA-voorwaarden en hun combinaties worden exact behouden; er wordt niets zelfstandig aangepast of vereenvoudigd. De eenvoudige instellingen voor meldingen (actief/inactief, naam en meldingsniveau) blijven binnen de eerder afgesproken fase-1-scope. Bewerken van de voorwaarden via Blockly wordt uitgesteld tot fase 2.

### Fase 2 – visuele voorwaardeneditor
De Blockly-voorwaardeneditor, inclusief categorieën, blokkenbibliotheek en het opbouwen/bewerken van voorwaarden, wordt bewaard voor fase 2. De concrete blokcategorieën en beschikbare blokken worden pas in fase 2 ontworpen en vastgesteld.

## Technische architectuur – voorlopige uitgangspunten (11 november 2026)

### Netwerk en Homey-verbinding
De dashboardcontainer draait op de Ubuntu-server. Deze server bevindt zich in een ander VLAN dan Homey Pro 2023. De gebruiker beheert de netwerkregels en zorgt dat de standaard, door Homey ondersteunde communicatie tussen server en Homey mogelijk is. We introduceren geen eigen of onnodige poorten. De exacte API-/verbindingsmethode en poort(en) worden vóór implementatie technisch geverifieerd; er worden op dit moment geen poortnummers vastgelegd.

De backend verzorgt de Homey-communicatie. Homey-authenticatiegegevens worden uitsluitend server-side opgeslagen en zijn nooit beschikbaar in de dashboardbrowser of in GitHub.

### Voorlopige applicatieopbouw
De eerste ontwerpvariant is één zelfstandige Docker-applicatie met een webfrontend en backend. De tablet gebruikt Fully Kiosk Browser om uitsluitend de dashboardwebsite te tonen. De backend haalt Homey-gegevens op, verwerkt deze en levert ze aan de frontend. Configuratie en andere blijvende gegevens worden buiten de container persistent opgeslagen. De definitieve technologiekeuze en communicatiemethode volgen na technische verificatie.


## Instellingen: directe URL's en sessiebeveiliging (12 november 2026)

### Rechtstreekse navigatie
- De instellingen zijn via vaste URL-paden bereikbaar; de SPA-fallback serveert de applicatie ook bij een directe browserrequest naar een instellingenpad.
- Ondersteunde routes in deze implementatiefase:
  - `/settings/general` – Algemeen.
  - `/settings/dashboard/quick-actions` – Dashboard → Snelle acties.
- De route wordt bijgewerkt bij navigatie in het instellingenmenu en ondersteunt de browser-terug-/vooruitknoppen.
- De bestaande verborgen toegang door de klok lang ingedrukt te houden blijft bestaan en opent `/settings/general`.
- Een directe URL omzeilt de PIN-beveiliging niet: bij een ontbrekende of verlopen sessie verschijnt eerst de PIN-poort. Na succesvolle verificatie wordt de oorspronkelijk opgevraagde instellingenroute geopend.

### PIN-sessiecookie
- Na correcte PIN-invoer geeft de server een ondertekende sessiecookie uit met de naam `homey_settings`.
- Cookie-attributen: `HttpOnly`, `SameSite=Strict`, `Path=/` en een vervaltijd van 30 minuten.
- De cookie is niet uitleesbaar vanuit JavaScript. Instellingen-API's valideren de handtekening en vervaltijd server-side; de oude clientgestuurde `x-settings-session`-tokenheader is verwijderd.
- De HMAC-sleutel wordt automatisch aangemaakt als `/app/data/settings-session.key` met bestandsmodus 0600. De Docker Compose-configuratie mount `dashboard_data` op `/app/data`; daardoor blijft de sleutel en dus een nog geldige sessie behouden bij een containerrecreate/update.
- De cookie is een sliding inactivity session: bij geauthenticeerd gebruik en expliciete activiteit wordt de vervaltijd opnieuw op 30 minuten gezet. De browser stuurt hiervoor maximaal eenmaal per minuut een activiteitsping wanneer de gebruiker daadwerkelijk interactie heeft.
- Activiteit bestaat uit pointer/touch, toetsenbord, scrollen en wielinteractie. Achtergrondverversingen tellen niet als gebruikersactiviteit.
- Na 30 minuten zonder gebruikersactiviteit beëindigt de frontend de sessie, wist de cookie en navigeert naar het hoofddashboard. De server weigert ook na cookie-expiratie iedere beschermde instellingen-API-aanroep.
- Handmatig verlaten van de instellingen via de terugknop of browsernavigatie wist de sessiecookie.
- De sessie blijft na een containerupdate geldig zolang de browsercookie niet verlopen is en de persistente volumesleutel behouden blijft. Het verwijderen van het Docker-volume `dashboard_data` maakt de bestaande cookie ongeldig.

### Beveiligingsnotities en randvoorwaarden
- De huidige installatie wordt via plain HTTP op het LAN gebruikt. Daarom wordt het cookie-attribuut `Secure` nog niet gezet; op een HTTPS-deployment moet dit worden ingeschakeld. HTTP biedt geen transportversleuteling en deze oplossing is bedoeld voor het vertrouwde lokale netwerk.
- De PIN zelf en de HMAC-sleutel worden niet in Git opgeslagen. De HMAC-sleutel staat uitsluitend in het persistente data-volume.
- De PIN-poort blijft de enige manier om een nieuwe sessie te starten; alleen het kennen van een instellingen-URL geeft geen toegang.

### Implementatiestatus en testplan
- Frontend-routering, PIN-cookie, sessievalidatie, sliding verlenging, 30-minuten-inactiviteitsafmelding en documentatie zijn bijgewerkt op `phase_1_foundation`.
- GitHub Actions heeft de OpenAPI-validatie en de TypeScript-/productieb build succesvol afgerond op commit `f0ac0b7168fb6fd0a89da7ad97c55aa5b4140987`. De runtime-test op de Ubuntu-server moet nog worden uitgevoerd. Test na deployment: (1) direct openen van Quick Actions URL zonder cookie vraagt PIN; (2) na PIN wordt Quick Actions direct geopend; (3) vernieuwen en containerrecreate behouden een geldige sessie; (4) handmatig verlaten wist de cookie; (5) na 30 minuten zonder interactie keert de pagina terug naar dashboard en vraagt een volgende directe URL opnieuw om PIN.


## Instellingenroutes uitgebreid (12 november 2026)

Alle hoofdcategorieën in de instellingen hebben nu een eigen directe URL. Deze routes vallen onder dezelfde PIN-poort en de bestaande sessiecookie met 30 minuten inactiviteit:

| Onderdeel | URL | Inhoudsstatus |
|---|---|---|
| Algemeen | `/settings/general` | Geïmplementeerd |
| Dashboard → Snelle acties | `/settings/dashboard/quick-actions` | Geïmplementeerd |
| Apparaten | `/settings/devices` | Route actief; inhoud volgt |
| Homey | `/settings/homey` | Route actief; inhoud volgt |
| Systeem | `/settings/system` | Route actief; inhoud volgt |

De zijbalknavigatie werkt voor alle vijf categorieën en werkt de URL bij. De drie onderdelen waarvan de inhoud nog niet is gebouwd tonen een tijdelijke melding in plaats van een niet-werkende/uitgeschakelde menuoptie. De browsergeschiedenis (terug/vooruit) blijft de route synchroniseren.

De bestaande Dashboard-subtabellen Temperatuurtegels en Weer hebben nog geen afzonderlijke inhoudsroutes; op dit moment is alleen Snelle acties als dashboard-subpagina geïmplementeerd. Dit wordt aangevuld zodra die instellingenpagina's worden gebouwd.


## Quick Actions: statusgestuurde apparaattegels en Toggle-bediening (12 november 2026)

### Keuze van de gebruiker
- Bij het configureren van een apparaatactie toont de apparaatkeuze alle beschikbare, wijzigbare boolean-capabilities van het gekozen apparaat. De gebruiker kiest zelf precies één capability voor deze Quick Action.
- We filteren deze lijst dus niet op een veronderstelde hoofdfunctie. Een ventilator kan bijvoorbeeld meerdere boolean-capabilities aanbieden, zoals `onoff`, `onoff.light`, `onoff.buzzer_enabled` en `onoff.light_enabled`; deze worden als afzonderlijke keuzes getoond wanneer Homey ze als wijzigbaar aanbiedt.
- Eén Quick Action bedient één gekozen capability. Wil de gebruiker naast de ventilator ook de ingebouwde lamp bedienen, dan maakt die daarvoor een tweede Quick Action aan.

### Bedieningsopties voor boolean-capabilities
Voor een gekozen wijzigbare boolean-capability zijn drie bedieningsopties beschikbaar:
1. **Aanzetten**: schrijf `true` naar de capability.
2. **Uitzetten**: schrijf `false` naar de capability.
3. **Wisselen (Toggle)**: lees de actuele waarde rechtstreeks uit Homey en schrijf de tegengestelde boolean-waarde terug.

Toggle wordt server-side uitgevoerd op basis van de actuele Homey-waarde, niet op basis van een mogelijk verouderde browserstatus. Bij een ongeldige/onbekende status of een niet-beschikbaar apparaat mag niet blind worden omgeschakeld; de actie geeft dan een fout terug.

### Statusweergave op de bestaande Quick Action-tegel
- De bestaande tegelindeling, naam en het gekozen pictogram blijven behouden.
- Bij een apparaatactie die een boolean-capability gebruikt, weerspiegelt de tegel de actuele waarde van precies die gekozen capability: `true` krijgt de actieve accentkleur en `false` de normale tegelstijl.
- Er wordt geen tekstlabel zoals AAN/UIT onder de tegel getoond; het kleurverschil is de statusindicatie.
- De status wordt uit Homey gelezen en moet ook wijzigingen reflecteren die buiten het dashboard om zijn gedaan. Na een bediening wordt de tegel bijgewerkt zodra de actuele status uit Homey bekend is.
- Andere Quick Actions die dezelfde capability niet bedienen, krijgen niet automatisch dezelfde status.
- Flow-acties krijgen geen blijvende aan/uit-statuskleur; een Flow is een opdracht en heeft niet automatisch een betrouwbare apparaatstatus.

### Afbakening
Deze drie bedieningsopties gelden voor wijzigbare boolean-capabilities. Numerieke en enum-capabilities behouden hun passende waarde-/keuzebediening en krijgen niet automatisch Toggle-gedrag of een aan/uit-kleur. Een dimbare lamp gebruikt voor de status de gekozen boolean-capability (bijvoorbeeld `onoff`); de dimwaarde zelf bepaalt niet of de tegel als aan of uit wordt weergegeven.

Dit is een vastgelegd ontwerpbesluit; de statusgestuurde tegelweergave en de nieuwe Toggle-uitvoering moeten nog worden geïmplementeerd en getest.


### Implementatie Quick Actions: Homey-status en Toggle (12 november 2026)

- De configuratie van een boolean-capability biedt drie keuzes: Aanzetten (`true`), Uitzetten (`false`) en Wisselen (Toggle).
- Bestaande opgeslagen Quick Actions blijven compatibel: ontbreekt de nieuwe `booleanMode`-eigenschap, dan wordt de oude ingestelde boolean-waarde gebruikt als Aanzetten/Uitzetten.
- Toggle wordt door de backend uitgevoerd. De backend haalt de actuele Homey-capabilitywaarde op, weigert te schakelen als deze geen boolean is en schrijft daarna de omgekeerde waarde.
- De dashboard-API levert per apparaatactie de actuele boolean-status van de gekozen capability. De browser ververst deze status iedere vijf seconden en direct na een actie.
- Alleen een actuele `true`-status krijgt de blauwe actieve tegelstijl. `false`, onbekende status, niet-beschikbaar apparaat en Flow-acties krijgen geen actieve stijl.
- De configuratie toont de beschikbare wijzigbare boolean-capabilities van het gekozen apparaat; elke Quick Action bedient precies één capability.
- De huidige implementatie gebruikt periodiek uitlezen als betrouwbare terugval voor apparaten buiten de bestaande vaste realtime-subscriptielijst. Dit geeft maximaal circa vijf seconden vertraging bij externe wijzigingen; een latere uitbreiding kan dynamische Homey-realtime-abonnementen toevoegen.
- Implementatie is gebouwd en CI-getest; runtime-test met echte Homey-apparaten moet na deployment plaatsvinden.


### Quick Actions – correctie live status en boolean-bediening (12 november 2026)

Naar aanleiding van de eerste praktijktest zijn twee tekortkomingen gecorrigeerd:

- De actuele status wordt niet langer uit de mogelijk gecachete `capabilitiesObj.value` gelezen. De backend vraagt de geselecteerde capability nu expliciet op via `api.devices.getCapabilityValue({ deviceId, capabilityId })`. Dit geldt zowel voor de dashboardstatus als voor de bronwaarde van Toggle.
- Na het schrijven van een boolean-waarde wordt de capability opnieuw bij Homey uitgelezen; de API-respons bevat de bevestigde waarde.
- Bij het selecteren van een andere boolean-capability wordt de bedieningsmodus expliciet op **Uitzetten** gezet. Zo kan een eerder gekozen modus van een andere capability niet onbedoeld worden overgenomen.
- De bestaande apparaatinstantie-methode `device.setCapabilityValue({ capabilityId, value })` blijft de schrijfroute; de booleanwaarde wordt expliciet gevalideerd voordat deze naar Homey gaat.
- Deze correctie is door GitHub Actions gebouwd en gevalideerd; de praktijktest op de Ubuntu-server moet na deployment opnieuw worden uitgevoerd, met zowel aan- als uitzetten en statuswijzigingen vanuit Homey.


### Quick Actions – editor overlapt de lijst niet meer (12 november 2026)

- Het bewerkingspaneel wordt niet langer absoluut boven de Quick Actions-werkruimte geplaatst. Het staat nu als afzonderlijk paneel onder de lijst en preview, over de beschikbare werkruimtebreedte.
- Hierdoor kan de achtergrond en schaduw van het editorpaneel de Quick Action-lijst niet meer optisch donkerder maken. Alleen de geselecteerde rij krijgt de geselecteerde stijl.
- Dit is uitsluitend een frontend-layoutcorrectie; selectie-, opslag- en Homey-bedieningslogica blijven ongewijzigd.


### Thema-voorbereiding fase 5 – eerste styling-audit (12 november 2026)

#### Quick Actions – blauwe actieve gradient
- De actieve Quick Action-tegel gebruikt een expliciete blauwe gradient met een heldere blauwe rand, een subtiele blauwe gloed en een lichtblauw pictogram, overeenkomstig de aangeleverde dashboardmockup.
- Alleen `.action-card.is-active` gebruikt deze blauwe actieve stijl. Niet-actieve tegels behouden hun neutrale antracietstijl. De actieve stijl blijft gekoppeld aan de bestaande statuswaarde van de gekozen Homey-capability.
- De kleuren en effecten zijn ondergebracht in semantische CSS-variabelen (`--action-active-*`); componentregels verwijzen naar tokens in plaats van eigen kleurwaarden.

#### Huidige themabaarheid – bevindingen
- Er bestond al een beperkte tokenbasis voor meldingskaarten en meldingsniveaus. Die blijft behouden.
- De dashboardachtergrond, algemene kaarten, tekstkleuren en Quick Action-tegels hebben nu eveneens een eerste semantische tokenlaag.
- De rest van de stylesheet bevat nog vaste kleurwaarden, onder meer in instellingen, navigatie, formulieren, statuslabels, iconenpicker en Flow-picker. De volledige interface is daarom nog niet themabaar en dit wordt nadrukkelijk niet als afgerond voor fase 5 beschouwd.
- De fase-5-uitwerking moet alle visuele componenten via semantische tokens laten werken. Thema's moeten tokens centraal overschrijven; componenten mogen geen thema-specifieke kleurwaarden bevatten.

#### Richtlijn voor fase 5
- Introduceer een expliciete thema-identificatie op de applicatieroot (bijvoorbeeld een data-attribuut) en definieer per thema dezelfde tokencontracten.
- Scheid structurele componentstyling van thematische waarden: layout, afmetingen, typografie en interactie blijven componentregels; kleuren, gradients, borders, schaduwen en focusaccenten komen uit tokens.
- Neem zowel het hoofddashboard als alle instellingenpagina's, editors, dropdowns, modals, meldingen, statussen en interactieve toestanden mee.
- Voorzie naast normale en actieve Quick Action-tegels ook hover-, focus-visible-, disabled- en loading-toestanden per thema. Statussemantiek (aan/uit/onbekend) moet herkenbaar blijven en mag niet uitsluitend van kleur afhangen.
- Voeg per thema contrast- en regressietests toe op tablet en desktop. De Homey-stijl en de aangeleverde donkere mockup zijn visuele referenties, maar de definitieve themalijst en thema-instellingen worden pas in fase 5 vastgesteld.

#### Scope van deze wijziging
Deze wijziging legt de eerste tokens vast en past de blauwe actieve Quick Action-gradient toe. Er wordt nog geen themawisselaar of definitieve themastructuur geïmplementeerd; dat blijft onderdeel van fase 5.


### Meetwaardetegels – bronselectie en numerieke waarden (12 november 2026)

De ontwerpkeuzes zijn bevestigd:
- Exact vier vaste tegels.
- Per tegel uitsluitend een eigen naam en één bron.
- Bronnen zijn numerieke Homey-apparaatcapabilities of numerieke Homey Logic-variabelen.
- Opslag op basis van stabiele IDs: device ID + capability ID, of Logic variable ID.
- Boolean- en tekstwaarden worden uitgesloten.
- Eenheden en decimalen komen automatisch uit capabilitymetadata wanneer beschikbaar. Er wordt geen eenheid afgeleid uit een naam of capability-ID als de bron die metadata niet levert.
- Logic-variabelen hebben geen capability-eenheid; zonder aanvullende metadata tonen deze dus geen eenheid. Een handmatige eenheidskeuze wordt niet toegevoegd aan de eenvoudige editor.

#### Technische verificatie eenheden
De officiële Homey Apps SDK-documentatie beschrijft voor numerieke capabilities de opties units en decimals. De documentatie vermeldt ook dat units: °C Homey in staat stelt de waarde in de Homey-interface naar Fahrenheit om te zetten. De dashboardimplementatie moet verifiëren welke van deze metadata daadwerkelijk door de gebruikte Homey Web API-client in de apparaat/capability-objecten wordt teruggegeven. Dit mag niet worden aangenomen op basis van alleen de Apps SDK-definitie. De runtime-API-respons wordt tijdens implementatie/test gecontroleerd; ontbrekende metadata leidt tot een lege eenheid en een veilige standaard voor decimalen.


### Meetwaardetegels – implementatie eerste versie (12 november 2026)

De eerste implementatiestap staat op branch phase_1_foundation:
- Nieuwe persistente configuratie in data/measurement-tiles.json met vier vaste tegel-ID's, naam en bron.
- Bronverwijzingen bevatten alleen stabiele Homey-ID's: deviceId + capabilityId of variableId.
- Backendcatalogus biedt uitsluitend numerieke apparaatcapabilities en numerieke Logic-variabelen aan.
- Voor apparaatcapabilities worden units en decimals uit capabilitiesObj gelezen wanneer beschikbaar. Dit is bewust afhankelijk van de runtime metadata die de Homey Web API-client teruggeeft.
- Backend leest actuele meetwaarden opnieuw uit Homey en weigert niet-numerieke, niet-eindige waarden.
- Instellingen-endpoints zijn beveiligd met de bestaande instellingen-sessie.
- Dashboardtegels worden gevoed vanuit de opgeslagen configuratie; meetwaarden worden als fallback iedere vijf seconden vernieuwd en ook bij bestaande Homey-events opnieuw opgehaald.
- Dashboard-instellingen krijgen een afzonderlijk tabblad Meetwaardetegels naast Quick Actions.

#### Nog te verifiëren tijdens praktijktest
- Of de Homey Web API-client voor de gebruikte Homey Pro 2023-capabilities daadwerkelijk units en decimals teruggeeft. Als metadata ontbreekt, toont de tegel geen eenheid en gebruikt hij één decimaal als presentatie-terugval.
- Of Homey Logic numerieke variabelen in de runtime als type number retourneert.
- De volledige geneste zone-/ruimteboom en bronselectie met apparaten en capabilities op de echte Homey.
- Dat een apparaat dat offline gaat of een verwijderde capability geen andere tegel of dashboardsectie blokkeert.

Deze stap is nog niet als runtime-gevalideerd beschouwd. Eerst moeten de GitHub-build en daarna de praktijktest op de Homey Pro 2023 slagen.


### Dashboard-instellingen – navigatie vereenvoudigd (12 november 2026)

- De bovenste navigatiebalk met de tabs **Quick Actions** en **Meetwaardetegels** is verwijderd; deze was dubbelop naast de sectieknoppen in de pagina.
- De navigatie gebeurt nu via de bestaande knoppen onder de paginatitel: **Temperatuurtegels** opent de configuratie van de vier meetwaardetegels en **Snelle acties** opent de configuratie van de acht Quick Actions.
- De actieve sectieknop wordt visueel gemarkeerd. De navigatie werkt op beide pagina's, zodat tussen de twee onderdelen heen en weer kan worden geschakeld.
- De knop **Weer** blijft voorlopig een niet-actieve aanduiding; de instellingenpagina voor weer valt buiten deze wijziging.
