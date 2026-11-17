# Settings UI design system

## Status and scope

The settings interface uses a shared semantic design-token layer and a shared interaction class. The implementation covers:

- General settings and the PIN gate
- Settings navigation, top bar and return action
- Quick Actions and its device, Flow and icon pickers
- Notifications, severity controls, notification pickers and the Blockly workspace
- Measurement tiles and their source/editor controls
- Weather sources, toggles, icon-pack choices and Weather API token controls

The current token values describe the existing dark appearance. The agreed theme scope is deliberately limited: themes may change colors and visual surfaces, while layout, sizing, typography, spacing, interaction behavior and responsive rules remain fixed. A theme switcher, persisted theme preference and a light theme are **not implemented**.

## Source of truth

- Styles and theme tokens: `src/client/style.css`
- Interactive element classes: `src/client/main.tsx`
- This document: implementation and extension contract

The `--settings-*` properties on `:root` are the current dark-theme defaults. They are intended for theme-dependent presentation only: backgrounds/surfaces, text, accent, borders, shadows and (optionally) corner radii. Geometry and behavior tokens are not theme customization points. Settings rules that previously depended on dashboard-wide surface, text and navigation tokens now use settings aliases (`--settings-panel-*`, `--settings-tab-*` and `--settings-accent-*`). Their defaults reference the existing dashboard palette so the current appearance is retained, while a future settings theme can override the settings aliases independently.

The `--ui-color-scheme` token drives the browser's native control color scheme through `color-scheme: var(--ui-color-scheme)`. A future light theme should set this token to `light`; the current default is `dark`.

## Token groups

Use the existing semantic tokens rather than introducing literal colors in settings component rules.

| Token group | Purpose |
|---|---|
| `--settings-shell-*`, `--settings-topbar-*`, `--settings-sidebar-*` | Main settings shell, header and navigation surfaces |
| `--settings-surface-*`, `--settings-divider`, `--settings-shadow-*` | Cards, panels, dividers and elevation |
| `--settings-text-*` | Primary, secondary, muted, inverted and contextual text |
| `--settings-control-*` | Native and custom control backgrounds, borders, hover, active, focus and selected states |
| `--settings-nav-*`, `--settings-accent*` | Navigation and informational accents |
| `--settings-button-*` | Primary and secondary actions |
| `--settings-info-*`, `--settings-success-*`, `--settings-warning-*`, `--settings-error-*`, `--settings-danger-*` | Feedback and status colors |
| `--settings-menu-*`, `--settings-source-menu-*` | Searchable dropdowns and popup menus |
| `--settings-workspace-*` | Blockly/editor workspace, toolbox and fields |
| `--settings-quick-*`, `--settings-preview-*`, `--settings-editor-*` | Quick Actions and measurement editor surfaces |
| `--settings-radius-*` | Optional theme-dependent corner radii |

Fixed component geometry (heights, padding, spacing), typography, transitions and responsive rules are implementation standards, not theme options.

The severity tokens `--severity-critical-*`, `--severity-warning-*` and `--severity-info-*` remain the shared semantic source for notification severity badges and states. Do not replace those with generic accent colors.

## Shared interaction class

Add `settings-interactive` to the **actual interactive element** (button, select, input or option button), not to a decorative wrapper.

```tsx
<select className="settings-interactive" />
<button className="settings-interactive">Choose</button>
```

For text inputs and search fields, add the text-cursor modifier:

```tsx
<input className="settings-interactive settings-interactive--text" />
```

The shared class provides:

- A consistent hover border, background and inset highlight on devices with a fine hover pointer
- A visible `:focus-visible` outline for keyboard navigation
- A subtle active state on touch devices
- A short shared transition
- No hover/active feedback for disabled controls

### Selected and active states

Keep the component's existing `selected` or `active` class. The shared class deliberately treats those states separately: it adds a distinct outline on hover without replacing the selected background. This applies to navigation, icon choices, source-type tabs, notification choices and weather icon-pack options.

