# Weather condition source

**Status:** Replaced by the authenticated Weather API  
**Date:** 12 November 2026  
**Branch:** `phase_1_foundation`

## Decision

The dashboard has exactly one source for its displayed weather condition: the authenticated Weather API.

- Integration clients send one of the 16 canonical condition codes to `POST /api/v1/weather/conditions`.
- The backend validates the Bearer token and condition code, then persists the latest valid condition in `DATA_DIR/weather/condition.json`.
- `GET /api/weather` returns that persisted API condition for the dashboard.
- If no valid API condition has been received yet, the dashboard displays the translated `unknown` state. It does not read or infer a condition from Homey capabilities.
- A later valid API update replaces the previous condition. There is no TTL or automatic expiry; Homey Flow/integration logic owns the update cadence.

## Homey weather measurements remain available

Homey remains the read-only source for numeric and supporting measurements shown on the weather card, including outside temperature, feels-like temperature and wind. These measurements do not determine the weather condition, description label or icon.

The capabilities `conditioncode_text` and `description` are no longer used to select or display the condition.

## Supported canonical condition codes

`sunny`, `mostly_sunny`, `partly_cloudy`, `cloudy`, `overcast`, `fog`, `drizzle`, `rain`, `heavy_rain`, `showers`, `thunderstorm`, `hail`, `snow`, `snow_showers`, `sleet`, `windy`.

The API accepts only these exact English codes. The dashboard translates them using the existing Dutch and English i18n catalogues. Day/night remains a separate display dimension.

## API contract

`GET /api/v1/weather/conditions` lists the supported codes.

`POST /api/v1/weather/conditions` accepts:

```json
{
  "condition": "cloudy"
}
```

Required header:

```http
Authorization: Bearer <managed-weather-token>
Content-Type: application/json
```

The write endpoint rejects missing/invalid tokens with HTTP 401 and invalid/missing condition values with HTTP 400. Successful updates return HTTP 200 and a server-generated `receivedAt` timestamp. The latest valid condition remains active until replaced.

## Retired implementation

The former JSON-driven Homey capability mapping has been removed from the runtime and repository. The retired file was `config/weather/weather-mapping.json`; no mapping profile or Homey text matching is required anymore.
