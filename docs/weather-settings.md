# Weather settings

The Weather settings page lets users configure nine independent Homey sources:
outdoor temperature, feels-like temperature, humidity, air pressure, wind speed,
wind direction, precipitation, sunrise and sunset. Each field can be disabled
by clearing its source. Device capabilities and Homey Logic variables are
searched from the same picker.

Numeric fields accept numeric Homey capabilities and numeric Logic variables.
Sunrise, sunset and wind direction also accept text sources. The dashboard only
reads the sources selected in this configuration; it does not call an external
weather service or infer a weather category from Homey app-specific values.

The weather condition and its optional text description continue to arrive
through the existing authenticated integration endpoint
`POST /api/v1/weather/conditions`. The supplied canonical condition selects
the icon. The icon pack is saved independently from dashboard theme settings.

Four icon pack choices are currently exposed: the existing animated SVG style,
a colourful emoji-based style, an outline-symbol style and a flat colourful
style. These alternate packs are an initial implementation and can later be
replaced by dedicated authored icon assets without changing the settings
contract.

Settings are stored persistently in `/app/data/weather-settings.json`.
The server endpoints are:
- `GET/POST /api/settings/weather` (PIN-session protected)
- `GET /api/settings/weather-sources` (PIN-session protected)
- `GET /api/dashboard/weather-values` (dashboard read endpoint)

The frontend reads translations exclusively through the locale dictionaries.
All weather settings UI keys are present in both `nl.json` and `en.json`.
The page uses semantic CSS tokens and shared settings surfaces so future
themes can override colours and surfaces without changing the component.

The API documentation is maintained in `docs/api/openapi.yaml` and mirrored
to `public/api-docs/openapi.yaml` for Swagger UI.

## Verification

GitHub Actions run 774 completed successfully: TypeScript checks, automated tests,
OpenAPI lint, frontend/backend build and production Docker image build all passed.
The Dutch and English locale files parse successfully and contain matching keys.


## Animated line icon pack

The weather icon selector uses accessible radio choices with a localized name
and short description. Selecting a pack updates a shared preview showing sunny,
partly cloudy, cloudy, rain, thunderstorm, snow, fog and wind conditions.

The additional `animated-line` pack uses custom inline SVG line artwork. Its
stroke follows the active theme accent token (`--nav-button-hover-border`),
rather than a hard-coded colour. Weather-specific motion is subtle and is
disabled when the visitor enables reduced motion in their operating system.
The same renderer is used in the dashboard weather display and settings preview.