Do not add a second component-specific hover rule unless the interaction is intentionally different and the reason is documented. If a special state is required, implement it with semantic tokens.

## Settings-page coverage

| Area | Shared styling coverage |
|---|---|
| General | Language/date/time/timeout selects, Weather API token name, token creation, token actions, status and save controls |
| Navigation | Sidebar items, collapse control, brand action and return action |
| Quick Actions | Action rows, editor controls, device/Flow selectors, selectable Flow options, icon picker, search fields and save/cancel actions |
| Notifications | Notification selector and options, create/delete/enable actions, severity select, title/search fields, source pickers and Blockly workspace surfaces |
| Measurement tiles | Count selector, tile rows, source-type tabs, editor fields, source selects and save actions |
| Weather | Nine source dropdowns, disabled-source behavior, source toggles, motion toggle, four icon-pack choices, API token field and documentation action |

All native `select` elements in the settings UI use `settings-interactive`. Custom dropdown triggers and option buttons use the same class on their actual buttons. Disabled weather-source dropdowns remain excluded from hover feedback.

## Shared component standards

The reusable settings primitives currently live in CSS and are applied by the existing page markup; this is not a new React component framework:

| Primitive | Existing implementation | Contract |
|---|---|---|
| Cards/panels | `.settings-card`, `.notification-rule-selector`, editor/preview card classes | Use semantic surface, border and shadow tokens; preserve page-specific padding where needed. |
| Settings rows | `.setting-row`, `.status-row`, `.token-list-row` | Keep established row layout and density; use semantic divider/text tokens. |
| Labels/descriptions | Existing `label`, `.quick-card-description`, `.settings-title p` and page-specific description classes | Use settings text tokens; keep current typography hierarchy. |
| Inputs/selects | Page-specific field selectors plus `.settings-interactive` | Use semantic control/menu/workspace tokens; retain compact/large size variants. |
| Buttons | `.primary-button`, `.secondary-button`, `.notification-create-button` and page-specific actions | Keep primary/secondary/danger semantics and existing dimensions; do not flatten distinct action hierarchy. |
| Toggles/selections | `.settings-interactive`, `.settings-nav.active`, `.selected` and toggle classes | Preserve selected state and shared focus/hover/touch behavior. |
| Status messages/badges | `.save-message`, `.status-pill`, `.action-error`, `.quick-catalog-warning` | Use semantic success/warning/error tokens and accessible status semantics. |

Components must retain established dimensions and behavior across themes. Extract shared styling only where the existing pages genuinely share the same structure; do not force unrelated controls into a single visual variant.

## Geometry and component variants

Use the existing geometry tokens for common shapes and dimensions. The interface intentionally retains compact and large variants where the context requires them (for example, a compact severity select and a larger searchable source picker). Do not force every control to one height when that would reduce usability or break the established layout.

## Intentional exceptions

A small, explicit set of colors are content semantics rather than theme chrome:

- The multicolor brand orb remains brand artwork.
- The weather icon pack retains recognizable sun, rain, snow, lightning and wind colors. These communicate weather conditions, not the settings theme.
- Notification severity colors remain in the dedicated severity token group.
- Dashboard-only components continue to use dashboard-wide tokens such as `--text-secondary` and `--text-muted`, rather than settings-only tokens.

These exceptions should remain explicit. New settings surfaces, controls and menu states should use the `--settings-*` token family.

## Theme boundaries

A future theme may override only presentation tokens for backgrounds/surfaces, text, accent colors, borders, shadows and optionally corner radii. Keep component dimensions, placement, typography, spacing, transitions, interactions and responsive behavior identical. No theme selector, persistence mechanism or second theme is part of this work. Do not introduce a generalized theming framework.

## Validation notes

