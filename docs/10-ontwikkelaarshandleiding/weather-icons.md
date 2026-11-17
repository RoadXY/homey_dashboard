# Weather icon rendering

## Architecture and shared rendering

The settings preview and dashboard use the same `WeatherIcon` component in `src/client/main.tsx`. The dashboard passes the live `WeatherConditionResponse.category` and saved `iconPack`/`animateIcons` settings. The settings preview passes the same component a fixed, complete list of weather categories and the current settings-page draft.

All packs are rendered as inline SVG artwork. No pack uses emoji or platform-dependent weather glyphs. The pack changes the artwork's visual treatment through CSS; category geometry and precipitation semantics remain shared so the preview and dashboard cannot drift into separate icon implementations.

## Supported categories

The preview deliberately renders every supported category:

- `sunny`, `mostly_sunny`, `partly_cloudy`
- `cloudy`, `overcast`, `fog`, `windy`
- `drizzle`, `rain`, `heavy_rain`, `showers`
- `thunderstorm`, `hail`, `snow`, `snow_showers`, `sleet`
- `unknown` as the explicit fallback

Sleet intentionally combines rain and snow artwork. The unknown category has a dedicated question-mark symbol rather than falling back to a font glyph.

## Icon pack visual contracts

| Pack ID | Dutch / English name | Rendering |
|---|---|---|
| `animated` | Standaard / Standard | Restrained weather colours, custom SVG outlines and subtle category-specific motion |
| `color3d` | Kleurrijk (3D) / Colourful (3D) | Layered gradients, highlights, shaded clouds and depth shadows |
| `outline` | Minimalistisch (lijn) / Minimal (line) | Transparent interiors and consistent rounded line work |
| `flat` | Plat (modern) / Flat (modern) | Solid high-contrast shapes and a compact colour palette |

Animation remains controlled independently by the global `animateIcons` setting. Static mode and `prefers-reduced-motion` disable all icon animations.

## Implementation details

- The `WeatherIcon` component builds the SVG from semantic layers: sun, cloud, rain, snow, lightning, hail, fog, wind and unknown marker.
- The four pack styles are defined in `src/client/style.css` under the weather icon-pack section.
- The settings preview uses all supported categories, not only the original eight sample categories.
- Preview labels are localized in `src/client/locales/nl.json` and `src/client/locales/en.json`.
- The pack selection is persisted by the existing weather settings API. The dashboard uses the saved setting; unsaved preview changes are intentionally draft-only.

## Visual parity verification

When checking a live dashboard against the settings preview:

1. Save the selected pack and animation preference.
2. Compare the same weather category in both places. The preview shows the full category matrix, while the dashboard shows the current live category.
3. Verify the pack with animation enabled and disabled.
4. Verify all four packs against the full category matrix, including hail, sleet, overcast and unknown.
5. Check a narrow/mobile viewport and a desktop viewport.
6. Confirm reduced-motion behavior.

A different weather condition is not expected to produce the same silhouette; parity means that the same category and pack use the same shared SVG design language and category-specific layers.

## Change record — 17 November 2026

The initial investigation found that the old alternate packs used Unicode emoji plus CSS filters, and the outline pack only substituted a handful of categories. That implementation caused browser/font-dependent results and inconsistent fallback icons on the live dashboard.

The renderer has now been replaced with shared, category-aware SVG artwork. All four packs have dedicated visual styling, and the preview covers every supported category. The standard pack label was also simplified to **Standaard** / **Standard**, with animation remaining a separate setting.

The implementation has been committed directly to `phase_1_foundation`. Automated build/CI and browser-level visual verification must still be checked after the commits; do not describe the change as CI-verified until those checks are green.
