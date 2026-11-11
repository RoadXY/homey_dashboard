# Besluitenlog – inventarisatierondes 1 t/m 22

Dit document registreert de door de gebruiker bevestigde keuzes. Open punten zijn expliciet als zodanig gemarkeerd.

## Ronde 1 – basis en presentatie
- Het nieuwe dashboard vervangt het Home Assistant-dashboard.
- Dynamische meldingen in een tweekolomsweergave; alleen relevante meldingen zijn zichtbaar.
- Schermoriëntatie: landscape.

## Ronde 2 – architectuur en scope
- Homey Pro 2023 is de backend.
- Eigen dashboard in Docker op Ubuntu; Home Assistant is geen vereiste runtime.
- Lokale Homey-koppeling heeft de voorkeur.
- Alle informatie uit de bestaande HA-YAML blijft de functionele nulmeting.
- Meldingen sorteren op nieuwste eerst; prioriteitsweging is later verder uitgewerkt.
- Repository: https://github.com/RoadXY/homey_dashboard.

## Ronde 3 – globale indeling
- Links: klok, weer en temperaturen; rechts: quick buttons en meldingen.
- Klok is het grootste element; buitentemperatuur iets kleiner; overige weerinformatie compacter.
- Kamertemperaturen worden later uitgewerkt.
- Meldingen compact weergeven.

## Ronde 4 – tablet en bediening
- Samsung Galaxy Tab A SM-T515, landscape en responsive.
- Scherm blijft 24/7 aan.
- Fully Kiosk Browser verzorgt de kioskweergave.
- Quick buttons voeren direct uit, behalve acties die als kritisch zijn ingesteld; die vragen bevestiging.

## Ronde 5 – gegevens en verversing
- Streefwaarde: belangrijke gegevens elke 5 seconden verversen, mits Homey API en belasting dit toelaten.
- Bij Homey-offline blijven laatst bekende waarden zichtbaar met een waarschuwing.
- Lokale Homey API-authenticatie met API-key.
- Homey is de voorkeursbron voor weer; externe bron alleen indien nodig.
- Configuratiepagina moet Homey-apparaten kunnen ontdekken en gebruiker moet zelf apparaten/meetwaarden kunnen selecteren.
- Configuratie via externe configuratiebestanden én een beheerpagina.

## Ronde 6 – Homey-ontdekking en beheer
- Read-only inventarisatie van Homey is toegestaan.
- Apparaten handmatig selecteren.
- Automatisch zoeken bij openen van configuratiepagina én handmatige knop ‘opnieuw zoeken’.
- Belangrijke gegevens elke 5 seconden; minder belangrijke gegevens minder frequent.
- Configuratiepagina wordt beveiligd met een pincode (zie correctie ronde 14).

## Homey-inventarisatie (read-only)
Op het moment van inventarisatie zijn 128 apparaten, 22 zones, 25 Logic-variabelen, 172 flows en 2 Moods aangetroffen. Er zijn geen apparaten of flows gewijzigd.
- Er is een Homey-apparaat ‘Weer’ met diverse weer-capabilities, waaronder temperatuur, gevoelstemperatuur, wind, neerslag, beschrijving, zonsopkomst en zonsondergang.
- ‘Multisensor woonkamer’ levert onder meer CO2, TVOC, temperatuur, druk en luchtvochtigheid.
- Er zijn sensoren voor onder andere slaapkamers, vriezer en koelkast, raam/deurcontacten, watermelders, wasmachine/droger, stofzuiger en energie/water.
- De inventarisatie was niet volledig uitgeschreven; voor concrete mapping moet gericht opnieuw worden opgevraagd.

## Ronde 7 – meldingen en acties
- Zowel Homey Flows als directe apparaatbediening moeten ondersteund worden.
- Kritische bevestiging wordt per quick button configureerbaar.
- Fase 1: meldingen op basis van statische regels die apparaatwaarden/condities evalueren; configuratie in JSON, gebaseerd op bestaande meldingen.
- Fase 2: meldingenconfiguratiepagina en ondersteuning voor pushmeldingen vanuit Homey Flows.
- De weergave moet nu al voorbereid zijn op toekomstige pushmeldingen.
- Hoofddashboard toont alleen actieve meldingen.
- Bij geen meldingen: compacte status ‘Alles in orde’.
- Alle bestaande conditionele logica uit de HA-YAML moet behouden blijven.

## Ronde 8 – meldingsregels en gegevensmodel
- Voorwaarden ondersteunen AND/OR en combinaties.
- Iedere melding heeft precies één van drie niveaus: kritiek, waarschuwing of info.
- Sortering: niveau eerst, daarna tijdstip; nadere uitwerking bevestigd in ronde 20.
- Tijdstip is het moment waarop de regel actief wordt.
- JSON wordt opgesplitst in meerdere bestanden per categorie.
- Structuur moet leesbaar/beheerbaar zijn en later geschikt zijn voor een WYSIWYG-editor.
- Voorgestelde structuur (nog te valideren bij technische uitwerking):
  - config/dashboard.json
  - config/devices.json
  - config/notifications/{safety,climate,appliances,energy,other}.json
  - config/actions/{buttons,confirmations}.json
- Elke melding krijgt een stabiele unieke ID, titel, niveau, conditiegroep en presentatieopties.
- Condities verwijzen naar Homey device-ID en capability, niet naar zichtbare apparaatnamen.
- Schema-versie, validatie en begrijpelijke foutmeldingen zijn gewenst.

