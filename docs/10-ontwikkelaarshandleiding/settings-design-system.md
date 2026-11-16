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