The v2 source audit verifies that the settings stylesheet has balanced braces, every referenced CSS custom property is defined, the former dashboard-wide surface/text/navigation references have been replaced within settings rules by settings aliases, and the four self-referential workspace/source-menu tokens have concrete defaults. The remaining literal colors in the settings region are limited to the multicolor brand artwork and recognizable weather-condition colors; weather-icon drop shadows remain decorative. Visual verification in the running Docker container remains a separate tablet/browser test. No light theme or theme-switching behavior is claimed by this implementation.


## Canonical searchable picker

Searchable settings dropdowns use one shared visual contract in `src/client/style.css`:

- Wrapper: `.settings-searchable-picker`
- Trigger: `.settings-searchable-trigger`
- Popup: `.settings-searchable-menu`
- Search row/input: `.settings-searchable-search`
- Scrollable results: `.settings-searchable-results`
- Result option: `.settings-searchable-option`
- Empty state: `.settings-searchable-empty`
- Result count/footer: `.settings-searchable-footer`

Page-specific classes may remain for content layout and semantic details (icons, badges, grouped headings), but must not redefine the shared menu geometry, search row, option density, borders, surface, shadow or footer. The canonical appearance follows the Notifications picker. Current integrations include Notifications, Quick Actions (Flow and device) and Weather source pickers.

## Searchable picker dismissal

Every custom searchable picker must close when the user clicks or taps outside its picker, or presses Escape. Pointer events inside the trigger, search field, result list and menu must not dismiss it. Selection continues to close the picker through its existing selection handler. For a page with multiple sibling pickers, an interaction inside any active picker must not be mistaken for an outside click on another picker.


## Statuslabels in zoekresultaten

Gebruik `.settings-status-warning` voor een status die extra aandacht vraagt maar geen kritieke fout is, zoals een Homey-apparaat dat offline is. De klasse deelt de gele waarschuwingsbadge-stijl met `.notification-warning-badge`. Pas dit toe op offline-labels in alle zoekbare bronlijsten; gebruik geen gedempte standaardtekst voor deze status. De vertaalde statusinhoud blijft afkomstig uit de bestaande i18n-sleutel.


### Kleuren voor statuslabels in zoekbare keuzemenu's

De zoekbare keuzemenu's (ook aangeduid als searchable dropdowns of pickers) gebruiken drie semantische statusaccenten:

- `.settings-status-danger` / bestaande `.notification-disabled-badge`: rood voor uitgeschakeld of kritiek.
- `.settings-status-warning` / `.notification-warning-badge`: geel voor waarschuwingen, zoals een offline Homey-apparaat.
- `.settings-status-info`: blauw voor informatieve metadata, zoals het typeaanduiding-label `Advanced`.

Gebruik kleur op basis van betekenis, niet alleen om items decoratief te onderscheiden. De blauwe variant gebruikt de centrale settings-accenttokens.


## Flow picker breedte en filtertip

De Flow-zoekkiezer heeft een maximale popupbreedte van 670 px, gebaseerd op de gewenste breedte uit de referentiescreenshot. De popup blijft smaller wanneer de beschikbare ruimte kleiner is. De footer toont de resultatenteller links en de tip over het label Advanced rechts. Op smalle schermen mogen deze elementen naar een tweede regel doorlopen.


### Quick Action-type selector

In the Quick Action editor, the action type (Flow / Apparaat) is presented as a two-button segmented selector rather than a native dropdown. It follows the same visual pattern as the Apparaat / Homey Logic selector in Measurement Tiles. Keep the selected state visually clear and expose it with `aria-pressed`.


The Quick Actions device searchable picker (`.quick-device-menu`) uses the same 670px maximum width as the Flow picker. On narrow viewports it is constrained to the available viewport width with 20px side allowance.


### Meetwaardetegels: annuleren van wijzigingen

De vaste actiebar onderaan de instellingenpagina voor meetwaardetegels toont naast Opslaan ook Annuleren. Annuleren herstelt zowel het aantal tegels als alle tegelinstellingen naar de laatst opgeslagen serverconfiguratie, sluit de geopende editor en wist een eventuele tijdelijke statusmelding. De actie is uitgeschakeld wanneer er geen wijzigingen zijn, tijdens laden of tijdens opslaan. Gebruik de bestaande vertaling `settings.cancel` en de gedeelde `.secondary-button`-stijl.