## Ronde 9 – quick buttons
- Alle acht huidige knoppen blijven aanwezig en behouden volgorde/layout als uitgangspunt:
  1. Q-Music
  2. Q-Music Foute Uur
  3. Rolluiken openen
  4. Verjaardagmodus
  5. Woonkamerverlichting uit
  6. Sfeerverlichting
  7. TV-modus
  8. Bedtijd
- Knoppen tonen icoon en tekstlabel.
- Zowel directe feedback als werkelijke Homey-status is gewenst.
- Statuskleur/icoon moet de daadwerkelijke Homey-status weerspiegelen, niet alleen het indrukken.
- Sommige knoppen hebben een status (bijv. woonkamerverlichting en verjaardagmodus).
- Fouten worden duidelijk getoond; knop blijft beschikbaar.
- Kritische actie wordt per knop instelbaar en vraagt bevestiging.

## Ronde 10 – media, klok en weer
- Mediaspelers Sem en Bram zijn alleen zichtbaar wanneer actief/aan het afspelen.
- Media is informatief: titel, artiest en afspeelstatus; geen mediabediening.
- Mediaspelers zijn geen permanent zichtbaar vast onderdeel.
- Klok groot, datum kleiner eronder.
- Weer compact.
- Buitentemperatuur plus geselecteerde kamertemperaturen; kamertemperatuurselectie later via configuratie.
- Bij offline apparaat wordt het betreffende media-/weeronderdeel verborgen.

## Ronde 11 – schermverhouding en interactie
- Kolomverhouding: 50/50.
- Kamertemperaturen: uitgesteld.
- Weericoon groot naast buitentemperatuur.
- Dashboardpagina blijft vast; alleen meldingenpaneel mag scrollen.
- Hoofdscherm is display-only, behalve quick buttons.
- Thema: donker.

## Ronde 12 – meldingenoverzicht
- Alle actieve meldingen tonen; er is geen vast maximum.
- Als er meer meldingen zijn dan passen, mag alleen het meldingenpaneel verticaal scrollen.
- Sortering: niveau eerst, daarna activeringstijdstip; de precieze volgorde bij gelijke niveaus is later bevestigd.
- Mediaspelers Sem en Bram verschijnen in hetzelfde meldingenoverzicht, als compacte meldingen. Als beide actief zijn, naast elkaar.
- Homey offline: rode tekstmelding ‘Homey Offline’ bij de klok.
- Weer toont ook gevoelstemperatuur, wind en neerslag; exacte selectie en presentatie later bepalen.

## Ronde 13 – meldingstijl en knopfeedback
- Standaard meldingen: icoon per niveau, geen opvallende achtergrondkleur.
- Kritieke meldingen zijn uitzondering: rode achtergrond en contrasterende tekst; exacte toegankelijke vormgeving wordt bij mockups bepaald.
- Compacte melding: titel en actuele waarde. Complexe meldingen (bijv. ‘Raam ouders niet open’) vragen later nadere uitwerking.
- Fase 2: instellingenpagina toont overzicht van beschikbare meldingen; potloodje opent specifieke WYSIWYG-editor voor die melding.
- Editor moet meerdere voorwaarden en AND/OR-combinaties kunnen bewerken.
- Mediaspelers: compacte melding met titel, artiest en afspeelstatus.
- Melding verdwijnt automatisch zodra onderliggende voorwaarde niet meer actief is.
- Quick button-status pas aanpassen nadat Homey de actie heeft bevestigd.

## Ronde 14 – instellingenpagina
- Fase 1 instellingenpagina beheert Homey-verbinding, basisinstellingen, quick buttons en meldingen via eenvoudige instellingen.
- Apparaten kiezen via overzichtelijke apparatenlijst; na selectie kiest gebruiker de meetwaarde/capability.
- Beveiliging: pincode; dit corrigeert de eerdere voorlopige formulering ‘gebruikersnaam en wachtwoord’.
- Instellingenpagina is bereikbaar vanaf tablet, computer en telefoon, maar alleen na pincode/login.
- Wijzigingen opslaan met expliciete knop ‘Opslaan’.

## Ronde 15 – beheer, sessie en tests
- Quick buttons moeten per knop kunnen worden ingesteld met keuze tussen een Homey Flow en directe apparaatbediening.
- Meldingen beheren in fase 1: bestaande meldingen aan/uit kunnen zetten, de naam aanpassen en het niveau wijzigen. Onderliggende voorwaarden/meetwaarden worden in fase 1 niet bewerkt via de beheerpagina.
- Bij niet-opgeslagen wijzigingen waarschuwt de beheerpagina wanneer de gebruiker de pagina probeert te verlaten.
- PIN-sessie: eenmaal invoeren; automatisch uitloggen na een instelbare periode van inactiviteit.
- Instellingenpagina biedt alleen een test voor de Homey-verbinding; geen afzonderlijke meldingstest afgesproken.

## Ronde 16 – weer en kamertemperaturen
- Weerinformatie naast de buitentemperatuur bevat ook luchtvochtigheid en een weersomschrijving, naast de eerder gekozen gevoelstemperatuur, wind en neerslag.
- Weersomschrijving wordt getoond met zowel een weericoon als een korte tekstomschrijving.
- Er worden maximaal vier kamertemperaturen getoond.
- Kamertemperaturen worden weergegeven als afzonderlijke temperatuurtegels.
- Als weerinformatie tijdelijk niet beschikbaar is, toont het dashboard een melding dat de weerinformatie niet beschikbaar is.

## Ronde 17 – selectie en actualiteit kamertemperaturen
- De gebruiker levert de vier gewenste kamers/sensoren zelf aan; deze selectie moet later aanpasbaar zijn.
- Elke temperatuurtegel toont de kamernaam, de temperatuur en een klein temperatuur-icoon.
- Temperatuurtegels gebruiken een neutrale, uniforme stijl; geen kleurcodering op basis van temperatuur.
- Als een kamersensor offline is, blijft de tegel zichtbaar met ‘Geen gegevens’.
- Een temperatuurwaarde ouder dan 15 minuten geldt als verouderd.

