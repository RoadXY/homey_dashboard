# Settings UI design system

## Status and scope

The settings interface uses a shared semantic design-token layer and a shared interaction class. The implementation covers:

- General settings and the PIN gate
- Settings navigation, top bar and return action
- Quick Actions and its device, Flow and icon pickers
- Notifications, severity controls, notification pickers and the Blockly workspace
- Measurement tiles and their source/editor controls
- Weather sources, toggles, icon-pack choices and Weather API token controls

The current token values describe the existing dark appearance. The architecture is prepared for additional themes, but a theme switcher, persisted theme preference and a light theme are **not implemented**.

## Source of truth

- Styles and theme tokens: `src/client/style.css`
- Interactive element classes: `src/client/main.tsx`
- This document: implementation and extension contract

All settings theme values are defined as semantic CSS custom properties on `:root`. The `:root` values are the default theme. A future theme can override the same properties on a selector such as `:root[data-theme="light"]`, without rewriting individual component selectors.

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
| `--settings-radius-*`, `--settings-control-height*`, `--settings-card-padding`, `--settings-transition-*` | Shared component geometry and motion |

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

## Geometry and component variants

Use the existing geometry tokens for common shapes and dimensions. The interface intentionally retains compact and large variants where the context requires them (for example, a compact severity select and a larger searchable source picker). Do not force every control to one height when that would reduce usability or break the established layout.

## Intentional exceptions

A few colors are content semantics rather than theme chrome:

- The multicolor brand orb remains brand artwork.
- The weather icon pack retains recognizable sun, rain, snow, lightning and wind colors. These communicate weather conditions, not the settings theme.
- Notification severity colors remain in the dedicated severity token group.
- Dashboard-only components continue to use dashboard-wide tokens such as `--text-secondary` and `--text-muted`, rather than settings-only tokens.

These exceptions should remain explicit. New settings surfaces, controls and menu states should use the `--settings-*` token family.

## Adding a future theme

1. Add a theme selector to the application and apply its value to the document root, for example `data-theme="light"`.
2. Add a theme override block such as `:root[data-theme="light"]` in `src/client/style.css`.
3. Override the semantic `--settings-*` tokens and set `--ui-color-scheme: light`.
4. Check text, controls, dropdown menus, focus outlines, disabled states, selected states, error/warning/success feedback and Blockly surfaces for sufficient contrast.
5. Verify that weather-condition colors and notification severity colors remain semantically clear.
6. Test every settings page at desktop, tablet and phone widths, including keyboard and touch interaction.

Do not add theme-specific selectors to individual components. A theme should change the token values, not the component structure.

## Validation notes

The source audit verifies that the settings stylesheet has balanced braces, all referenced CSS custom properties are defined, all settings native selects use the shared interaction class, and the settings page controls use the shared class. Visual verification in the running Docker container remains a separate tablet/browser test. No light theme or theme-switching behavior is claimed by this implementation.