Bij Annuleren op de meetwaardetegels-pagina wordt de laatst opgeslagen configuratie hersteld, de geselecteerde tegel leeggemaakt en de editor gesloten. Daarmee keert de gebruiker terug naar het overzicht met tegels en voorbeeld, zonder een tegel geselecteerd te laten.


### Opslaan-knoppen in Instellingen

Alle primaire Opslaan-acties binnen Instellingen tonen uitsluitend de vertaalde tekst (of de vertaalde bezig-status tijdens opslaan). Gebruik geen decoratief vierkant-/diskette-icoon of ander prefixteken op Opslaan-knoppen. Houd de bestaande primaire knopstijl en vertalingen intact.


### Uniforme Opslaan- en Annuleren-knoppen

Alle Opslaan- en Annuleren-knoppen in de vaste actievoeten van Instellingen gebruiken dezelfde gedeelde geometrie en typografie, ongeacht de instellingenpagina. Beide varianten zijn 112px breed en hebben dezelfde vaste hoogte via `--settings-button-height`, zonder afwijkende horizontale padding. Lettertype, grootte (16px), gewicht (500), regelhoogte, letterafstand en uitlijning zijn identiek. Alleen de semantische kleur-/randstijl en de vertaalde knoptekst verschillen. De regel is bewust beperkt tot actievoeten zodat secundaire acties zoals token intrekken niet onbedoeld breder worden.


### Consistente Opslaan-labels

Knoppen die wijzigingen van een instellingenformulier bevestigen gebruiken de bestaande `settings.save`-vertaling. De Quick Actions-editor gebruikt dus ook Opslaan/Save en niet Toepassen/Apply. De ongebruikte i18n-sleutel `settings.apply` is verwijderd uit alle ondersteunde vertaalbestanden (Nederlands en Engels). Gebruik geen aparte Apply-labelsleutel voor het opslaan of bevestigen van formulierwijzigingen.


### Dynamische openingsrichting van searchable dropdowns

De gedeelde searchable picker bepaalt bij openen automatisch aan welke kant van de trigger de meeste bruikbare viewport-ruimte beschikbaar is. Als de ruimte onder de trigger kleiner is dan de benodigde menuhoogte en er boven meer ruimte beschikbaar is, krijgt het menu de klasse `opens-up` en opent het omhoog. Anders opent het omlaag. De maximale hoogte wordt begrensd op 440px en aangepast aan de beschikbare ruimte; de resultatenlijst behoudt de eigen scrollbar.

De positie wordt opnieuw berekend bij DOM-wijzigingen (openen/sluiten), scrollen en wijzigen van de viewportgrootte. De logica is centraal in de applicatie geïmplementeerd en vereist geen handmatige richtinginstelling per picker. De bestaande pickerbreedtes blijven ongewijzigd.


### Meetwaardetegels – apparaatselectie (16 november 2026)

De ruimteselectie is verwijderd uit de editor voor meetwaardetegels. De gebruiker kiest voortaan rechtstreeks een apparaat uit de volledige Homey-apparatenlijst; de gekozen apparaat-ID blijft de opgeslagen bronidentiteit. De backendconfiguratie en het bronmodel blijven ongewijzigd: de ruimte was uitsluitend een frontendfilter en maakte geen deel uit van de opgeslagen tegelbron.

De apparaatkeuze gebruikt de bestaande searchable picker-styling en -positionering (variant B): zoekbalk, filteren op apparaatnaam, geselecteerde status en een amberkleurig label voor offline apparaten. Na het kiezen van een ander apparaat wordt de eerder gekozen capability gewist, zodat geen capability van het vorige apparaat per ongeluk gekoppeld blijft. De capability-keuze zelf blijft voorlopig een gewone dropdown.



