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


## Weather typography and selector consistency (14 November 2026)

- The English dashboard label for feels-like temperature is shortened to “Feels like”.
- Measurement tile values use a larger responsive type scale, while weather-detail labels and values are also enlarged for readability.
- Weather icon-pack radio rows and the animation switch now use the same blue-gradient surface, border, radius and shadow treatment as the notification settings selector/card.
- Standard thunderstorm flashes are quicker and grouped more closely, with a longer final illuminated interval followed by a deliberately longer dark pause. The two bolts remain independently timed.


## Offline weather sources and unsaved-change protection (14 November 2026)

- When a weather field has a configured source but its current reading is unavailable (for example, its Homey device is offline), the dashboard keeps the field visible and shows an em dash instead of hiding the field. Unconfigured fields remain hidden.
- The weather settings page reports its draft/saved difference to the shared settings navigation guard.
- Switching to another settings page or leaving settings while weather edits are unsaved prompts for confirmation, using the existing notification discard confirmation text. Browser Back is guarded by the same popstate mechanism already used for notification drafts.
- Saving weather settings updates the saved snapshot and clears the dirty state; cancelling navigation leaves the draft intact.


## Hail icon for the standard pack (14 November 2026)

- The standard animated weather pack now draws hail as three separate rounded ice pellets with short motion trails, rather than reusing the snowflake symbol.
- Each pellet falls on its own staggered loop in the icy blue precipitation colour. The shared animation switch still disables all motion when static icons are selected.
- Snow, snow showers and sleet retain their existing snowflake artwork and animation.


## Weather icon refinements and dashboard labels (14 November 2026)

- The standard fog icon no longer shows a cloud: it consists of four horizontally centered lines of different lengths.
- The standard windy icon no longer shows a cloud: it uses only the two curved wind trails.
- The sunny icon is centered in its symbol area and rotates around its own center. The mostly-sunny icon keeps the sun behind the cloud but also rotates the sun around its own center, without orbiting around a larger circle.
- The dashboard uses the shorter Dutch feels-like label “Gevoel”; the English dashboard label remains “Feels like”. The longer feels-like label remains available in the weather settings page.
- Weather detail labels and readings (feels-like, precipitation, sunrise and sunset, plus any other configured details) have a larger responsive type scale.


## Preview/dashboard icon consistency (14 November 2026)

- The weather settings preview and dashboard both render through the same WeatherIcon component. The preview previously showed partly_cloudy, while the live dashboard can receive mostly_sunny (for example, “Overwegend zonnig”). That live category was missing from the preview sample and did not share the partly-cloudy cloud placement rule.
- The preview now uses mostly_sunny as its representative partly-sunny sample, matching the common live condition, and the mostly_sunny cloud is positioned consistently with the partly-cloudy icon.
- Preview icon containers now use the same width-to-height proportion as the dashboard icon container, reducing visual differences caused by the preview's narrower aspect ratio.


## Weather icon preview sizing on portrait screens (14 November 2026)

- At viewport widths up to 900px, the weather icon preview changes from four columns to two. This gives each preview tile substantially more width for the artwork.
- Preview tiles gain additional height and the icon viewport and alternate-pack glyph size increase accordingly. The desktop four-column preview remains unchanged.


## Taller weather icon preview tiles (14 November 2026)

- On screens up to 900px wide, each of the two preview rows has taller tiles (156px minimum height, with a 140px icon viewport) to give the weather artwork more vertical breathing room.
- The two-column preview layout is retained; desktop preview sizing remains unchanged.