## Ronde 18 – klok, datum en gegevensactualiteit
- Tijd wordt getoond in 24-uursnotatie; de notatie wordt later instelbaar via de instellingenpagina.
- Datum wordt standaard voluit getoond, inclusief weekdag en maandnaam (bijv. ‘Dinsdag 10 november 2026’); de datumnotatie wordt later instelbaar.
- De weekdag wordt duidelijk zichtbaar getoond; de presentatie ervan wordt later instelbaar.
- Bij verlies van Homey-verbinding blijft de bestaande afgesproken status gelden: ‘Homey Offline’ bij de klok en laatst bekende waarden blijven staan.
- Tijdstip van laatste update wordt alleen getoond bij waarden die als verouderd worden aangemerkt.

## Ronde 19 – quick button-feedback en bevestiging
- Tijdens uitvoering van een quick button wordt de betreffende knop tijdelijk uitgeschakeld tot Homey antwoord geeft.
- Na een geslaagde actie blijft de feedback ongeveer 5 seconden zichtbaar.
- Bij een mislukte actie verschijnt een algemene foutmelding bovenaan het dashboard.
- Kritische acties gebruiken een grotere bevestigingsdialoog met een duidelijke omschrijving van de actie.
- Om herhaald indrukken te voorkomen geldt naast blokkeren tijdens uitvoering ook een korte wachttijd na een geslaagde actie; de exacte duur moet nog worden bepaald.

## Ronde 20 – prioriteit en levenscyclus meldingen
- Elke melding krijgt precies één van drie niveaus: kritiek, waarschuwing of info. De eerdere interpretatie van vrij instelbare prioriteit is gecorrigeerd en vervalt.
- Het niveau bepaalt de prioriteitsvolgorde: kritiek bovenaan, daarna waarschuwing en vervolgens info.
- Binnen hetzelfde niveau wordt de nieuwste actieve melding eerst getoond.
- Een melding toont een icoon, titel en actuele waarde.
- Kritieke meldingen krijgen een rode achtergrond met contrasterende tekst.
- Zodra de voorwaarde niet meer actief is, verdwijnt de melding direct uit beeld; er komt geen geschiedenisoverzicht of logboek voor beëindigde meldingen.

## Ronde 21 – meldingsinstanties
- Vraag 1 (keuze C): iedere afzonderlijke actieve voorwaarde mag een eigen melding opleveren; dezelfde soort melding kan dus meerdere keren zichtbaar zijn.
- Vraag 2 (keuze A): telkens wanneer een voorwaarde opnieuw actief wordt, wordt de melding opnieuw getoond; er geldt geen wachttijd of dempingsperiode.
- Vraag 3 (keuze A): als de actuele meetwaarde verandert terwijl de voorwaarde actief blijft, blijft de bestaande melding staan en toont deze direct de nieuwe actuele waarde.
- Vraag 4 (keuze A): iedere waardeverandering zolang de voorwaarden actief blijven, geldt als een nieuwe activatie van de melding.

## Ronde 22 – meldingsinhoud en behoud van bestaande logica
- Vraag 1 (keuze A, met toelichting): één melding kan meerdere voorwaarden bevatten. De melding toont relevante informatie in een passende vorm: bijvoorbeeld een apparaatwaarde met context (‘Het is warm in de woonkamer – 25 °C’) of een tekstuele status (‘Deur is open’, ‘Raam is nog niet open’). Niet standaard alle ruwe meetwaarden opsommen.
- Vraag 2 (keuze A, aangevuld met optie D): voor fase 1 wordt de inhoud/presentatie exact overgenomen uit de bestaande Home Assistant-YAML. In fase 2 moet de gebruiker zelf dynamisch kunnen instellen welke tekst, apparaatwaarden en combinaties een melding toont; dit wordt een uitgebreider onderdeel van fase 2.
- Vraag 3 (keuze A): alle bestaande voorwaarden en combinaties uit de Home Assistant-YAML blijven in fase 1 exact behouden. De logica wordt niet vereenvoudigd of gewijzigd tijdens het overzetten.
- Vraag 4 (keuze A): als een bestaande melding niet één-op-één kan worden vertaald, wordt deze niet zelfstandig aangepast. Het probleem wordt gedocumenteerd en eerst met de gebruiker besproken.
- Vraag 5 (keuze B, met toelichting): de gebruiker vergelijkt/test het nieuwe dashboard zelf naast Home Assistant. Het uitvoeren en organiseren van die tests is de verantwoordelijkheid van de gebruiker; dit hoeft niet door de assistent te worden uitgewerkt of beheerd.

## Open punten
- Welke vier kamers/sensoren worden geselecteerd (namen en Homey-apparaten).
- Exacte selectie, volgorde en presentatie van de weergegevens en de melding bij ontbrekende weerdata.
- Hoe verouderde temperatuurwaarden visueel worden aangeduid en hoe het update-tijdstip wordt weergegeven.
- Welke klok- en datumnotaties als instelbare opties beschikbaar komen.
- Exacte duur van de extra wachttijd na een geslaagde quick button-actie.
- Detailuitwerking complexe meldingscondities en editor in fase 2.
- Exacte manier waarop de gebruiker Flow of directe apparaatbediening per quick button configureert (velden/keuzelijst en validatie).
- Definitieve beveiligingsdetails: pincodebeleid, sessieduur-instelling, rate limiting en opslag van secrets.
- Definitieve JSON-schema's en categorie-indeling.
- API-ondersteuning en haalbaarheid van refreshintervallen.
- Mockups en functioneel ontwerp moeten nog worden gemaakt en expliciet goedgekeurd voordat implementatie start.


