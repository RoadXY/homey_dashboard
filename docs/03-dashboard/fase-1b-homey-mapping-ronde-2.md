# Fase 1B – Homey-bronmapping ronde 2

**Datum:** 11 november 2026  
**Methode:** read-only inventarisatie van 128 Homey-apparaten en alle Logic-variabelen.  
**Doel:** open bronkoppelingen uit de oorspronkelijke HA-dashboard-YAML nader vaststellen.  
**Veiligheid:** er zijn geen Homey-apparaten, capabilities, variabelen of Flows gewijzigd.

## 1. Ramen en deuren

| HA-bron / functie | Homey-apparaat | ID | Capability | Bevinding |
|---|---|---|---|---|
| Grote Bram | Onder raam Bram | `952d6163-983f-4d4d-a92d-4c66c9338f6b` | `alarm_contact` | Naam en zone Bram komen overeen met de onderraam-kandidaat. |
| Raam Bram niet open | Bovenraam Bram | `7972a10c-da9b-4d15-b4eb-305d9cb097e3` | `alarm_contact` | Naam/zone Eerste verdieping > Bram; plausibele koppeling aan HA-bovenraam. |
| Grote Tess | Onder raam Tess | `f929115b-18d9-41bb-bf67-e9a633f00ee7` | `alarm_contact` | Naam en zone Tess komen overeen met de onderraam-kandidaat. |
| Raam Tess niet open | Boven raam Tess | `68528dbf-b2cb-49dc-89e6-0425cbd7db97` | `alarm_contact` | Naam/zone Eerste verdieping > Tess; plausibele koppeling aan HA-bovenraam. |
| Ouderslaapkamer onderraam | Ouderslaapkamer onderraam | `129f22a4-1f01-420c-a1a9-c41a25c6c46d` | `alarm_contact` | Exacte naamovereenkomst. |
| Grote Ouders open | Bovenraam ouderslaapkamer | `3c8d2ab7-bc67-4d4d-a92d-4c66c9338f6b` | `alarm_contact` | Dit is een afzonderlijk bovenraam; niet verwisselen met onderraam. |
| Dakraam Sem | Dakraam Sem | `d1ef5cbd-ba35-48b7-8219-0112403c80bf` | `alarm_contact` | Exacte naamovereenkomst. |
| Raam Sem | Raam Sem | `f5a84ac4-1819-49ad-823f-c473c03b6043` | `alarm_contact` | Exacte naamovereenkomst. |
| Achterdeur | Achterdeur | `8bd0184e-5cd7-443f-bafc-8d509ab32e7a` | `alarm_contact` | Exacte naamovereenkomst. |
| Voordeur | Voordeur | `ae20dbd0-2b61-4f46-9638-c2a38cd2f2e6` | `alarm_contact` | Exacte naamovereenkomst. |
| Deur tuinhuis | Deur tuinhuis | `0f02abca-04cb-405a-b7d1-437cf2b4c050` | `alarm_contact` | Exacte naamovereenkomst. |

**Momentopname:** bij uitlezen stonden Bovenraam Bram, Boven raam Tess, Bovenraam ouderslaapkamer, Deur tuinhuis en Badkamer raam op `true`; de overige hierboven vermelde relevante contacten stonden op `false`. Dit zijn alleen momentopnames en geen blijvende status.

De koppelingen Bram/Tess zijn sterk op basis van naam en zone, maar de uiteindelijke fysieke mapping blijft door de gebruiker te bevestigen als de precieze raampositie afwijkt.

## 2. Vriezer en vaatwasser-wateralarm

### Keuken-vriezer
- Het Flow-device-ID `64fc846e-01b0-438a-9114-4498ea8005e7` is nu bevestigd als **Koelkast keuken temperatuur**, zone Keuken.
- Capabilities: `measure_temperature`, `measure_humidity`, `measure_pressure`, `measure_battery`.
- Momentopname: 6,6 °C.
- Dit bevestigt de apparaatnaam/zone, maar niet of de HA-kaart “Vriezer keuken warm!” bewust de koelkasttemperatuur gebruikte. De oorspronkelijke HA-entity-ID bevatte eveneens `koelkast`; die bronrelatie blijft dus expliciet te valideren.

### Garage-vriezer
- **Vriezer garage temperatuur**, ID `c2e54379-b78a-4e20-88a5-5affa7811874`.
- Capability `measure_temperature`; momentopname -22,6 °C.
- Afzonderlijk apparaat **Vriezer garage** (apparaat-ID `28f1ef45-d244-470f-85d8-606835677b9e`) levert onder meer `measure_power`; dit is niet de temperatuurbron.

### Vaatwasser-wateralarm
- Er is een afzonderlijke **Water sensor vaatwasser**, ID `5ae0730c-27ca-4559-b1f2-ffeba8fb1565`, met capability `alarm_water`.
- Momentopname: `false`.
- De vaatwasser zelf (ID `d3ae5203-7ef3-4920-b10a-10872965360c`) heeft ook een veld `alarm_water`, maar de momentopname daarvan is `null`. Voor het HA-wateralarm is de afzonderlijke watersensor de betere bronkandidaat.
- De oorspronkelijke HA-voorwaarde “Wateralarm vaatwasser!” kan dus waarschijnlijk rechtstreeks met de aparte sensor worden gereproduceerd.

