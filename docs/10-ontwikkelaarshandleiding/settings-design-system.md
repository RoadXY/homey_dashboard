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
| General | Dashboard identity name, language/date/time/timeout controls, Homey connection, Weather API token name/creation/actions, status and save controls |
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


## Homey-verbinding in Algemene instellingen

De kaart **Homey-verbinding** maakt deel uit van de pagina Algemene instellingen en volgt de bestaande instellingenactievoet en het bestaande Settings Design System.

### Gedrag en interactie

- De kaart bevat een Homey-IP-adres, een API-tokenveld, een mDNS-zoekactie voor `_homey._tcp`, een testactie en instructies om een Homey API-token aan te maken.
- Als nog geen Homey-configuratie is opgeslagen, start de applicatie automatisch mDNS-discovery.
- De gebruiker kan een gevonden Homey selecteren; de selectie vult het IP-adresveld, maar wordt pas actief na Opslaan.
- IP-adres en API-token worden samen met de overige algemene instellingen via dezelfde Opslaan-/Annuleren-actie beheerd.
- Testen gebruikt de actuele invoervelden, verandert geen opgeslagen configuratie en toont een statusbadge met de bestaande semantische kleuren: groen **Succesvol**, geel **Warning** of rood **Failed**.
- **Warning** betekent dat het IP-adres/netwerkendpoint bereikbaar is, maar de API-token-authenticatie niet slaagt. **Failed** betekent dat het IP-adres/endpoint niet bereikbaar is of dat de verbinding anderszins niet tot stand komt.
- De kaart mag bij het opnieuw openen van Algemene instellingen standaard inklappen als de laatst opgeslagen verbinding succesvol is. Een expliciete handmatige keuze van de gebruiker heeft daarna voorrang: wanneer de gebruiker de kaart opent, blijft deze open totdat de gebruiker haar zelf sluit. Een mislukte of onvolledige verbinding laat de kaart standaard open.
- De algemene statusmelding “Niet opgeslagen wijzigingen” wordt niet getoond. De bestaande Opslaan- en Annuleren-knoppen blijven staan.

### Persistente configuratie en geheimen

- `HOMEY_ADDRESS` en `HOMEY_API_KEY` zijn geen configuratiebron meer en worden genegeerd.
- Homey-adres en API-token worden als eigen persistente configuratie opgeslagen onder de bestaande data-directory. Het bestand en het token moeten alleen leesbaar zijn voor de applicatiegebruiker (mode `0600`).
- Het API-token is een geheim: geef het nooit terug in API-responses, logs, foutmeldingen of client-side statusobjecten. De instellingen-API retourneert hoogstens een boolean die aangeeft of een token is geconfigureerd.
- Een leeg tokenveld bij het wijzigen van andere instellingen mag een reeds opgeslagen token niet wissen. Het token wordt alleen vervangen wanneer de gebruiker een nieuw token invult; een expliciete verwijderactie moet apart worden aangeboden indien verwijderen later gewenst is.
- De verbindings-test valideert eerst netwerkbereikbaarheid en daarna API-authenticatie, zodat een bereikbaar IP-adres met een onjuist token als Warning kan worden weergegeven.

### mDNS-discovery

- Gebruik DNS-SD service type `_homey._tcp.local` voor lokale discovery.
- Toon gevonden apparaten als selecteerbare resultaten met ten minste apparaatnaam en IPv4-adres. Toon geen verzonnen resultaten; een lege lijst krijgt een duidelijke lege-status.
- Discovery is een expliciete actie na de eerste automatische zoekactie; een zoekactie mag geen reeds ingevoerd adres overschrijven totdat de gebruiker een resultaat selecteert.
- Houd rekening met meerdere Homey-apparaten op hetzelfde netwerk en met discovery-timeouts.

### Lokalisatie en validatie

Alle zichtbare teksten, foutmeldingen, statussen, lege resultaten en instructies zijn beschikbaar in Nederlands en Engels via de bestaande i18n-bestanden. Gebruik bestaande semantische statuskleuren en gedeelde settings-control/button-klassen; introduceer geen afwijkend kleur- of interactiesysteem.


### Implementatiestatus Homey-verbinding (19 november 2026)

De eerste implementatie staat op `phase_1_foundation`:

- De Homey-configuratie staat los van de algemene voorkeuren in `data/homey-connection.json`. Het token wordt niet via de instellingen-API teruggestuurd; de GET-response bevat alleen `address` en `tokenConfigured`.
- Opslaan bewaart het bestaande token wanneer het tokenveld leeg blijft. De configuratie wordt met bestandsmodus `0600` geschreven en de rechten worden ook bij vervolgwrites afgedwongen.
- De nieuwe instellingenroutes zijn beschermd met de bestaande instellingen-sessie: GET/POST `/api/settings/homey-connection`, POST `/api/settings/homey-connection/test` en POST `/api/settings/homey-connection/discover`.
- De test controleert eerst TCP-bereikbaarheid (HTTP standaardpoort 80, HTTPS 443 of een expliciet opgegeven poort) en probeert daarna via `homey-api` apparaten op te halen. Dit levert Success, Warning of Failed op zonder token of ruwe API-fout aan de browser te geven.
- De General Settings-kaart ondersteunt adres/tokeninvoer, test, discovery-resultaten en automatische discovery wanneer nog geen adres is opgeslagen. Het openen van de kaart wordt niet door een succesvolle test teruggedraaid.
- `src/server/homey.ts` leest de opgeslagen configuratie; de oude `HOMEY_ADDRESS`- en `HOMEY_API_KEY`-omgevingsvariabelen worden niet meer gebruikt.