### Meetwaardetegels – Logic-variabelepicker (16 november 2026)

De selectie van een numerieke Homey Logic-variabele gebruikt nu eveneens variant B van de searchable picker. De picker biedt zoeken op variabelenaam, toont de geselecteerde variabele en geeft een lege-resultatenmelding wanneer de zoekterm niets oplevert. De selectie blijft gekoppeld aan de bestaande Logic-variabele-ID; API en opslagmodel zijn niet gewijzigd. De Nederlandse en Engelse teksten zijn toegevoegd aan de locale dictionaries.

## Measurement Tiles: safe initial render for the Logic picker

The Measurement Tiles page renders before its settings request has completed. During that initial render, the tile collection is empty and there is no selected tile yet. Any derived value that reads the selected tile's source must therefore guard both the selected tile and its source (for example, use optional chaining before checking the source type). Do not assume that a selected tile exists until configuration loading has completed. This prevents the page from crashing during initial load and leaving the settings view blank.

## Quick Actions device picker: Variant B (16 November 2026)

The device picker in the Quick Actions editor uses Variant B: a searchable picker with a search field, selected-option state, empty-results message and result-count footer. Its trigger, search row, result list, options, empty state and footer must use the canonical shared classes: `.settings-searchable-trigger`, `.settings-searchable-search`, `.settings-searchable-results`, `.settings-searchable-option`, `.settings-searchable-empty` and `.settings-searchable-footer`. The wrapper and popup use `.settings-searchable-picker` and `.settings-searchable-menu`. Keep `.settings-interactive` on actual interactive controls. Page-specific classes may remain for content styling but must not replace these shared structural classes.

## Weather source pickers: shared searchable classes completed (16 November 2026)

All nine Weather source pickers use the canonical shared searchable-picker structure. The scrollable result container uses `.settings-searchable-results`; both device and Logic-variable options use `.settings-searchable-option`; and both empty-result states use `.settings-searchable-empty`. The existing grouped headings, source-specific labels and offline status remain page-specific semantic content. A result-count footer is intentionally not shown: the two result groups are already explicitly labelled. The wrapper, trigger, menu, search row and interactive controls retain their shared classes.


### Zichtbaarheid van Annuleren bij niet-opgeslagen wijzigingen

De actie **Annuleren** is op instellingenpagina's alleen zichtbaar zolang het formulier niet-opgeslagen wijzigingen bevat ten opzichte van de laatst opgeslagen configuratie. Zonder wijzigingen wordt Annuleren verborgen; toon dus niet standaard een uitgeschakelde Annuleren-knop. Zodra de gebruiker een wijziging aanbrengt, verschijnt de knop. Annuleren herstelt de laatst opgeslagen waarden en laat de knop daarna weer verdwijnen. Als de gebruiker wijzigingen handmatig terugzet naar exact de laatst opgeslagen waarden, geldt het formulier opnieuw als ongewijzigd en wordt Annuleren verborgen. Deze regel geldt voor alle instellingenpagina's met een Opslaan/Annuleren-actievoet. De zichtbaarheid moet worden afgeleid van dezelfde dirty-state die bepaalt of Opslaan beschikbaar is; pagina's mogen hierin niet onderling afwijken.


### Onder- en scrollruimte op instellingenpagina's

Het scrollgebied van Instellingen moet onderaan voldoende vrije ruimte behouden, zodat de vaste Opslaan-/Annuleren-acties niet tegen de onderrand van het browservenster staan. Gebruik minimaal 44px onderpadding op `.settings-content`. Pagina's die de gedeelde `.quick-settings-page` gebruiken behouden daarnaast 24px interne onderpadding. De verticale ruimte hoort bij het scrollbare document: alle inhoud moet bereikbaar blijven en de laatste kaart (zoals de Quick Action-editor) moet met de volledige onderrand zichtbaar zijn vóór de actievoet. Verklein deze ruimte niet om de pagina kunstmatig passend te maken op lage schermen; laat het contentgebied scrollen.


