# Dashboard layout



## Tablet portrait: equal clock and weather cards (14 November 2026)

- In the tablet portrait layout (viewport width 621–900px), the weather card now receives the same fixed responsive height as the clock card. The clock and weather cards therefore form a balanced top row.
- This adjustment is scoped to that tablet breakpoint only. Desktop layout and narrow phone layout (620px and below) retain their existing sizing and arrangement.


## Tablet portrait: equal-height quick-action rows (14 November 2026)

- In the tablet portrait layout (621–900px wide), all rows in the four-column quick-actions grid are equal height. The grid uses the tallest row's natural content height as the shared row height, so every row matches the tallest (typically middle) row.
- This rule is limited to tablet portrait; desktop and narrow phone layouts are unchanged.


## Tablet portrait: compact top row and equal tile rows (14 November 2026)

- In the tablet portrait layout (621–900px), the clock and weather cards are reduced from two tile-row heights to approximately one and a half tile-row heights, while remaining equal to each other.
- The measurement group always follows the weather card. It uses two columns and one, two or three rows for 2, 4 or 6 tiles respectively. Its total height grows with the selected count instead of being forced to match a quick-action row.
- These dimensions are scoped to tablet portrait. Desktop and narrow phone layouts are not changed.


## Tablet portrait: consistent gap between measurement and quick-action rows (14 November 2026)

- The tablet dashboard grid now aligns its implicit rows to the start rather than stretching them to fill the viewport's minimum height. This prevents leftover viewport height from becoming a large blank band between the measurement tiles (row 2) and quick actions (row 3).
- The vertical gap between the stacked dashboard sections is explicitly set to the same compact responsive spacing used by the tile grids (10–16px). This is scoped to the tablet breakpoint (621–900px); desktop and narrow phone layouts remain unchanged.


## Meetwaardetegels: intrinsieke minimale hoogte (15 november 2026)

- Elke dashboardtegel heeft een responsieve minimale hoogte van `clamp(132px, calc(11cqi + 60px), 190px)`. De voorkeursmaat volgt de breedte van de meetwaardegroep, met een minimum en maximum om te kleine of buitensporig grote tegels te voorkomen.
- De gridrijen gebruiken `minmax(auto, 1fr)`, zodat hun intrinsieke minimumhoogte niet wordt weggedrukt door een beperkte viewporthoogte.
- De instellingenpreview gebruikt een afzonderlijke, op de previewbreedte afgestemde minimale hoogte.
- De dashboardpagina vult minimaal de viewport, maar mag alleen verticaal meegroeien en scrollen wanneer de minimale inhoudsafmetingen anders niet passen. Bij voldoende ruimte blijft de bestaande schermvullende presentatie behouden.
- Deze regel geldt voorlopig uitsluitend voor meetwaardetegels. Pas na beoordeling op de tablet wordt besloten of dezelfde aanpak naar andere componenten wordt uitgebreid.


## Weerkaart: intrinsieke en responsieve hoogte (15 november 2026)

- De weerkaart heeft een responsieve minimale hoogte van `clamp(220px, 24vw, 340px)` en gebruikt een automatische hoogte in plaats van vaste hoogtes op tablet en mobiel.
- De aanvullende weermeetwaarden mogen teruglopen naar meerdere kolommen en rijen. Elk veld houdt een minimale breedte aan; bij meer ingeschakelde bronnen groeit de kaart mee met de inhoud.
- De kaart mag dus hoger worden wanneer de ingeschakelde weergegevens dat vereisen, zonder dat de inhoud wordt samengedrukt of horizontaal buiten de kaart loopt.
- De wijziging is beperkt tot de weerkaart; andere dashboardcomponenten blijven ongewijzigd.


## Centrale instellingenstijl en thema-tokens (15 november 2026)

- Alle instellingenmenu's gebruiken semantische `--settings-*` tokens voor kleuren, oppervlakken, randen, schaduwen, feedbackstatussen en herbruikbare componentgeometrie.
- Gebruik `settings-interactive` op het daadwerkelijke interactieve element. De klasse verzorgt hover, focus-visible, touch-active en overgangen.
- Gebruik `settings-interactive--text` aanvullend op tekstvelden en zoekvelden om de tekstcursor te behouden.
- De gedeelde interactiestijl gebruikt `--settings-control-*` tokens. Pas die tokens aan; voeg geen component-specifieke hoverkleuren toe.
- Geselecteerde/actieve opties behouden hun eigen geselecteerde achtergrond; hover voegt alleen een omlijning toe. Disabled elementen reageren niet op hover.
- De huidige tokenwaarden zijn het donkere standaardthema. `--ui-color-scheme` is voorbereid op native form controls. Een themawisselaar en licht thema zijn nog niet geïmplementeerd.
- Zie [Settings UI design system](10-ontwikkelaarshandleiding/settings-design-system.md) voor de volledige implementatie- en uitbreidingsafspraken.