## Aanvullende mapping- en scopebesluiten (10 november 2026)
- De nieuw aangemaakte Homey Logic-variabelen `temperatuur_gemiddeld_keuken` en `temperatuur_gemiddeld_woonkamer` zijn de beoogde bronnen voor de gemiddelde temperaturen van keuken en woonkamer. Type, eenheid, actuele waarden en bijwerklogica moeten nog technisch worden gecontroleerd.
- Telefoonbatterijniveaus vervallen uit het dashboard.
- Plantensensoren vervallen uit het dashboard.
- Voor de quick buttons Q-Music en Rolluiken openen moeten nieuwe Homey Flows worden gemaakt die vanuit de Homey Dashboard-app/container aanroepbaar zijn. Er zijn nog geen Flows aangemaakt of gewijzigd; de exacte aanroepmethode en Flow-inhoud moeten eerst worden vastgesteld.


## Aanvullende ontwerpgoedkeuring – hoofdscherm (10 november 2026)
- De gebruiker keurt de getoonde meldingskaartindeling goed: twee kolommen, gelijke vaste kaartafmetingen, icoon naast tekst en tekst die over meerdere regels mag lopen.
- Correctie op de mockup: de kritieke melding moet een duidelijk roodgetinte achtergrond hebben. De eerdere weergave met alleen een rood icoon/rand voldeed niet; de aangepaste mockup toont de rode achtergrond.
- De hoofdschermmockup is hiermee visueel akkoord. De instellingenpagina en het volledige functionele ontwerp blijven nog ter goedkeuring; er wordt nog niet geïmplementeerd.


## Aanvullend kleurgebruik meldingen (10 november 2026)
- De gebruiker kiest naast rood voor kritieke meldingen ook een geel/ambergetinte achtergrond voor waarschuwingen.
- Alleen kritieke meldingen (rood) en waarschuwingen (geel/amber) wijken qua kaartachtergrond af.
- Info en alle overige meldingen behouden dezelfde neutrale donkere achtergrond als de gewone kaarten.
- De gebruiker heeft de aangepaste mockup met zowel de rode als gele waarschuwingskaart goedgekeurd als gewenste visuele richting.


## Verfijning waarschuwingskleuren (10 november 2026)
- De gebruiker wil zowel de rode kritieke meldingsachtergrond als de gele/amber waarschuwingsachtergrond iets donkerder.
- De kleurcategorieën blijven ongewijzigd: kritiek rood, waarschuwing geel/amber, info en overige meldingen neutraal donker. Alleen de tint/verzadiging/helderheid van rood en geel wordt subtiel verlaagd; contrast en leesbaarheid blijven leidend.


## Verfijning temperatuurtegels (10 november 2026)
- De gebruiker wil de temperatuur-iconen op alle vier temperatuurtegels verwijderen.
- De vrijgekomen ruimte wordt gebruikt om zowel de ruimtenaam als de temperatuurwaarde groter en beter leesbaar te tonen.
- De vier tegels behouden exact hetzelfde formaat en de vaste 2×2-indeling.


## Aanpassing hoofdschermindeling en temperatuurlabels (10 november 2026)
- De rij met acht actieknoppen wordt verticaal uitgelijnd met de bovenkant van de klok-/datumkaart links.
- Het meldingenpaneel schuift omhoog en komt direct onder de actieknoppen, zodat de beschikbare ruimte voor meldingen groter wordt.
- De temperatuurtegels behouden hun formaat en 2×2-indeling. De ruimtenamen zijn voortaan exact: `Woonkamer`, `Keuken`, `Sem` en `Bram`. Bij de laatste twee wordt ‘Slaapkamer’ weggelaten; de naam staat op één regel.


## Besluit uniforme spatiëring (10 november 2026)
- Alle buitenste tussenruimtes tussen kaarten/onderdelen worden gelijkgetrokken.
- Dit geldt nadrukkelijk ook voor de afstand tussen actieknoppen en meldingen; die mag niet afwijken van de tussenruimte tussen andere kaarten.
- De ruimte tussen tijdkaart en weerkaart, weerkaart en temperatuurtegels, linker- en rechterkolom en de kaarten binnen het meldingenraster wordt consistent.
- Technische uitwerking gebruikt bij voorkeur één centrale spacing-instelling/token voor deze standaardafstand.


## Besluit meldingenpaneel: symmetrie en fade (10 november 2026)
- De vrije ruimte tussen meldingskaarten en de rechterrand van het meldingenpaneel wordt gelijk aan de vrije ruimte links.
- De verticale lijnaccenten links en rechts van het meldingenpaneel worden even lang.
- De lijnaccenten lopen geleidelijk over een grotere lengte uit/faden naar de achtergrond, vergelijkbaar met de bestaande overgang maar langzamer en minder abrupt.


## Besluit extra lange fade links van meldingen (10 november 2026)
- De verticale lijn/overgang links van het meldingenpaneel krijgt een nog langere en geleidelijkere fade naar de achtergrond.
- Het accent moet over een grotere lengte uitlopen en mag niet abrupt zichtbaar eindigen.
- Dit verzoek wijzigt alleen het fade-effect links van het meldingenpaneel; overige ontwerpafspraken blijven behouden.