### Actievoet los van de viewport-onderrand houden

De onderpadding van het scrollgebied alleen is niet voldoende wanneer de pagina-inhoud met `margin-top:auto` de actievoet naar de onderkant van de beschikbare flexruimte duwt. Daarom heeft de gedeelde `.settings-bottom` zelf ook `margin-bottom:20px` en `flex:0 0 auto`. Zo blijven Opslaan-/Annuleren-knoppen zichtbaar met een vaste vrije afstand tot de onderrand, terwijl de volledige pagina blijft scrollen. De ruimte mag niet worden vervangen door positionering die de actievoet over de inhoud heen legt.


### Actievoet verankeren aan de onderzijde van het scrollgebied

De gedeelde `.settings-bottom` gebruikt `position: sticky` met `bottom: 20px` en een eigen ondermarge van 20px. Hierdoor blijft de actievoet op desktop/tablet minimaal 20px vrij van de onderrand van het zichtbare scrollgebied, ook wanneer de pagina-inhoud langer is dan de viewport. De actievoet blijft in de normale documentstroom en reserveert dus zijn eigen ruimte; de editor-kaart wordt niet absoluut gepositioneerd en blijft volledig scrollbaar. Op mobiele layouts (maximaal 700px), waar de instellingen-shell zelf weer in de documentstroom staat, wordt sticky uitgeschakeld.


## Standaard dropdownvarianten

Gebruik voor dropdowns in Instellingen één van de drie onderstaande standaardvarianten. Kies de variant op basis van de aard en omvang van de keuzelijst; maak geen zoekveld verplicht voor kleine, vaste keuzelijsten.

### Variant A – Eenvoudige dropdown

- Voor een kleine, vaste keuzelijst met een beperkt aantal opties.
- Geen zoekveld en geen gegroepeerde resultaten.
- Behoudt het compacte dropdownpatroon met een duidelijke geselecteerde waarde en consistente settings-control-styling.
- Voorbeelden: aantal meetwaardetegels (2, 4 of 6), datumformaat en tijdnotatie.

### Variant B – Zoekbare dropdown

- Voor een grotere, hoofdzakelijk vlakke keuzelijst waarin zoeken de keuze versnelt.
- Bevat een zoekveld, een scrollbaar resultatengebied, een duidelijke geselecteerde optie en een lege-resultatenmelding.
- Gebruik de gedeelde structuurklassen `.settings-searchable-picker`, `.settings-searchable-trigger`, `.settings-searchable-menu`, `.settings-searchable-search`, `.settings-searchable-results`, `.settings-searchable-option` en `.settings-searchable-empty`. Voeg een footer/resultatenteller toe wanneer die inhoudelijk nuttig is.
- Voorbeelden: Homey-apparaten, Homey Logic-variabelen en Homey Flows.

### Variant C – Gegroepeerde zoekbare dropdown

- Voor grotere keuzelijsten waarvan de opties betekenisvolle categorieën of groepen hebben.
- Bevat dezelfde zoek- en selectiefuncties als Variant B, aangevuld met herkenbare groepskoppen en waar relevant contextuele status- of informatielabels.
- Groepskoppen en statuslabels zijn semantische inhoud; de gedeelde picker-klassen blijven verantwoordelijk voor de algemene menu-, zoek-, resultaten- en optie-opmaak.
- Een footer/resultatenteller is optioneel en wordt alleen getoond als die de gebruiker helpt.
- Voorbeeld: de Weather-bronkeuze met afzonderlijke groepen voor apparaten en Logic-variabelen.

### Variantkeuze en consistentie

Gebruik de variant die het eenvoudigste en duidelijkste keuzepatroon oplevert. Houd de bestaande selectie-, validatie-, opslag- en toegankelijkheidslogica intact bij omzetting. Page-specifieke klassen mogen inhoud en semantiek aanvullen, maar mogen de gedeelde geometrie en interactiestaten van de gekozen standaard niet opnieuw definiëren. Een native `select` met alleen `settings-interactive` is nog niet automatisch een volledig gestandaardiseerde Variant A; controleer ook de afgesproken visuele styling.

