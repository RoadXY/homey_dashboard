# Fases en vrijgavecriteria

## Voorwaarde vóór implementatie
Er wordt niet gebouwd voordat mockups en functioneel ontwerp door de gebruiker zijn goedgekeurd.

## Fase 1 – foundation en eerste dashboard
- Project- en architectuurdocumentatie.
- Docker-webapp op Ubuntu.
- Lokale Homey-koppeling en apparaatontdekking.
- Configuratiepagina met pincode.
- Selectie van apparaten/capabilities.
- Quick buttons en statische JSON-meldingen.
- Bestaande Home Assistant-dashboardfunctionaliteit als nulmeting porten, met behoud van alle bestaande voorwaarden en combinaties.
- Media-informatie alleen tonen wanneer spelers actief zijn; in het nieuwe dashboard uitsluitend informatief.
- Offlinegedrag met laatst bekende waarden en rode ‘Homey Offline’-indicator.

## Fase 2 – beheer en uitbreidingen
- WYSIWYG-editor voor meldingen.
- Meldingenoverzicht en bewerken per melding.
- Door de gebruiker dynamisch samenstellen van meldingsteksten, apparaatwaarden en combinaties.
- Complexe AND/OR-condities beheren.
- Homey Flow pushmeldingen.
- Uitbreidingen op configuratie en presentatie.

## Fase 3 – nader te bepalen
Prioriteitsverfijning, verdere optimalisatie en eventuele aanvullende functies worden later vastgesteld.

## Huidige status
Inventarisatierondes 1 t/m 22 zijn afgerond en gedocumenteerd. De eerste analyse van de aangeleverde Home Assistant-YAML (983 regels, 55 kaarten) is vastgelegd. De volledige mapping van YAML-entiteiten/voorwaarden naar Homey-apparaten en capabilities moet nog gebeuren. Mockups en functioneel ontwerp zijn nog niet goedgekeurd. Er is nog geen applicatiecode gestart.

### Fase 3 – Voorgeprogrammeerde thema's
In fase 3 wordt een selectie vooraf ontworpen dashboardthema's toegevoegd. In fase 1/2 worden pictogrammen en overige visuele eigenschappen automatisch door het actieve thema bepaald; per actieknop kan de gebruiker alleen het MDI-pictogram kiezen. De concrete themavarianten worden in de ontwerpfase voor fase 3 vastgesteld.

### Fase 3 – Meertaligheid en vertalingen
Fase 3 omvat ondersteuning voor meerdere dashboardtalen. Vertalingen van dashboardteksten en relevante zoektermen worden in JSON-bestanden beheerd. Ook wordt de MDI-zoekfunctie uitgebreid met Nederlandse en Engelse termen en synoniemen. In de huidige fase gebruikt de zoekfunctie alleen de namen die door de MDI-website worden aangeleverd.

### Voorbereiding meertaligheid in huidige fase
De dashboardtaal is in de huidige fase Nederlands, maar alle zichtbare teksten worden al via JSON-vertaalbestanden beheerd. In fase 3 wordt dit uitgebreid naar meerdere talen en een instelbare dashboardtaal.

### Indeling vertalingen
In de huidige fase wordt Nederlands gebruikt. Vertalingen worden georganiseerd in meerdere JSON-bestanden per taal, opgesplitst per onderdeel van de applicatie. In fase 3 wordt ondersteuning voor meerdere talen toegevoegd.

### Taalondersteuning
Engels is de standaard- en terugvaltaal van de applicatie. Nederlands en toekomstige talen zijn optionele taalkeuzes. Bij ontbrekende vertalingen wordt de Engelse tekst gebruikt. Vertalingen blijven per taal en per applicatieonderdeel in afzonderlijke JSON-bestanden georganiseerd.

### Standaardtaal bij installatie
Bij een nieuwe installatie wordt Engels automatisch als dashboardtaal geselecteerd. De gebruiker kan dit later wijzigen naar een andere beschikbare taal.

