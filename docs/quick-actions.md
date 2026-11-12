# Quick Actions – implementatie

Branch: `phase_1_foundation`

## Doel
De acht Quick Actions in het dashboard worden beheerd via Instellingen → Dashboard → Snelle acties. De ingestelde configuratie is leidend voor zowel de instellingen-preview als de knoppen op het dashboard.

## Frontend-koppeling
- Het dashboard leest de acties via `GET /api/dashboard/quick-actions`.
- De acht dashboardknoppen worden nu opgebouwd uit de opgehaalde `quickActions`-configuratie in plaats van een vaste lijst.
- Per knop worden het ingestelde pictogram en de aangepaste naam getoond. Als de naam leeg is, wordt de standaardvertaling gebruikt.
- Een klik voert de actie uit via `POST /api/homey/quick-actions/:id/execute`.
- Tijdens uitvoering worden knoppen tijdelijk uitgeschakeld; fouten worden in het dashboard getoond via de bestaande foutmelding.

## Flow-zoekfunctie
- Boven de Flow-keuzelijst staat een zoekveld.
- De zoekopdracht filtert op een deel van de Flow-naam (substring), zonder onderscheid tussen hoofdletters en kleine letters.
- De filter wordt direct toegepast terwijl de gebruiker typt.
- Een reeds geselecteerde Flow blijft in de keuzelijst beschikbaar, ook als die niet overeenkomt met de huidige zoekterm.
- Voorbeeld: zoeken op `zon` vindt onder meer `Zon onder`, `Zon op`, `Gezond eten`, `TV aan zondag 20:00` en `Water geven zonnebloemen`, mits deze Flows in de Homey-catalogus aanwezig zijn.
- De zoekinterface heeft Nederlandse en Engelse vertalingen.

## Backend en opslag
De bestaande backend blijft verantwoordelijk voor configuratievalidatie en opslag in `data/dashboard-actions.json`. De acht vaste actie-ID's blijven behouden. Flow- en apparaatbediening gebruiken de bestaande catalogus- en uitvoerfuncties.

## Betrokken bestanden
- `src/client/main.tsx`
- `src/client/style.css`
- `src/client/locales/nl.json`
- `src/client/locales/en.json`
- `src/server/quick-actions.ts` (bestaande opslag/validatie)
- `src/server/index.ts` (bestaande API-routes)
- `src/server/homey.ts` (bestaande Homey-catalogus en uitvoering)

## Teststatus en aandachtspunten
De wijzigingen zijn naar GitHub gepusht. Er is vanuit deze wijziging geen Docker-build of runtime-test op de Ubuntu-server uitgevoerd. Na het ophalen van de branch moet de container opnieuw gebouwd en gestart worden. Controleer daarna:
1. Dat alle acht ingestelde knoppen op het dashboard zichtbaar zijn.
2. Dat naam en pictogram overeenkomen met de configuratie.
3. Dat een Flow-actie en een apparaatactie daadwerkelijk uitgevoerd worden.
4. Dat zoeken op `zon` de genoemde gedeeltelijke matches teruggeeft.
5. Dat opslaan en herstarten de configuratie behouden.

De zoekfunctie kan alleen Flows tonen die door Homey in de bestaande catalogus worden teruggegeven.


## UX-correctie Flow-selectie
De Flow-selectie is een eigen dropdown geworden in plaats van een los zoekveld boven een native HTML-select. De zoekregel verschijnt nu pas wanneer de gebruiker de Flow-keuzelijst opent en staat boven de filterbare lijst in hetzelfde dropdownvenster. Filteren gebeurt op gedeeltelijke tekst, hoofdletterongevoelig, en ook op de beschikbare icon-tekst en Flow-type. Flow-regels tonen een pictogram; als Homey geen bruikbaar pictogram aanlevert, wordt een standaardpictogram gebruikt voor standaard- en Advanced Flows.

## Flow-keuzelijst: hover, selectie en touch
- Op muis/trackpad krijgt de optie onder de pointer een afgeronde pilvormige omlijning.
- De geselecteerde optie behoudt de bestaande blauwe achtergrondkleur (`#1c4c77)); bij hover komt alleen de omlijning erbij.
- Opties hebben minimaal 48 px hoogte, ruime padding en touch-action: manipulation voor telefoon en tablet.
- Keyboard-focus is zichtbaar via `:focus-visible`. Hover-styling wordt alleen toegepast op apparaten met een echte hover-pointer; touch krijgt een duidelijke actieve feedback.

## Instellingenmenu: hover, selectie en touch
- Instellingenmenu-opties gebruiken dezelfde afgeronde capsulevorm als de Flow-keuzelijst.
- Bij muis-hover op een beschikbare optie verschijnt een subtiele lichte omlijning.
- De actieve pagina behoudt de bestaande blauwe achtergrondkleur (`#0965d7`); hover voegt alleen een omlijning toe.
- Touch-opties hebben minimaal 52 px hoogte en krijgen actieve feedback; toetsenbordfocus blijft zichtbaar.
- Uitgeschakelde menu-items krijgen geen hover-interactie.

## Niet-geïmplementeerde instellingenmenu's
Niet-beschikbare menu-items blijven disabled en krijgen expliciet `pointer-events:none`. Daardoor reageren ze niet op muis-hover, touch of pointer-interactie. Alleen geïmplementeerde menu-items tonen de hover-omlijning.

## Dashboard Quick Actions – raster en typografie
- De zichtbare volgnummerlabels (01–08) zijn uit de actiekaarten verwijderd.
- Op desktop/tablet worden de acht acties getoond in een raster van vier kolommen en twee rijen.
- De actie-iconen en labels zijn vergroot en de kaartinhoud is gecentreerd.
- Op smalle telefoons wordt het raster twee kolommen breed zodat labels en aanraakvlakken leesbaar en bruikbaar blijven.

## Dashboard-layout: meldingen, footer en klok
- Actieve meldingen worden op brede schermen in twee kolommen weergegeven, met een subtiele verticale scheidingslijn.
- Op smalle telefoons schakelt de meldingenlijst terug naar één kolom voor leesbaarheid.
- De footer met "HOMEY DASHBOARD" en apparaat-/ruimteaantallen is uit het meldingenpaneel verwijderd om verticale ruimte vrij te maken.
- De klokkaart krijgt een vaste hoogte die overeenkomt met de totale hoogte van twee Quick Actions-kaartrijen inclusief tussenruimte. De kloktypografie schaalt mee met de kleinere kaart.

## Instellingen: kaarten behouden hun volledige inhoudshoogte
De algemene instellingenpagina gebruikt een scrollbaar contentgebied. Systeemkaarten (Weer-API-tokens en Systeemstatus) mogen daarin niet meer als flex-items worden samengedrukt tot de resterende viewporthoogte. Ze gebruiken nu hun natuurlijke inhoudshoogte (`flex: 0 0 auto`), zodat de kaartachtergrond en rand de volledige inhoud blijven omsluiten en de pagina als geheel scrollt wanneer nodig.

## Quick Actions-editor en instellingenmenu-vormgeving
- De Quick Actions-editor staat standaard gesloten wanneer de instellingenpagina Dashboard wordt geopend. De gebruiker opent de editor door expliciet een actie uit de lijst te selecteren.
- De actieve optie in de linker instellingen-navigatie gebruikt afgeronde rechthoekige hoeken (14 px), passend bij de kaart- en knopvormgeving in de rest van de interface, in plaats van een capsule/pill-vorm.
- De bestaande blauwe actieve achtergrond, hover-omlijning en touchvriendelijke afmetingen blijven behouden.