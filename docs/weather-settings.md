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

Four icon pack choices are exposed: the standard animated SVG style with
familiar weather colours, a colourful emoji-based style, an outline-symbol
style and a flat colourful style. The experimental animated-line variant was
removed from the selector; legacy saved values are normalized to the standard
animated pack.

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



## Search dropdown and weather icon preview refinements (14 November 2026)

- Searchable dropdown menus now open below their trigger instead of above it, using the shared quick-flow menu positioning.
- Search inputs use the intended dark picker styling, with a larger 42px input, 16px text and a taller padded search header. The weather source search explicitly uses the shared search input class.
- Weather icon preview cells have more vertical room, a constrained icon canvas and clipped overflow so SVG details remain inside each preview tile.


## Weather card and icon selector polish (14 November 2026)

- The standard animated icon pack retains its yellow sun, pale clouds, blue precipitation and other condition-specific colours; sun rotation/breathing and cloud/precipitation motion make the animation more apparent.
- Weather pack choices and preview tiles use the same theme-aware card surface tokens as the rest of the dashboard, rather than the separate quick-action tile surface.
- The canonical English condition label is normalized for whitespace and hyphens before comparison with the API category. Thus `Sunny` is treated as the `sunny` category and translated through the active locale, while genuinely custom descriptions remain verbatim.
- Removed the weather card eyebrow above the outdoor temperature and increased the temperature type size.


## Weather motion controls and clock formatting (14 November 2026)

- Weather settings persist a global `animateIcons` boolean (default: true) alongside the selected icon pack. The switch controls both the dashboard icon and the settings preview.
- Each icon pack owns its motion style: standard SVG weather symbols use their own sun/cloud/precipitation animations and independent two-bolt thunder flashes; the 3D, outline and flat packs use distinct pack-specific motion. Static mode disables all of these animations.
- Thunderstorm in the standard pack uses two separate lightning paths with independently timed on/off flashes; they no longer translate side-to-side.
- Clock formatting uses locale-aware date-time parts. In 12-hour locales the AM/PM marker is rendered as a smaller suffix after the enlarged time; 24-hour locales do not show a marker.
- The clock time type size has been increased while keeping the period marker visually subordinate.