## Besluit toegang instellingen via tijdkaart (10 november 2026)
- Geen zichtbaar instellingenicoon of aparte instellingenknop op het dashboard.
- Lang indrukken op de tijdkaart opent de instellingenpagina.
- De tijdkaart blijft visueel ongewijzigd.
- De mockup met een extra instellingenknop en vervormde tekst/iconen is afgekeurd; niet gebruiken als referentie.


## Instellingenpagina – Algemeen
- De pagina Algemeen bevat algemene informatie/dashboardstatus én instellingen voor datumweergave, tijdweergave en verversingssnelheid.
- De concrete opties en standaardwaarden worden in een volgende ontwerpstap vastgesteld.

- Tijdweergave: gebruiker kan kiezen tussen 24-uursnotatie en 12-uursnotatie (AM/PM).

- Datumweergave: korte variant, bijvoorbeeld `di. 10 nov. 2026`.

- Dashboardverversing: automatische verversing met verschillende intervallen; belangrijke gegevens vaker dan minder belangrijke gegevens. Exacte intervallen worden later bepaald.

- Pagina Algemeen toont: Homey Pro-verbindingsstatus, dashboardserver-verbindingsstatus, laatste succesvolle gegevensverversing, dashboardversie, uptime dashboardserver en opslag- en geheugengebruik.

- Pagina Algemeen bevat instellingen voor tijdnotatie, datumweergave en tijdzone.

- Standaardtijdzone: `Europe/Amsterdam` (automatische zomer- en wintertijd).

- Opslag- en geheugengebruik: tekstuele waarden, zonder grafische voortgangsbalken.

- Serverwaarschuwingen op pagina Algemeen: niet tonen; alleen statuswaarden weergeven.

- Dashboardversie: weergave van versienummer plus datum van de laatste update.

- Uptime dashboardserver: compacte notatie, bijvoorbeeld `3d 04u 12m`.

- Instellingen opslaan: één algemene knop **Opslaan** onderaan de pagina.

- Bij verlaten met niet-opgeslagen wijzigingen verschijnt een bevestiging: opslaan, weggooien of blijven.

- Indeling pagina Algemeen: één gecombineerd overzicht met instellingen en systeemstatusinformatie, zonder aparte blokken.

- Pagina Algemeen: instellingen als compacte lijst; systeemstatusinformatie als compacte kaarten.

- Systeemstatuskaarten: één horizontale rij, zolang de beschikbare schermbreedte dit toelaat.

- Instellingenpagina: duidelijke terugkeerknop linksboven met label **← Dashboard**.

- Actieve optie navigatiekolom: subtiele lichtere achtergrond achter de geselecteerde optie.

- Navigatiekolom: bij iedere categorienaam staat een klein pictogram.

- Navigatiecategorieën instellingen: Algemeen, Dashboard, Meldingen, Apparaten, Homey en Systeem.

- Pagina Dashboard: instelbaar zijn temperatuurtegels (kamers en sensoren), zichtbare weergegevens en snelle actieknoppen (zichtbaarheid, volgorde en instellingen).

- Temperatuurtegels: exact vier vaste tegels; per tegel selecteert de gebruiker welke Homey-temperatuursensor wordt weergegeven. Het aantal tegels is niet wijzigbaar.

- Temperatuurtegels: vier vaste tegels; per tegel zijn zowel de Homey-sensor als de weergegeven naam zelf instelbaar.

- Sensorselectie temperatuurtegels: één lijst met alle Homey-apparaten die een temperatuurmeting aanbieden.

- **Correctie sensorselectie temperatuurtegels:** eerst Homey-kamer/ruimte kiezen, daarna sensor uit die ruimte (zoals in de Homey mobiele app). Dit vervangt de eerdere keuze voor één lange lijst. Zoekfunctie volgt in fase 2.

- Sensorselectie: bied op ieder niveau een duidelijke optie **Terug** om naar het vorige niveau te navigeren.

- Weerweergave: buitentemperatuur, gevoelstemperatuur, weericoon en weersomschrijving, windsnelheid en windrichting, luchtvochtigheid, neerslag, luchtdruk en zonsopkomst/-ondergang zijn afzonderlijk aan- en uitzetbaar.

- Weerweergave: standaard staan bij een nieuwe installatie alleen de belangrijkste onderdelen aan. Welke onderdelen dat precies zijn, moet nog worden bepaald; alle acht blijven afzonderlijk instelbaar.

- Standaard weerweergave: aan — buitentemperatuur, gevoelstemperatuur, weericoon/weersomschrijving en windsnelheid/windrichting. Uit — luchtvochtigheid, neerslag, luchtdruk en zonsopkomst/zonsondergang.

- Snelle actieknoppen: per knop zijn zichtbaarheid, volgorde, naam, pictogram en actie-instelling instelbaar.

- Actietype snelle actieknop: per knop keuze tussen Homey Flow starten en Homey-apparaat bedienen.

- Homey Flow-selectie voor actieknoppen: lijst met Flow-namen inclusief zoekfunctie.

- Homey-apparaatselectie voor actieknoppen: eerst kamer/ruimte selecteren, daarna apparaat binnen die ruimte.

- Apparaatselectie: op ieder niveau een duidelijke knop **Terug** om naar het vorige niveau te navigeren.

- Apparaatacties: toon automatisch uitsluitend acties die het geselecteerde Homey-apparaat ondersteunt.

- Volgorde snelle actieknoppen: aanpassen door middel van drag-and-drop.

- Snelle actieknoppen gebruiken Material Design Icons (MDI). De gebruiker kiest per knop het pictogram; grootte en kleur worden centraal bepaald. Kleur volgt severity/status: rood, geel, blauw of groen. De gebruiker stelt kleur en grootte niet zelf in.