## 3. Weer en zon

- Homey-apparaat **Weer**, ID `c7e68c38-1588-4c93-9db8-e854f4d251ab`, bevat onder andere temperatuur, gevoelstemperatuur, actuele regen (`measure_rain`), sneeuw, conditioncode, wind, zonsopkomst en zonsondergang.
- Een expliciete neerslagkans zoals de HA-sensor `rainchance_1d` is niet aangetroffen in de geïnventariseerde state.
- Homey-apparaat **Zon positie**, ID `08be2365-c8f4-43e5-8e04-7b290e164a1b`, bevat `measure_numeric` (momentopname 218,87). Dit is nog geen bewijs dat de waarde de HA-binarysensor `zon_staat_op_raam_tess` kan vervangen. De betekenis/eenheid en de berekening van zon op specifiek raam Tess zijn niet vastgesteld.

## 4. Temperatuur- en klimaatbronnen

Aangetroffen:
- **Temperatuur Bram**, ID `58f20a55-90b3-49cf-9af0-53a40f6e501c`, `measure_temperature` (momentopname 17,4 °C).
- **Temperatuur ouderslaapkamer**, ID `6d68c7ba-411f-47c1-9624-2f61a7006795`, `measure_temperature` (16,1 °C).
- **Temperatuur Sem**, ID `ba9336e2-f4ed-417c-bba6-3fafb735e61a`, `measure_temperature` (16,5 °C).
- **Multisensor woonkamer**, `measure_co2` (416,4 ppm in deze inventarisatie) en `measure_temperature`.
- **Airco keuken** en **Airco zolder** bieden `thermostat_mode`, `onoff`, `target_temperature` en temperatuurmetingen.
- **Remeha ketel** bevat `boiler_state`, `DHW_state`, `DHW_mode` en statuscodes.

Geen herkenbaar Homey-apparaat met naam “Temperatuur Tess” of een expliciete HA-achtige binarysensor `temperatuur_*_laag` is in deze naam-/capabilitygerichte inventarisatie gevonden. De onderliggende temperatuur kan anders benoemd zijn; de lage-temperatuurregels blijven daarom open. Remeha-capabilities zijn beschikbaar, maar de exacte HA-binarysensorsemantiek moet nog worden gevalideerd.

## 5. Plant- en telefoonbatterijen

- In de inventarisatie van 128 apparaten is geen herkenbaar apparaat gevonden voor de vier HA-plantkaarten (vochtigheid/conductivity).
- Evenmin zijn herkenbare Homey-apparaten voor de HA-telefoonbatterijkaarten Galaxy A54, SM-S721B, Pixel 7 Pro, SM-F966B en Moto G60S gevonden.
- De Muur tablet is wel aanwezig (ID `3047fdb8-2dea-4cea-b023-27c9693b4635`) met `measure_battery`; momentopname 100%.

Afwezig in de huidige Homey-device-inventarisatie betekent niet automatisch dat de gebruiker geen andere bron heeft; alleen dat de koppeling via deze Homey-apparaatlijst niet beschikbaar is aangetoond.

## 6. Logic-variabelen

De actuele Logic-inventarisatie bevestigt onder andere:
- `ramen_AantalOpen` (number, 0)
- `ramen_telRamenOpenReden` (string, “Dakraam Sem”)
- `Vriezer_tempAlarm` (boolean, false)
- `wasmachine_draait` (boolean, true)
- `vaatwasser_draait` (boolean, false)
- `achterdeur_melding` en `voordeur_melding` (tekst)
- `achterdeur_tempVerschilBinnenBuiten` en `voordeur_tempVerschilBinnenBuiten` (numerieke verschillen)
- `regen_ramenOpenTimout` en `regen_deurOpenTimeout` (debounce/timeout booleans)
- `eco2_woonkamer_status` (number, 0)

Er zijn geen Logic-variabelen gevonden met namen die de HA-schemas `schedule.boven_ramen_open`, `schedule.slapen_sem` of `schedule.slapen_bram` rechtstreeks bevestigen. De Homey-Flow-timeoutvariabelen mogen niet als vervanging voor de oorspronkelijke dashboard-schemas worden gebruikt.

## 7. Voorlopige mappingstatus

**Goed gekoppeld / sterke kandidaten**
- Deuren en meeste raamcontacten (met fysieke mapping nog door gebruiker te bevestigen).
- Watersensor wasmachines en aparte vaatwasser-watersensor.
- Keuken-koelkasttemperatuurbron en garage-vriezertemperatuurbron, met de genoemde semantische kanttekening.
- Truus, muurtablet, wasmachine, droger, weer, airco's en CO2-bron.

**Nog open**
- De drie HA-schemas voor bovenramen/slapen.
- Zon op raam Tess.
- Neerslagkans >25.
- Plantensensoren.
- Telefoonbatterijen.
- Lage-temperatuurregels voor de slaapkamers.
- Remeha-statusvertaling.
- Exacte HA-binarysensor-/templatebetekenis van wasmachine en droger.

## 8. Volgende stap

Onderzoek de nog open Homey- en niet-Homey-bronnen gericht. Als een bron niet in Homey bestaat, registreer die als ontbrekende databron in plaats van de HA-regel te veranderen. Daarna kan het regelmodel de originele HA-condition trees overnemen en de bronkoppeling als configureerbare mapping bewaren.
