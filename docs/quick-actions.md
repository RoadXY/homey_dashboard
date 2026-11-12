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

## Live synchronisatie van instellingen naar dashboard-schermen
- De server publiceert na succesvol opslaan van Algemene instellingen of Quick Actions een `settings-updated`-event via het bestaande Server-Sent Events-endpoint `/api/events`.
- Alle open dashboardclients luisteren naar dit event en halen de actuele dashboardgegevens opnieuw op.
- Hierdoor worden bijvoorbeeld gewijzigde Quick Actions en taal-/datum-/tijdvoorkeuren op de tablet bijgewerkt zodra ze op een andere computer zijn opgeslagen, zonder handmatige refresh of volledige browserreload.
- SSE-clients worden bij verbreken van de verbinding automatisch opnieuw verbonden door de browser; na reconnect stuurt het bestaande `ready`-event opnieuw een data-refresh aan.

## Validatie Quick Action-editor
- De knop **Toepassen** is alleen actief als de gekozen actie naar een bestaande, beschikbare Homey-doelactie verwijst.
- Voor Flow-acties moet de combinatie van Flow-ID en Flow-type exact voorkomen in de actuele Homey-catalogus. Een lege, verwijderde of uitgeschakelde Flow kan niet worden toegepast.
- Voor apparaatacties moeten apparaat en capability in de actuele catalogus bestaan en moet het apparaat beschikbaar zijn.
- De controle wordt ook in de klikhandler uitgevoerd, zodat een ongeldige actie niet kan worden toegepast via alternatieve bediening.
- Zo kan een lege zoekopdracht of zoekterm zonder resultaten niet leiden tot het toepassen van een niet-bestaande Flow.


## Quick Action Flow-zoekvalidatie en zoekveld
- Zolang de Flow-keuzelijst open is en er een zoekterm staat, moet de huidige geselecteerde Flow ook binnen de gefilterde resultaten vallen voordat **Toepassen** actief wordt.
- Een zoekterm zonder resultaten, of resultaten die niet de huidige selectie bevatten, blokkeert **Toepassen**. De gebruiker moet dan een passende Flow kiezen of de zoekterm wissen.
- De Flow-resultatenlijst en teller gebruiken dezelfde afgeleide gefilterde lijst om afwijkende tellingen of validatie te voorkomen.
- Het zoekveld gebruikt uitsluitend de ingebouwde wisbediening van `input type="search"`; de extra eigen kruis-knop is verwijderd om dubbele kruisjes te voorkomen.


## Material Design Icons (MDI)
- Quick Action-pictogrammen gebruiken de lokaal gebundelde Material Design Icons-fontbibliotheek van Pictogrammers, versie `7.4.47` van `@mdi/font` en `@mdi/svg`.
- De iconen worden lokaal in de frontendbuild opgenomen; runtime internettoegang of een externe CDN is niet nodig.
- De iconpicker gebruikt de volledige MDI-metadatacatalogus uit `@mdi/svg` (duizenden iconen) en filtert op iconnaam, metadata-aliases en aanvullende Nederlandse zoektermen (bijvoorbeeld muziek, licht, raam, zon, tv en rolluik).
- Dezelfde gekozen MDI-iconen worden getoond in de configuratielijst, preview en het live dashboard.
- Bestaande Unicode/emoji-iconen worden bij het laden gemapt naar passende MDI-namen. De migratie wordt naar de configuratie geschreven zodra de gebruiker de Quick Actions opslaat.
- De Flow-keuzelijst behoudt de door Homey aangeleverde Flow-iconen; de MDI-keuze geldt voor het pictogram van de Quick Action-kaart.


## MDI-iconpicker – prestaties en standaardiconen
- De picker doorzoekt de volledige metadata-index, maar rendert maximaal 120 resultaten tegelijk om de interface soepel te houden op tablets.
- Het resultaatgebied is intern scrollbaar; bij veel overeenkomsten wordt gevraagd de zoekterm verder te verfijnen.
- De acht standaard Quick Actions gebruiken voortaan MDI-namen in plaats van Unicode-symbolen.


## Quick Action apparaatzoeker
- De Homey-apparaatkeuze gebruikt dezelfde zoekbare dropdown-interactie als de Flow-keuze.
- De zoekopdracht filtert op apparaatnaam, zone en (indien nodig) apparaat-ID. Het ID wordt niet standaard in de zichtbare apparaatnaam getoond.
- De lijst toont de apparaatnaam en optioneel de zone; niet-beschikbare apparaten krijgen een duidelijke Offline-indicator.
- Na selectie sluit de lijst en wordt de bijbehorende eerste capability als uitgangspunt gekozen, zoals bij de bestaande apparaatselectielogica.
- De lijst heeft een eigen scrollgebied en een teller met het aantal overeenkomende apparaten, zodat deze ook bij grote Homey-installaties bruikbaar blijft.
- Net als bij de Flow-zoeker wordt **Toepassen** geblokkeerd wanneer de apparaatzoeker openstaat met een zoekterm die het momenteel geselecteerde apparaat niet meer bevat.