### Huidige toepassing

- Variant A: aantal meetwaardetegels is de aangewezen variant; de huidige keuzelijst bevat 2, 4 en 6.
- Variant B: apparaat-, Logic-variabele- en Flow-keuzes met een vlakke resultatenlijst.
- Variant C: Weather-bronkeuzes met gegroepeerde apparaat- en Logic-resultaten.


### Variant A toegepast: aantal meetwaardetegels

De keuzelijst voor het aantal meetwaardetegels is de referentie-implementatie van Variant A. De kleine vaste optieset (2, 4, 6) gebruikt een custom eenvoudige dropdown zonder zoekveld. De popup en opties gebruiken settings-menu/control-tokens en gedeelde interactieve feedback. De dropdown sluit na selectie, bij klikken buiten de picker en met Escape. De bestaande count-update en selectie-/editorlogica blijft behouden.


### Meetwaardetegels-preview bij zes tegels

De previewkaart groeit mee met het aantal zichtbare tegels. Bij zes tegels blijft de preview een raster van twee kolommen en drie rijen; de kaart krijgt automatische hoogte zodat de derde rij binnen de kaart valt en de volledige onderrand zichtbaar blijft. Behoud de bestaande tegelafmetingen en inhoud; los ruimtegebrek niet op door tegels af te knijpen of te laten overlappen.


### Meetwaardetegels: volledige preview en niet-overlappende actievoet

Bij zes meetwaardetegels moet de previewkaart volledig meegroeien met de drie rijen van het previewraster. De twee kaarten in `.measurement-workspace` moeten in dezelfde gridrij op gelijke hoogte uitrekken; gebruik hiervoor stretch-uitlijning en laat de gridrij de hoogte van de volledige preview bepalen. De infobalk onder de tegelkeuze blijft binnen de linker kaart. De editor wordt als volgende gridrij/documentsectie geplaatst en mag de preview niet overlappen.

De gedeelde instellingenactievoet `.settings-bottom` blijft in de normale documentstroom (niet sticky). Een sticky actievoet kan tijdens het scrollen over lange editors heen schuiven en statusmeldingen of editorvelden bedekken. De actievoet volgt daarom na de volledige inhoud; bij korte pagina's mag `margin-top:auto` hem naar beneden duwen, maar nooit over inhoud heen.


### Meetwaardetegel-editor in dezelfde responsive grid

De bewerkkaart is een directe grid-child van `.measurement-workspace`, na de lijst- en previewkaart. Op brede schermen beslaat de editor beide kolommen als derde rij; in de gestapelde layout beslaat hij de enkele kolom als volgende rij. Plaats deze editor niet buiten de workspace en gebruik geen absolute/fixed positionering. Hierdoor blijven de twee bovenste kaarten hun natuurlijke inhoudshoogte behouden en kan het openen van de editor geen overlap of inkrimping van de preview veroorzaken.


## Meetwaardetegels – zelfstandige pagina-layout

De Meetwaardetegels-instellingen gebruiken een eigen `.measurement-settings-page` en `.measurement-layout`; hergebruik van de Quick Actions workspace-grid is bewust vermeden. De bovenste configuratie- en previewkaart verdelen de volledige beschikbare contentbreedte in twee gelijke kolommen. Bij maximaal 900px stapelen ze in één kolom. De editor is een normale derde gridrij over de volle breedte en mag geen vaste/absolute positie gebruiken.

De preview gebruikt dezelfde `.temperature-grid`, `.temperature-tile` en `measurement-count-2/4/6`-klassen als het dashboard. Daarmee blijven de tegelverhoudingen, typografie en afmetingen gelijk aan de dashboardtegels. Het raster blijft twee kolommen breed en krijgt één, twee of drie rijen op basis van het gekozen aantal. Laat de previewkaart meegroeien; knip de derde rij nooit af. Bewaar alle bestaande Homey-, Logic-, selectie-, validatie-, opslag- en i18n-logica bij layoutwijzigingen.