**Validatie / aandachtspunt:** de discovery-helper vraagt DNS-SRV-records op voor `_homey._tcp.local` via de DNS-resolver van het Ubuntu-systeem. Dit is afhankelijk van de lokale resolver en is nog niet bewezen als multicast mDNS-discovery op ieder netwerk. Controleer dit op de doelserver; als de resolver geen mDNS doorgeeft, moet de discovery worden vervangen door expliciete UDP-multicast DNS-SD. De repositorywijzigingen zijn nog niet lokaal gebouwd of door CI gevalideerd; beschouw de feature daarom als geïmplementeerd-in-afwachting-van-validatie.


## Homey mDNS-SD discovery implementation (20 November 2026)

Homey discovery now sends a DNS-SD PTR query for `_homey._tcp.local` directly over IPv4 multicast DNS (UDP port 5353, multicast address `224.0.0.251`). The response parser collects PTR, SRV and A records and maps discovered service instances to IPv4 addresses. This replaces the earlier DNS-resolver `resolveSrv()` lookup; it no longer depends on the Ubuntu unicast DNS resolver forwarding `.local` queries.

The default production Compose file uses host networking so the process can join the host's mDNS multicast network. The advanced bridge Compose file is supported for dashboard/API use, but mDNS multicast discovery is not guaranteed to cross Docker bridge networks. A user choosing bridge mode should configure the Homey address manually if discovery does not work.

The discovery implementation has a bounded three-second scan and returns only instances for which PTR, SRV and IPv4 A records were received. Live discovery against the target Homey and Ubuntu host remains a required deployment verification; a green CI build alone does not prove multicast reception.


### Homey-discovery: voortgang en herkenbare resultaten (20 november 2026)

- Tijdens automatische en handmatige mDNS-discovery gebruikt de interface dezelfde gele status-tag **Zoeken… / Searching…**. De tag heeft een statusrol en een subtiel pulserend indicatiepunt.
- Na een scan worden gevonden apparaten onder een expliciete kop weergegeven. Elke selecteerbare resultaatregel toont de servicenaam duidelijk als primaire tekst, het IP-adres met een herkenbaar label en een expliciete actie **Selecteren / Select**.
- De scanindicator verdwijnt zodra de discovery-aanroep is afgerond; bij nul resultaten verschijnt daarna de bestaande lege-status.
- Alle nieuwe zichtbare teksten zijn opgenomen in zowel de Nederlandse als Engelse locale.


### Homey API-adresnormalisatie (20 november 2026)

De discovery-service levert Homey-adressen als kale IPv4-adressen. Voor `HomeyAPI.createLocalAPI()` normaliseren zowel de verbindingstest als de centrale Homey-client een adres zonder schema naar `http://<adres>`. Een expliciet `http://`- of `https://`-schema blijft behouden. Hiermee gebruiken de test en de daadwerkelijke Homey-verbinding dezelfde URL-vorm.


### Settings-navigatie bij ontbrekende Homey-verbinding (20 november 2026)

Wanneer `status.homey.state` niet `online` is, blijft alleen **Algemeen** beschikbaar in het instellingenmenu. Quick actions, Meldingen, Meetwaardetegels en Weer worden disabled weergegeven, krijgen een sloticoon en tonen bij aanwijzen de toelichting dat Homey verbonden moet zijn. De knoppen zijn ook via toetsenbord als disabled herkenbaar. Zodra de Homey-status online is, worden de navigatie-items weer actief.


### Homey-discoveryresultaten als afzonderlijke kaart (20 november 2026)

Gevonden Homey-apparaten worden niet langer als losse lijst onder de knoppen getoond. De resultaten staan in een visueel zelfstandige kaart met de duidelijke kop **Gevonden Homey's / Discovered Homeys**. De individuele Homey-resultaten blijven selecteerbare regels met apparaatnaam, IP-adres en de actie Selecteren. De kaart wordt alleen getoond wanneer er resultaten zijn; de lege status blijft een gewone beschrijving.


### Verbindingsstatus direct na opslaan bijwerken (20 november 2026)

De `POST /api/settings/homey-connection`-response bevat naast de publieke configuratie ook het resultaat van `connectHomey()`. De General Settings-pagina verwerkt dit resultaat direct in de lokale `SystemStatus`-state. Hierdoor wordt de statuskaart onmiddellijk bijgewerkt na Save, zonder herladen. Bij een niet-online resultaat blijft de configuratie opgeslagen, maar toont de pagina expliciet dat de daadwerkelijke verbinding is mislukt; de serverstatus wordt niet als succesvol voorgesteld.