## MDI-picker: metadata en eerste iconen
- De MDI-metadata gebruikt `name` als icon-identificatie (niet `id`). De picker gebruikt deze naam om de bijbehorende `.mdi-<naam>` font-class te tonen.
- Een samengestelde set veelgebruikte pictogrammen staat bovenaan, gevolgd door de volledige alfabetische MDI-catalogus. Zo zijn de eerste vakjes direct gevuld en blijven alle iconen doorzoekbaar.
- De naam-invoer toont de effectieve standaardnaam van de Quick Action als gewone bewerkbare invoerwaarde; de gebruiker hoeft niet eerst een grijze placeholder te vervangen.


## Diagnose en gedeeltelijk laden van Homey-selectiecatalogus
- Apparaten, standaard Flows en Advanced Flows worden onafhankelijk opgehaald met `Promise.allSettled`.
- Een fout bij het ophalen van één Homey-manager mag de gegevens uit de andere managers niet langer verbergen.
- De catalogusresponse bevat optioneel `warnings`; de Quick Action-editor toont deze waarschuwingen zodat een ontbrekende gegevensbron zichtbaar is in plaats van alleen "Geen resultaten".
- Als een manager geen gegevens levert, blijft de bijbehorende zoeklijst leeg en toont de editor de bijbehorende foutmelding.


## Standaardpictogram en validatie Quick Actions
- De frontend voert geen migratie van oude Unicode-/emoji-pictogrammen meer uit; de Quick Actions-configuratie is nieuw en in ontwikkeling.
- Bij het laden van Quick Actions controleert de frontend of het opgeslagen pictogram een bekende MDI-iconnaam is (ook de optionele prefix `mdi:` wordt ondersteund).
- Een ontbrekend of onbekend pictogram wordt weergegeven als `lightning-bolt`.
- Geldige, zelfgekozen MDI-pictogrammen blijven ongewijzigd.
- Deze normalisatie wordt toegepast op zowel de acht knoppen op het hoofddashboard als de instellingenlijst, preview en editor. De genormaliseerde waarden worden ook gebruikt als uitgangspunt voor de editor-opslagstatus.
- De eerdere verwijzing naar de niet-bestaande variabele `legacyQuickActionIcons` is verwijderd.
- Implementatie gepusht naar `phase_1_foundation`; runtime-/Docker-test op de Ubuntu-server moet nog worden uitgevoerd.


## Servervalidatie MDI-pictogrammen
- De Quick Actions-editor verstuurt MDI-iconnamen (bijvoorbeeld `lightning-bolt` en `music-note`).
- De servervalidatie accepteert nu geldige MDI-iconnamen met kleine letters, cijfers en koppeltekens, in plaats van uitsluitend de oude vaste set Unicode-symbolen.
- De serverstandaard voor alle acht nieuwe Quick Actions is `lightning-bolt`.
- Hiermee worden zelfgekozen pictogrammen niet langer door de server afgewezen met `Ongeldig pictogram.`.
- Code is bijgewerkt op `phase_1_foundation`; Docker-build en opslaan/herladen moeten nog op de Ubuntu-server worden getest.


## Foutmeldingen in de instellingenbalk
- De status-/meldingsruimte onderaan de Quick Actions-pagina vult de beschikbare breedte tot aan de knop Opslaan.
- Fouten worden visueel als rode balk weergegeven, met lichte tekst, rode rand en een duidelijke linker accentlijn.
- De foutmelding gebruikt `role="alert"` zodat hulptechnologie de fout direct aankondigt; normale statusmeldingen behouden `role="status"`.
- De Opslaan-knop blijft afzonderlijk rechts uitgelijnd.
- Frontend en CSS zijn bijgewerkt op `phase_1_foundation`; visuele controle op de Ubuntu-server moet nog plaatsvinden.


## Apparaatnamen in de Quick Action-editor
- De apparaatkeuzelijst toont de apparaatnaam zonder een zone-achtervoegsel dat feitelijk een UUID/device-ID bevat.
- Een echte zone-/kamernaam blijft zichtbaar achter de apparaatnaam.
- Het technische apparaat-ID blijft intern beschikbaar voor selectie en filtering, maar wordt niet als onderdeel van de zichtbare naam getoond.
- Aangepast in `src/client/main.tsx` op `phase_1_foundation`; controle op de Ubuntu-server volgt na de volgende build.


## Leesbaarheid apparaatkeuzelijst
- De rijen in de apparaatkeuzelijst hebben meer verticale ruimte gekregen (minimaal 62px) en extra tussenruimte.
- De apparaatpictogrammen zijn vergroot naar 25px en krijgen een bredere vaste kolom.
- De aanpassing is beperkt tot de apparaatkeuzelijst; de Flow-keuzelijst blijft ongewijzigd.
- CSS bijgewerkt op `phase_1_foundation`; visuele controle volgt na de Docker-build.


## Herstel crash Dashboard-instellingen na apparaatnaam-aanpassing
- De hulpfuncties `displayDeviceZone` en `deviceDisplayName` worden nu gedeclareerd vóór de apparaatlijst deze gebruikt in `filter()`.
- Dit voorkomt een JavaScript temporal-dead-zone-fout (`Cannot access before initialization`) waardoor de Dashboard-instellingen na kort renderen leeg werden.
- De wijziging is beperkt tot de volgorde van initialisatie; de opgeschoonde apparaatlabels en de ruimere apparaatkeuzelijst blijven behouden.
- Herstel gepusht naar `phase_1_foundation`; Docker-build en runtimecontrole op de Ubuntu-server moeten nog worden uitgevoerd.
