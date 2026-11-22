# Weather icon rendering

## Rendering architecture

The original **Standaard** weather icon pack is the legacy custom SVG implementation in `WeatherIcon` in `src/client/main.tsx`. Its original SVG geometry, CSS sizing, and category-specific animation rules must be preserved. It is the established visual identity of the dashboard.

The three alternate packs use the separate `WeatherIconArtwork` renderer. This renderer must only be used when `pack !== "animated"`. Its CSS must be scoped to the alternate pack classes and must not override the standard renderer's selectors, SVG geometry, animation timings, or colors.

The settings preview and dashboard both use `WeatherIcon`; only the preview supplies a fixed category matrix while the dashboard supplies the live weather category. The selected pack and global animation setting remain shared.

## Supported categories in the preview

- `sunny`, `mostly_sunny`, `partly_cloudy`
- `cloudy`, `overcast`, `fog`, `windy`
- `drizzle`, `rain`, `heavy_rain`, `showers`
- `thunderstorm`, `hail`, `snow`, `snow_showers`, `sleet`
- `unknown` as the explicit fallback

## Icon pack contracts

| Pack ID | Dutch / English name | Contract |
|---|---|---|
| `animated` | Standaard / Standard | Preserve the existing custom SVG icons and their bespoke, category-specific animations exactly |
| `color3d` | Kleurrijk (3D) / Colourful (3D) | Independent artwork with gradients, highlights, shading and depth |
| `outline` | Minimalistisch (lijn) / Minimal (line) | Independent artwork with consistent clean line work |
| `flat` | Plat (modern) / Flat (modern) | Independent artwork with clear solid shapes and bright colours |

The global `animateIcons` preference controls animation for every pack. The explicit in-app switch is authoritative: when enabled, OS-level `prefers-reduced-motion` must not silently suppress the requested icon motion. When disabled, the renderer emits `is-static` and no pack animation selectors apply.

## Important implementation rule

Do not replace or refactor the legacy `WeatherIcon` standard branch when improving alternate packs. Add or change alternate artwork in `WeatherIconArtwork` and scope related CSS to `.weather-pack-color3d`, `.weather-pack-outline`, and `.weather-pack-flat`. Avoid generic selectors that can change the standard pack.

## Regression and correction — 17 November 2026

An earlier implementation incorrectly replaced the shared legacy renderer with a new common SVG. This changed the custom standard icon illustrations and animations. That was not intended.

The correction restores the exact original `WeatherIcon` implementation and its original weather CSS from commit `cbab44331bd39124dcf05c515cd62b843fff2239`. The new artwork is isolated in `WeatherIconArtwork` and is only selected for the three alternate packs. The CSS for the alternate artwork is scoped so it cannot change the standard icon appearance or animation.

The standard pack label is **Standaard** in Dutch and **Standard** in English; animation remains a separate toggle.


## Approved Standard pack refinement — 17 November 2026

The user approved a refinement of the first pack (**Standaard / Standard**) only. Its established palette, line weight and overall visual identity must remain unchanged. The three alternate packs (`color3d`, `outline`, `flat`) must not be affected.

The standard pack now distinguishes the following weather conditions:

- `cloudy`: one clear cloud silhouette.
- `overcast`: two overlapping cloud layers to communicate a fully covered sky.
- `fog`: four separate mist lines drift independently with very small horizontal offsets; the whole group must not move as one.
- `drizzle`: four short, fine droplets with the slowest fall.
- `rain`: three medium-length droplets with a gentle staggered fall.
- `heavy_rain`: five longer droplets with a slightly quicker fall.
- `showers`: sun behind the cloud and a short, intermittent rain burst.
- `snow`: three individually drifting snowflakes.
- `snow_showers`: sun behind the cloud with individually drifting snowflakes.
- `sleet`: a mixed precipitation symbol with one snowflake and two rain streaks.

All new artwork and animation selectors are scoped to `.weather-pack-animated`. Do not move these rules to generic `.weather-symbol` selectors: the alternate icon packs share category class names but must retain their own appearance and motion. Existing color values for the Standard pack are unchanged.

The global `animateIcons` setting still disables these animations, and the existing `prefers-reduced-motion` rule must continue to disable motion. Keep movement restrained: animate only the relevant precipitation/mist details, never the complete icon.


## Colourful 3D pack implementation — 18 November 2026

The user approved the Colourful (3D) mockup and requested implementation of this pack only. The implementation lives in `WeatherIconArtwork` and `.weather-pack-color3d` styles. Do not change the legacy Standard (`animated`) artwork or the `outline` / `flat` packs as part of this work.

The 3D pack uses per-instance SVG gradient/filter IDs generated with React `useId`, glossy multi-stop materials, highlights, shaded cloud layers, dimensional precipitation, and soft drop shadows. Preserve unique IDs if adding new SVG definitions; do not introduce shared hard-coded gradient IDs in the rendered SVG.

The global `animateIcons` preference selects the same 3D artwork in either state: `is-static` must remain visually identical but without motion, while `is-animated` adds restrained detail-level movement. Animation is limited to the relevant parts (sun glow, cloud drift, rain drops, fog bands, snowflakes, hailstones, lightning and wind ribbons); never move the entire icon. Respect `prefers-reduced-motion`.

Category artwork distinctions in the 3D pack:

- `sunny`: dimensional golden sun.
- `mostly_sunny` / `partly_cloudy`: sun partially behind a cloud; `mostly_sunny` includes a secondary cloud layer.
- `cloudy` / `overcast`: single cloud versus overlapping cloud layers.
- `fog`: independent soft mist bands.
- `drizzle`, `rain`, `heavy_rain`, `showers`: different droplet counts/sizes; showers includes sun and intermittent precipitation.
- `thunderstorm`: layered warm lightning bolts.
- `hail`: glossy ice spheres with highlights and restrained bouncing in animated mode.
- `snow`, `snow_showers`, `sleet`: dimensional snowflakes; snow showers includes sun; sleet mixes rain drops and snowflakes.
- `windy`: softly shaded flowing ribbons.

All 3D styling and animation selectors must remain scoped to `.weather-pack-color3d`. The alternate packs and Standard must not inherit these gradients, shadows, or animations. Static and animated states are both controlled by the existing `animateIcons` setting; do not add a separate persisted setting for this pack.


## Colourful 3D visual correction — 18 November 2026

A visual review of the deployed dashboard found that the selected Colourful (3D) pack looked too muted: cloud materials read as grey/outline artwork, and the preview and dashboard did not communicate the intended colourful, dimensional treatment strongly enough.

The first colour adjustment alone was insufficient. Follow-up inspection found a CSS specificity issue: the base `.weather-symbol` opacity rule was stronger than the single-class `.weather-pack-color3d` rule, so the intended full opacity was not actually applied. The correction now uses `.weather-symbol.weather-pack-color3d` to ensure full opacity and stronger saturation for this pack only. The artwork itself still needs a visual comparison against the approved mockup; do not treat this CSS correction as completion of the mockup implementation. The settings preview and live dashboard share the same `WeatherIcon` renderer.


## 3D sunny-cloud layering correction — 18 November 2026

The sunny/cloudy combination icons must render one opaque foreground cloud over the sun. The shared base selector `.weather-art .weather-cloud-front` applied `fill-opacity:.13`; because the 3D rules only set the inline gradient fill and stroke, the cloud remained translucent and allowed the sun to show through. The 3D-specific selector `.weather-pack-color3d .weather-art .weather-cloud-front` now explicitly sets `fill-opacity:1` (and the same for any rear cloud). The extra rear cloud previously drawn for `mostly_sunny` has been removed, leaving one foreground cloud. The sun remains behind the cloud in SVG paint order. Keep these overrides scoped to `color3d`; other icon packs retain their existing appearance.


## Explicit animation toggle and reduced-motion preference — 18 November 2026

A report showed that no 3D animations were visible in either the settings preview or dashboard while the in-app "Bewegende iconen" switch was enabled. Both render paths pass `settings.animateIcons` to `WeatherIcon`, which adds `is-animated` when true. The 3D CSS also defines per-element keyframe animations.

The 3D stylesheet previously included a `prefers-reduced-motion: reduce` rule that forcibly set every descendant animation to `none !important`. This could silently defeat the explicit in-app switch on systems/browsers configured to reduce motion. The rule has been removed for the 3D pack: the explicit dashboard switch now controls whether `is-animated` or `is-static` is applied. Other icon packs' existing reduced-motion behavior remains unchanged. Cloud drift has also been increased from 1.2px to 3px so the movement is easier to notice at preview and dashboard sizes.

Accessibility decision: the explicit in-app animation switch is treated as the user's direct choice for this feature. Users who prefer no motion can turn it off; do not silently override an enabled switch based on the OS preference.


## Weather icon system consolidation — 22 November 2026

The icon-pack contract is centralized in `src/shared/weather-icons.ts`. This module is the single source of truth for:

- the canonical weather category list used by the settings preview and client weather types;
- the ordered icon-pack registry, including each pack's translation keys;
- the default pack (`animated`, displayed as **Standaard** in Dutch and **Standard** in English);
- the default animation preference (enabled);
- runtime normalization of unknown pack values; and
- construction of renderer class names from category, pack and motion state.

Both the client settings preview and dashboard continue to use the same `WeatherIcon` component. That component normalizes the pack before dispatching to the preserved Standard renderer or the alternate artwork renderer. Do not create a second preview renderer or duplicate pack/category lists in the UI.

The backend weather-settings normalizer imports the same shared pack contract. Invalid or missing persisted pack IDs therefore fall back to the same Standard pack that the client uses. The saved `animateIcons` preference remains independent from the selected pack.

### Animation authority

The in-app **Bewegende iconen** setting is the sole authority for weather-icon motion. The renderer emits exactly one of `is-animated` or `is-static`; CSS animation selectors are only active for `is-animated`. A blanket `prefers-reduced-motion` rule previously applied `animation:none !important` to every weather SVG/span, which overrode the explicit in-app switch on devices configured for reduced motion. That blanket override has been removed. Do not reintroduce an OS-level rule that silently defeats an enabled in-app setting.

### Artwork and layout preservation

This consolidation changes configuration ownership and renderer class resolution only. The existing SVG artwork, icon geometry, category-specific animation definitions, pack colors, component dimensions, preview grid, dashboard layout and spacing are intentionally unchanged.

### Regression coverage

`src/shared/weather-icons.test.ts` verifies the canonical categories, ordered pack IDs, Standard fallback behavior, and the exact class contract for animated and static render states. Keep these tests in place when extending the pack registry.