- **Correctie MDI/actieknoppen:** gebruiker kiest uitsluitend het MDI-pictogram. Kleur en grootte volgen automatisch het actieve thema; alle actieknoppictogrammen hebben dezelfde themakleur. Severity-kleuren zijn niet van toepassing op actieknoppen.
- **Fase 3:** een aantal vooraf ontworpen thema's toevoegen; concrete varianten later bepalen.

- MDI-selectie actieknoppen: één doorzoekbaar overzicht met alle MDI-pictogrammen en een live voorbeeld.

- MDI-zoekfunctie huidige fase: zoeken op de namen zoals aangeleverd door de MDI-website. NL/EN-termen en synoniemen volgen in fase 3.
- Meertaligheid: in fase 3 dashboardtaal ondersteunen; vertalingen worden in JSON-bestanden beheerd.

- Dashboardtaal huidige fase: Nederlands.
- Tekstbeheer: alle dashboardteksten vanaf de huidige fase via JSON-vertaalbestanden; meertalige taalkeuze volgt in fase 3.

- JSON-vertaalbestanden: optie B — meerdere bestanden per taal, opgesplitst per onderdeel (bijvoorbeeld dashboard, meldingen en instellingen).

- Correctie taalbeleid: Engels is de standaard- en terugvaltaal. Nederlands is een optionele keuzetaal, net als andere talen. Ontbrekende vertalingen vallen terug op Engels. De eerdere formulering dat Nederlands de standaardtaal zou zijn, is hiermee vervangen.

- Nieuwe installatie: Engels wordt standaard geselecteerd als dashboardtaal.

- Correctie op de eerdere beslissing over de standaardtaal bij nieuwe installatie: het dashboard detecteert de taalinstelling van Homey en gebruikt die als dashboardtaal als vertalingen beschikbaar zijn. Is de taal niet beschikbaar, dan wordt Engels gebruikt en krijgt de gebruiker een melding welke taal is gedetecteerd en dat deze niet beschikbaar is. Engels blijft de terugvaltaal voor ontbrekende vertalingen.

- Taalkeuzelijst: bovenaan **Automatisch (taalnaam)** met de door Homey gedetecteerde taal, bijvoorbeeld **Automatisch (Nederlands)**. Daaronder alle talen met een volledige of gedeeltelijke vertaling.

- Toepassen taalwijziging: direct, zonder herladen van de dashboardpagina en zonder herstart van de Docker-container.

- Taalvoorkeur onthouden: een handmatig gekozen taal wordt persistent opgeslagen, ook na herstart van de Docker-container. Deze keuze heeft voorrang op automatische Homey-taaldetectie totdat de gebruiker weer Automatisch selecteert.

- Locatie taalkeuze: instellingenpagina **Algemeen**, bij datum- en tijdinstellingen.

- De gebruiker keurt de algemene visuele vormgeving van de mockup voor Instellingen > Algemeen goed: donkere stijl, linker navigatiekolom, tweekolomsindeling en compacte instellingenkaarten. Goedkeuring geldt niet voor de voorbeeldinstellingen in de mockup; alleen eerder afzonderlijk vastgelegde functionaliteit is leidend.

- Dashboardinstellingen: geen broodkruimelpad; alleen de huidige paginatitel. Bovenbalk: **← Back to dashboard** links, datum en tijd rechts; geen knop **Settings**.
- Temperatuurtegels: preview als vaste 2×2-grid, zonder pictogrammen. Nummer 1–4 linksboven op previewtegels correspondeert met de configuratieregels; volgorde links-rechts, boven-beneden.

- Temperatuurpreview: optie A — direct live bij iedere wijziging van naam, sensor of volgorde, ook vóór Opslaan.

- Sensorselectie: volledige geneste Homey-ruimtestructuur, zonder vaste maximale diepte.
- Ruimte-iconen van Homey worden niet getoond.
- Per ruimte worden apparaten met geschikte temperatuurmetingen getoond; de gebruiker kiest de gewenste meetwaarde.
- Geen aparte optie **Terug** in de lijst; navigeren gebeurt via het aanklikbare kruimelpad.
- Lang kruimelpad: huidig niveau plus twee voorgaande niveaus zichtbaar; overige niveaus achter een aanklikbare **…**, waarmee ieder verborgen niveau bereikbaar is.

- Weeronderdelen: vaste volgorde; gebruiker kan per onderdeel alleen de zichtbaarheid in- of uitschakelen. Geen drag-and-drop voor de volgorde. Dit vereenvoudigt een consistente weerkaart.

- Weerpreview: direct live bij iedere wijziging van de zichtbaarheid, ook vóór Opslaan. De volgorde van weeronderdelen blijft vast.

- Quick action actietype: gebruiker kiest expliciet via twee keuzeknoppen **Flow** of **Apparaat**.
- Flow: selecteer een bestaande Flow uit een doorzoekbare lijst; de Flow blijft ook handmatig in Homey startbaar.
- Apparaat: selecteer Homey-ruimte → apparaat → een door het apparaat ondersteunde actie.
- Naam en MDI-pictogram zijn instelbaar voor beide typen; preview live; pictogrammen monochroom volgens actief thema.

- Fase 3 thema's: naast de overige vooraf gedefinieerde thema's wordt een **Homey-stijl thema** toegevoegd, gebaseerd op de aangeleverde Homey-apparatenpagina (donkere antraciet/zwart-grijze basis, sobere grijze kaarten en blauwe accenten). Exacte visuele uitwerking volgt in fase 3.

- Meldingenpagina: tabblad **Weergave** verwijderd; alleen **Meldingen** blijft. Meldingspresentatie is vast en niet afzonderlijk configureerbaar.
- Tabblad **Volgorde** blijft verwijderd; automatische sortering volgens niveau en activatietijd.

