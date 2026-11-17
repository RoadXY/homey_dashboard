# Weather icon rendering

## Current implementation

The settings preview and dashboard use the same `WeatherIcon` component in `src/client/main.tsx`. The dashboard passes the current live `WeatherConditionResponse.category` and the saved `iconPack`/`animateIcons` settings. The settings preview passes a fixed list of sample categories and the current local draft settings.

The preview sample categories are:
`sunny`, `mostly_sunny`, `cloudy`, `rain`, `thunderstorm`, `snow`, `fog` and `windy`.

The dashboard can receive every category declared in `WeatherCategory` and `WEATHER_CONDITIONS`, including categories that are not represented in the preview sample. Comparing different categories is not a valid visual parity test.

## Findings from 17 November 2026

1. The preview and dashboard do not have separate renderers; both call the same component.
2. The preview reflects unsaved settings-page draft state. The dashboard reads the persisted settings from `/api/dashboard/weather-values`. Save changes before comparing.
3. The `animated` pack renders the custom SVG weather artwork.
4. The `color3d` and `flat` packs currently render Unicode emoji symbols and apply CSS filters/animations. They are not distinct complete SVG icon sets.
5. The `outline` pack only has dedicated glyphs for sunny, cloudy, rain, snow, windy and unknown. Other categories fall back to the shared emoji symbol map. This makes the live dashboard look inconsistent whenever its current category is outside that limited mapping.
6. Consequently, the alternate-pack descriptions overstate the current implementation. CSS filters on emoji do not provide reliable, consistent 3D, flat or outline icon artwork across all weather categories and browser/platform font renderers.

## Agreed label change

The first pack is named **Standaard** in Dutch and **Standard** in English. Animation is configured separately by the global `animateIcons` switch; it is not part of the pack name.

## Required follow-up

A complete fix requires dedicated, consistent artwork for every supported weather category in each alternate pack, with a deliberate fallback policy for unknown categories. The preview should exercise the complete category set (or a representative matrix that includes every distinct rendering branch), and parity verification must compare the same saved pack and same category on both the settings page and dashboard.

Do not claim the icon-pack discrepancy is fully fixed until the alternate pack artwork and full category coverage have been implemented and visually verified. The current code change only corrects the pack label and records the investigation.