### Taalinstelling bij nieuwe installatie
De dashboardtaal wordt bij de eerste installatie afgeleid van de taalinstelling van Homey. Als die taal wordt ondersteund, wordt deze geselecteerd. Anders wordt Engels gebruikt en krijgt de gebruiker een duidelijke melding over de gedetecteerde maar niet-beschikbare taal. Engels is tevens de terugvaltaal voor ontbrekende vertalingen binnen een taalbestand.

### Taalkeuzelijst
De keuzelijst bevat bovenaan Automatisch met de gedetecteerde Homey-taal in de naam (bijvoorbeeld **Automatisch (Nederlands)**). Verder worden alle talen getoond waarvoor ten minste een gedeeltelijke vertaling bestaat. Bij een niet-ondersteunde Homey-taal wordt Engels gebruikt en krijgt de gebruiker hierover een melding.

### Directe taalwisseling
Een wijziging van de geselecteerde dashboardtaal wordt onmiddellijk in de interface toegepast. Een paginaherlading of herstart van de Docker-container is niet nodig.

### Persistente taalvoorkeur
De handmatige taalkeuze wordt blijvend opgeslagen en blijft actief na een volgend bezoek en na herstart van de Docker-container. Alleen wanneer de gebruiker Automatisch selecteert, volgt het dashboard opnieuw de Homey-taal.

### Plaatsing taalkeuze
De taalinstelling is beschikbaar op de instellingenpagina **Algemeen**, bij de datum- en tijdinstellingen.

### Temperatuurpreview
De preview wordt direct live bijgewerkt bij wijzigingen aan de vier temperatuurtegels. Het betreft een preview van de conceptinstellingen; definitief bewaren gebeurt via Opslaan.

### Sensorselectie temperatuurtegels
De sensorpicker ondersteunt alle niveaus van de Homey-ruimtestructuur. Ruimte-iconen worden weggelaten. Binnen een gekozen ruimte worden alleen apparaten met geschikte temperatuurmetingen aangeboden, met de meetwaarden zodat de gebruiker de juiste bron kan kiezen. Terugnavigatie verloopt via het kruimelpad, niet via een aparte lijstoptie. Bij lange paden blijven het huidige niveau en de twee voorgaande niveaus zichtbaar; overige niveaus zijn via een aanklikbare ellipsis te openen en te selecteren.

### Weerkaart
De volgorde van de acht weergegevens is vast. Per onderdeel kan de gebruiker de zichtbaarheid instellen; de volgorde kan niet worden aangepast. De live preview weerspiegelt de zichtbare onderdelen.

### Preview weerkaart
De weerkaartpreview wordt direct bijgewerkt bij het in- en uitschakelen van onderdelen. De gebruiker ziet de conceptweergave vóór Opslaan.

### Configuratie snelactieknoppen
Voor iedere snelactie kiest de gebruiker expliciet het actietype via twee keuzeknoppen: Flow of Apparaat. Bij Flow wordt een bestaande Homey Flow gekozen via een doorzoekbare lijst. Bij Apparaat wordt via ruimte en apparaat een ondersteunde apparaatactie gekozen. De Flow blijft ook handmatig in Homey startbaar. Naam en pictogram zijn per knop instelbaar; preview wordt direct bijgewerkt en gebruikt monochrome pictogrammen volgens het actieve thema.

### Thema-uitbreiding fase 3
Neem naast de overige vooraf gedefinieerde thema's ook een **Homey-stijl thema** op. Gebruik de door de gebruiker aangeleverde Homey-apparatenpagina als visuele referentie: donkere antraciet/zwart-grijze basis, ingetogen grijze kaartvlakken en blauwe accenten. De precieze stijlwaarden worden in fase 3 ontworpen.

### Meldingeninstellingen
De instellingenpagina Meldingen heeft uitsluitend het tabblad **Meldingen**. Er zijn geen aparte tabbladen Weergave of Volgorde: de kaartpresentatie ligt vast volgens de bestaande ontwerpafspraken en de sortering gebeurt automatisch op niveau en activatietijd.
