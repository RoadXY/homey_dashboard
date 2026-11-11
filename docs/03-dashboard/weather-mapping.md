# Weather condition mapping

**Status:** Implemented as a JSON-driven backend mapping; deployment validation pending.  
**Date:** 11 November 2026  
**Branch:** `phase_1_foundation`

## Purpose

Weather providers expose different capability names, languages, labels, and condition codes. The dashboard must not contain provider-specific matching logic.

The backend converts Homey values into a stable internal weather category. The frontend receives only that category and selects the corresponding monochrome icon and restrained animation.

## Data flow

1. The JSON profile identifies the Homey weather device and an ordered list of condition capabilities.
2. The backend reads those capabilities through the existing read-only Homey data service.
3. The backend matches the raw value against exact mapping rules in the JSON profile.
4. The backend returns a normalized category through `GET /api/weather`.
5. The frontend renders the icon for that category. It does not inspect provider-specific text or codes to choose an icon.

The displayed weather description remains the original Homey text. It is presentation text only and does not control icon selection.

## Canonical categories

| Category | Meaning |
|---|---|
| `clear` | Clear or sunny |
| `partly_cloudy` | Partly cloudy |
| `cloudy` | Cloudy or overcast |
| `rain` | Rain or showers |
| `thunderstorm` | Thunderstorm |
| `snow` | Snow, sleet, hail, or freezing precipitation |
| `fog` | Fog, mist, or haze |
| `wind` | Wind, when supplied as a distinct condition |
| `unknown` | Missing, unavailable, or unmapped condition |

Unknown values must remain `unknown`. The application must never guess a weather condition or silently fall back to `cloudy`.

## Configuration

The active profile is:

`config/weather/weather-mapping.json`

The profile uses English keys, identifiers, categories, and technical values. Provider-specific source labels may be in the provider's native language because they are literal input values, not internal category names.

Important fields:

- `schemaVersion`: configuration schema version.
- `source.deviceId`: Homey device ID.
- `source.conditionCapabilities`: ordered capabilities to try; the first capability with a matching rule wins.
- `mappings`: exact value-to-category rules, scoped to a capability.
- `defaultCategory`: must be `unknown`.

String matching trims surrounding whitespace and ignores case. Numeric values can be mapped by exact numeric equality. Fuzzy matching and substring matching are intentionally not used because they can produce false weather classifications.

## Current profile

The current profile targets the existing Homey weather device and tries `conditioncode_text` before `description`. It includes the observed Dutch value `Regenachtig` as well as a small set of common English and Dutch exact labels. This initial list is a starting point, not a claim that every provider uses these labels.

When adding a provider:
1. Inspect its actual Homey capability IDs and live values.
2. Add its capability IDs to the ordered source list.
3. Add exact observed values to the mapping rules for the relevant capability.
4. Verify every supported condition and verify that an unknown value remains `unknown`.
5. Do not add guessed values merely to make the icon appear populated.

## API response

`GET /api/weather` returns:

```json
{
  "retrievedAt": "2026-11-11T20:00:00.000Z",
  "category": "rain",
  "conditionText": "Regenachtig",
  "sourceCapability": "conditioncode_text"
}
```

If the source is unavailable or no rule matches, the category is `unknown` and a machine-readable `reason` is returned.

## Future configuration UI

The future settings interface should edit this same JSON structure rather than introduce a second configuration format. A weather mapping editor should support:
- selecting a Homey device;
- selecting one or more condition capabilities and their priority;
- showing current raw values;
- adding exact string or numeric matches;
- selecting a canonical category;
- previewing the resulting icon;
- validating and saving the profile.

The JSON profile remains the source of truth until that editor exists. The editor's delivery phase is not assigned yet; it belongs to dashboard configuration rather than being inherently part of the phase 4 external event API.

## Language convention

All source code, JSON property names, internal identifiers, canonical values, API fields, and technical code comments must be in English. User-facing dashboard labels and messages may remain Dutch. Literal provider values in mapping files are allowed in their original language because they must match the provider's actual output.