### Systeemstatus bovenaan Algemene instellingen (20 november 2026)

De volledige kaart **Systeemstatus** staat direct onder de paginabeschrijving bovenaan de pagina Algemene instellingen. Zo is de Homey-verbindingsstatus, dashboardservice en systeemgezondheid meteen zichtbaar zonder naar het einde van de pagina te scrollen. De kaart behoudt de bestaande statusindicatoren en vertalingen.


### Homey-verbinding: invoervelden en configuratiestatus (21 november 2026)

De Homey IP-adres- en API-tokenvelden gebruiken dezelfde hoogte, padding, rand, afronding, achtergrond, tekstkleur en typografie als de invoer voor Weather API-tokens (`.token-create-row > input`). De Homey-status gebruikt de gele semantische waarschuwingskleuren (`--settings-warning-background`, `--settings-warning-border`, `--settings-warning-text`) wanneer het adres ontbreekt of geen API-token is geconfigureerd. De status toont dan **Niet (volledig) geconfigureerd / Not (fully) configured**. Een volledig geconfigureerde maar niet verbonden Homey behoudt de bestaande rode foutstatus; een online Homey blijft groen.


### Homey REST-status gescheiden van realtime-subscriptions (21 november 2026)

De Homey-systeemstatus wordt bepaald door de basisverbinding via `HomeyAPI.createLocalAPI()` en succesvolle REST/API-opvragingen van apparaten en zones. Het initialiseren van WebSocket/realtime-subscriptions is aanvullend en mag een werkende API-verbinding niet naar `offline` terugzetten. Een fout bij de initiële subscription-setup wordt gelogd als waarschuwing; de verbinding blijft `online`. De realtime-watchdog probeert ontbrekende subscriptions periodiek opnieuw. Ook een mislukte retry verandert de basisstatus niet. Zo komt de groene verbindingstest overeen met de systeemstatus wanneer de REST API bereikbaar is, ook als realtime-events tijdelijk niet beschikbaar zijn.


### Systeemstatus opnieuw ophalen na Homey-configuratie opslaan (22 november 2026)

Na `POST /api/settings/homey-connection` haalt de General Settings-client de volledige actuele snapshot opnieuw op via `GET /api/system/status`. De response wordt rechtstreeks in de statusstate gezet, ook als de initiële state nog `null` was. Dit voorkomt dat een succesvolle serververbinding niet zichtbaar wordt doordat een conditionele state-update geen waarde kon instellen, en voorkomt dat de oude pre-save snapshot blijft staan. De Homey-status en succes-/foutmelding worden afgeleid van deze actuele snapshot (met de connectieresponse als fallback wanneer de status-endpoint tijdelijk niet beschikbaar is).


### Homey-IP-wijziging en herverbinden na discovery (22 november 2026)

De flow voor een gewijzigd Homey-IP-adres is als volgt gecontroleerd en aangescherpt:

1. Discovery retourneert gevonden Homey-instanties met naam en IP-adres. Selecteren vult alleen het adresveld; de opgeslagen configuratie verandert pas bij Save.
2. Het selecteren of handmatig wijzigen van het adres wist het eerdere testresultaat. De gebruiker moet testen met het actuele adres.
3. De test gebruikt het ingevoerde adres en de nieuw ingevoerde token, of bij een leeg token de veilig opgeslagen token. Een succesvolle test vereist nu zowel het ophalen van apparaten als zones, gelijk aan de basiscontrole van de daadwerkelijke verbinding.
4. Save schrijft eerst het nieuwe adres en behoudt een bestaande token als er geen nieuwe token is ingevoerd.
5. De save-route voert daarna `reconnectHomey()` uit. Deze wacht een eventueel nog lopende startup/watchdog-verbinding af en start vervolgens een verse verbinding op basis van de zojuist opgeslagen configuratie. Daardoor kan een oudere poging met het vorige IP-adres niet als resultaat van Save worden teruggegeven.
6. De response bevat het resultaat van die verse poging; de frontend haalt daarna `/api/system/status` opnieuw op en toont die actuele status.

De discovery- en testacties wijzigen de opgeslagen configuratie of de actuele live-verbinding niet. Alleen Save past de configuratie toe. De API-token wordt nooit teruggestuurd naar de browser.


## Dashboard identity in General settings

The **Dashboard-identiteit** card is part of General settings and uses the existing `.settings-card`, `.setting-row`, `.setting-description` and `.settings-interactive settings-interactive--text` primitives. The installation name is an ordinary general preference: it participates in the shared Save/Cancel and dirty-state behavior, is localized in Dutch and English, and is validated by the backend before persistence. Do not add a separate save action or expose the name as a Docker environment variable.

When the name is saved, the backend updates the persisted installation identity and restarts the mDNS advertisement. The installation UUID and DNS-SD collision-resistant suffix remain unchanged. Keep the field visually consistent with the other General settings inputs; do not introduce a one-off visual style.