## Shared dashboard tooltips

The standard tooltip for the application is the reusable `AppTooltip` component in `src/client/main.tsx`, styled by the `.app-tooltip-trigger` rules in `src/client/style.css`. Use it for non-Blockly UI tooltips instead of the browser-native `title` attribute.

The shared tooltip contract is:

- Desktop mouse: show after a 500 ms hover-intent delay. Hide immediately when the pointer leaves.
- Keyboard: show immediately when the trigger receives visible keyboard focus.
- Touch: tap toggles the tooltip immediately; tapping the same trigger again or tapping elsewhere closes it.
- Accessibility: the trigger exposes the tooltip text as its accessible label when no explicit label exists.
- Settings tooltips use semantic `--settings-tooltip-*` CSS custom properties and follow the settings visual language.
- Dashboard tooltips use `theme="dashboard"` and semantic `--dashboard-tooltip-*` tokens, which derive from the active dashboard surface, border, text and shadow tokens. When dashboard themes are implemented, they must override these dashboard tooltip tokens as part of the selected dashboard theme; settings styling must not leak into dashboard tooltips.
- The hover delay is deliberately bypassed for keyboard focus and touch interaction.
- User-facing tooltip content must come from the localization system or user-provided content. Do not hard-code translatable text in the component.

**Blockly is the explicit exception.** Keep Blockly's own `setTooltip(...)` behavior and workspace styling; do not wrap Blockly blocks or fields in `AppTooltip`.

When adding a tooltip, wrap the actual trigger element in `AppTooltip` and pass the localized or meaningful label as `content`. The component clones the trigger to add focus, touch and accessible description behavior. Do not add a competing native `title` attribute.

### Current application coverage

The shared tooltip is used for:

- Weather icon preview samples (localized weather-category names).
- Dashboard clock card (long-press settings hint; dashboard theme).
- Transient notification dismiss action (dashboard theme).
- Active notification severity indicator (dashboard theme).
- Quick Action icon picker choices.
- Settings navigation items when the sidebar is collapsed.

Blockly tooltips remain separate by design. Keep this list current when adding or removing tooltip use cases.


### Tooltip placement and exceptions

The shared `AppTooltip` supports an explicit `placement` of `top` (default) or `bottom`. Prefer `bottom` for dashboard controls near the top edge so the tooltip remains inside the visible dashboard. In scrollable icon grids, place first-row tooltips below their trigger because the scroll viewport clips content above its top edge. Flow selection controls and Flow result rows intentionally have no tooltip because their names are already displayed.


### Tooltip delay and dashboard theme contract

The application-wide desktop hover delay is **500 ms**. Keep this value consistent for all `AppTooltip` instances; do not add per-control delays without a documented UX reason. Keyboard focus and touch activation remain immediate, and tooltips close immediately when the pointer leaves.

Dashboard surfaces must pass `theme="dashboard"` to `AppTooltip`. This selects the `--dashboard-tooltip-*` semantic tokens, currently derived from the dashboard's surface-card, border, text and shadow tokens. Future dashboard themes must supply/override those semantic tokens so tooltips visually follow the selected dashboard theme. Settings tooltips continue to use the separate `--settings-tooltip-*` tokens.

Dashboard Quick Action cards intentionally have no tooltip because their labels are already visible on the cards.


Weather icon preview implementation note: keep `AppTooltip` on the outer `.weather-pack-preview-tooltip` wrapper, never directly on `.weather-pack-preview-item`. The inner tile uses `overflow:hidden` to clip icon artwork and would also clip tooltip pseudo-elements. The outer wrapper stays overflow-visible, receives the hover/focus stacking order, and uses bottom placement so the tooltip remains within the preview panel. Preserve this wrapper structure when changing the preview grid.
