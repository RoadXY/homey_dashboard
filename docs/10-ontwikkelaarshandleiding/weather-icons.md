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

The global `animateIcons` preference controls animation for every pack. Reduced-motion preferences must be respected.

## Important implementation rule

Do not replace or refactor the legacy `WeatherIcon` standard branch when improving alternate packs. Add or change alternate artwork in `WeatherIconArtwork` and scope related CSS to `.weather-pack-color3d`, `.weather-pack-outline`, and `.weather-pack-flat`. Avoid generic selectors that can change the standard pack.

## Regression and correction — 17 November 2026

An earlier implementation incorrectly replaced the shared legacy renderer with a new common SVG. This changed the custom standard icon illustrations and animations. That was not intended.

The correction restores the exact original `WeatherIcon` implementation and its original weather CSS from commit `cbab44331bd39124dcf05c515cd62b843fff2239`. The new artwork is isolated in `WeatherIconArtwork` and is only selected for the three alternate packs. The CSS for the alternate artwork is scoped so it cannot change the standard icon appearance or animation.

The standard pack label is **Standaard** in Dutch and **Standard** in English; animation remains a separate toggle.