- Correctie beheer meldingen: meldingen worden centraal door het dashboard beheerd, niet door Homey. Alle meldingen, ongeacht herkomst, kunnen in het dashboard worden aangemaakt, bewerkt en verwijderd. Ook voorwaarden zijn volledig bewerkbaar; Homey-aangeleverde meldingen zijn niet alleen-lezen.
- Melding toevoegen/bewerken opent een schermvullende editor, geen modal. Deze bevat metadata én een editor voor de volledige voorwaarden.
- Blockly is de voorkeurskandidaat voor de visuele voorwaardeneditor, met eigen styling en domeinspecifieke blokken (o.a. AND/OR, tijdsvenster, hoger dan/lager dan). Definitieve blokken, validatie en vertaling naar een uitvoerbaar voorwaardenmodel worden technisch uitgewerkt.
- Fase 2: bepalen hoe Homey meldingen kan aanleveren, bijvoorbeeld via API-aanroep of toekomstige Homey-app. Aangeleverde meldingen blijven volledig dashboard-beheerbaar.

- Instellingen en meldingeditor zijn responsief voor circa 10-inch tablet en 15–16-inch laptop. Tablet vooral voor incidenteel/noodgebruik; laptop is de primaire beheeromgeving.
- Op 30-inch schermen mag ongebruikte ruimte overblijven; inhoud hoeft niet volledig uit te rekken. De meldingeditor/Blockly-werkruimte schaalt en herschikt passend bij de viewport.

- Scopecorrectie meldingen: fase 1 neemt bestaande Home Assistant-meldingskaarten/definities over als vast geprogrammeerde dashboardmeldingen om de werking naast Home Assistant te testen.
- Alle HA-voorwaarden en combinaties worden in fase 1 exact behouden; geen zelfstandige vertaling, vereenvoudiging of wijziging.
- Fase 1: eenvoudige meldingseigenschappen actief/inactief, naam en meldingsniveau zijn configureerbaar. Voorwaarden zijn nog niet via de dashboardinterface bewerkbaar.
- Fase 2: Blockly, de volledige schermvullende voorwaardeneditor en het ontwerp van categorieën en blokkenbibliotheek. De concrete blokken worden pas in fase 2 bepaald.


## Besluit import Home Assistant-kaarten (11 november 2026)
- De gebruiker kiest voor optie B: **alle conditionele kaarten uit de bestaande Home Assistant-YAML** worden meegenomen in de inventarisatie/import, dus niet alleen waarschuwingen en meldingen die om aandacht vragen. Ook conditionele statuskaarten worden opgenomen.
- Dit besluit wijzigt niet de eerder expliciet vastgelegde scope-uitzonderingen: telefoonbatterijkaarten, plantkaarten en mediaspelerkaarten blijven uitgesloten uit het nieuwe dashboard. De muurtablet-batterijmelding blijft wel in scope.
- Alle oorspronkelijke zichtbaarheidvoorwaarden en AND/OR-combinaties blijven behouden. Iedere kaart wordt bij de mapping apart beoordeeld op Homey-beschikbaarheid en één-op-één vertaalbaarheid; onduidelijkheden worden niet zelfstandig aangepast.

## Besluit voorbereiden op Blockly via een centraal voorwaardenmodel (11 november 2026)
- Bij de import van de conditionele Home Assistant-kaarten wordt vanaf fase 1 naast de oorspronkelijke YAML-definitie ook een genormaliseerd, versiebeheerd JSON-voorwaardenmodel opgeslagen.
- Dit JSON-model is de centrale, blijvende representatie van de voorwaarden en vormt later de basis voor het uitlezen en bewerken via Blockly. De Blockly-workspace is dus niet de enige bron van waarheid.
- Het model bewaart de volledige logische structuur (waaronder geneste AND/OR-combinaties), vergelijkingen, waarden en bronverwijzingen. De oorspronkelijke YAML blijft beschikbaar als herleidbare bron.
- De fase-1-dashboardlogica gebruikt hetzelfde voorwaardenmodel waar dat technisch verantwoord en één-op-één vertaalbaar is. Blockly-bewerking en de volledige visuele editor blijven fase-2-functionaliteit.
- Niet-ondersteunde of niet eenduidig vertaalbare HA-voorwaarden worden expliciet gemarkeerd en aan de gebruiker voorgelegd. Er vindt geen stilzwijgende vereenvoudiging, wijziging of verlies van logica plaats.
- Het voorwaardenmodel krijgt schema-versiebeheer en validatie, zodat het later veilig kan worden uitgebreid en door Blockly kan worden ingelezen.

## Fase-indeling: eerst basisdashboard, zonder meldingen (11 november 2026)
- De gebruiker kiest ervoor eerst een bruikbaar Homey-dashboard op te leveren zonder meldingen. De meldingeninventarisatie, import en het JSON-voorwaardenmodel worden voorbereid als afzonderlijk werk en blokkeren de eerste dashboardrelease niet.
- **Fase 1A – Basisdashboard:** klok/datum, weer, vier temperatuurtegels, Homey/serverstatus en de acht goedgekeurde quick action buttons. Het meldingenpaneel wordt in deze eerste oplevering niet getoond.
- De acht quick action buttons moeten in fase 1A niet alleen visueel aanwezig zijn, maar daadwerkelijk werken en de bijbehorende Homey-acties uitvoeren. Benodigde Homey-Flows moeten daarvoor worden voorbereid/aangemaakt na controle van de exacte actie en met behoud van de bestaande Homey-logica.
- **Fase 1B – Meldingenvoorbereiding:** inventarisatie en mapping van de conditionele Home Assistant-kaarten, met behoud van de oorspronkelijke YAML en opslag in het versiebeheerde JSON-voorwaardenmodel. Meldingen worden pas later aan het dashboard toegevoegd.
- **Fase 2:** meldingenbeheer en de visuele voorwaardeneditor met Blockly, voortbouwend op het JSON-voorwaardenmodel.
- De eerder goedgekeurde hoofdschermindeling blijft het ontwerpuitgangspunt; het ontbreken van meldingen in fase 1A is een tijdelijke scopekeuze en geen nieuw visueel ontwerpbesluit.

## Correctie scope Homey als enige automatiseringsplatform (11 november 2026)
- Het nieuwe dashboard en alle Quick Actions worden volledig op Homey Pro 2023 gebaseerd. Home Assistant wordt niet gebruikt als bron, referentie, integratie, uitvoeringslaag of runtime-afhankelijkheid.
- De acht Quick Actions worden vanuit de gewenste functionaliteit rechtstreeks ontworpen met Homey-Flows, Homey-Moods en/of ondersteunde apparaatacties.
- Bestaande Homey-Flows en Moods worden waar passend hergebruikt. Ontbrekende acties worden als Homey-logica opgebouwd na inventarisatie en expliciete toestemming van de gebruiker.
- Eerdere notities over het migreren, onderzoeken of als referentie gebruiken van Home Assistant-automatiseringen voor Quick Actions zijn hiermee vervallen.

## Netwerkuitgangspunt dashboard ↔ Homey (11 november 2026)
- De Ubuntu-server met de dashboardcontainer staat in een ander VLAN dan Homey Pro 2023. De gebruiker heeft aangegeven dat er al een gerichte netwerktoegang (“gaatje”) tussen de VLAN's bestaat en dat de netwerkconfiguratie de standaard Homey-communicatie niet zal blokkeren.
- Het dashboard gebruikt de standaard, door Homey ondersteunde communicatie en poorten; er worden geen eigen of onnodige netwerkpoorten geïntroduceerd.
- De exacte API-/verbindingsmethode en benodigde poorten worden tijdens de technische verificatie vastgesteld voordat implementatie begint. Dit besluit legt nog geen specifieke poortnummers vast.
- Homey-authenticatiegegevens blijven uitsluitend aan de serverzijde en worden niet aan de browser of GitHub blootgesteld.


## Besluit GitHub-toegang vanaf Ubuntu-server (11 november 2026)
- De Ubuntu-server haalt de Homey Dashboard-repository op via een afzonderlijke GitHub Deploy Key (SSH), niet via een persoonlijk wachtwoord of persoonlijk toegangstoken.
- De Deploy Key krijgt uitsluitend leesrechten zolang de server alleen code hoeft te clonen en bij te werken (git clone/git pull).
- De privésleutel blijft op de Ubuntu-server en wordt niet naar GitHub, de repository of andere systemen gekopieerd. Alleen de publieke sleutel wordt als Deploy Key aan de repository gekoppeld.
- De sleutel wordt specifiek voor deze repository gebruikt en krijgt een herkenbare SSH-hostalias, zodat andere GitHub-repositories en persoonlijke SSH-sleutels niet onbedoeld worden beïnvloed.


## Meldingsniveaus – visuele kleurcodering (11 november 2026)

De gebruiker heeft de visuele richting voor meldingsniveaus bevestigd:
- **Kritiek:** rustige donkerrode/bordeauxrode achtergrond met lichtrode tekst en een lichtrood pictogram. Het contrast moet duidelijk en goed leesbaar zijn zonder fel of vermoeiend te ogen.
- **Waarschuwing:** rustige donkergele/okergele achtergrond met lichtere gele tekst en een lichtgeel pictogram. Ook hier geldt goed contrast en een rustige uitstraling.
- **Informatie:** kleurstelling nog niet vastgesteld; hiervoor wordt eerst de gebruiker geraadpleegd.

De bestaande frontend toont al de niveau-labels KRITIEK, WAARSCHUWING en INFO en kent CSS-klassen per severity, maar de huidige uitvoering onderscheidt de niveaus hoofdzakelijk met een gekleurde linkerrand. De volledige kleurvlakken, niveau-iconen en definitieve styling moeten nog worden geïmplementeerd. De prioriteit blijft een vaste eigenschap per melding.


### Aanvulling meldingsniveaus – INFO en toekomstige thema's (11 november 2026)

De gebruiker heeft de voorgestelde blauwe accentkleur voor **INFO** nog niet vastgesteld. INFO behoudt voorlopig de neutrale/bestaande stijl van de huidige dashboardinterface; er wordt nu geen aparte blauwe kleurstelling ingevoerd.

**Voorbereiding op toekomstige dashboardthema's is verplicht:** meldingskaarten en hun niveaustyling mogen niet afhankelijk worden van hardgecodeerde kleuren per component. De implementatie gebruikt semantische thematokens/CSS custom properties voor onder meer kaartachtergrond, tekst, pictogram, rand en severity-accenten. De huidige donkere interface levert de eerste set tokenwaarden. In een latere fase moeten thema's deze tokens kunnen overschrijven, zodat kritieke en waarschuwingsmeldingen in elk thema herkenbaar, consistent en voldoende contrastrijk blijven. INFO volgt voorlopig de neutrale tokens van het actieve thema.

De gekozen severity (critical/warning/info) blijft inhoudelijke metadata van de melding; alleen de visuele presentatie wordt door het actieve thema bepaald. Zo blijft de meldingslogica onafhankelijk van de themakeuze.
