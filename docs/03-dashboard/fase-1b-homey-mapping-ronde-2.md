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
- Homey-apparaat **Zon positie**, ID `08be2365-c8f4-43e5-8e04-7b290e164a1b`, bevat `measure_numeric` (momentopname 218,87). De gebruiker heeft besloten de specifieke dashboardconditie “Zon op raam Tess” niet te migreren; deze bronmapping vervalt voor het dashboard.

## 4. Temperatuur- en klimaatbronnen

Aangetroffen:
- **Temperatuur Bram**, ID `58f20a55-90b3-49cf-9af0-53a40f6e501c`, `measure_temperature` (momentopname 17,4 °C).
- **Temperatuur ouderslaapkamer**, ID `6d68c7ba-411f-47c1-9624-2f61a7006795`, `measure_temperature` (16,1 °C).
- **Temperatuur Sem**, ID `ba9336e2-f4ed-417c-bba6-3fafb735e61a`, `measure_temperature` (16,5 °C).
- **Multisensor woonkamer**, `measure_co2` (416,4 ppm in deze inventarisatie) en `measure_temperature`.
- **Airco keuken** en **Airco zolder** bieden `thermostat_mode`, `onoff`, `target_temperature` en temperatuurmetingen.
- **Remeha ketel** bevat `boiler_state`, `DHW_state`, `DHW_mode` en statuscodes.

De gebruiker heeft bevestigd dat de vier koude-kamerkaarten gemigreerd moeten worden met dezelfde eenvoudige regel: toon de melding wanneer de temperatuursensor in de betreffende kamer **lager dan 16 °C** meet. De bron voor Bram en ouderslaapkamer is gevonden. Een aparte sensor voor Tess is nog niet geïdentificeerd. Voor zolder moet nog worden bevestigd welke temperatuursensor als de kamersensor geldt; de zolder-airco heeft wel een `measure_temperature`-waarde, maar dat is niet automatisch de bedoelde temperatuursensor.

## 5. Plant- en telefoonbatterijen

De gebruiker heeft alle vier plantmeldingen en alle vijf telefoonbatterijmeldingen expliciet op **Niet migreren** gezet. Deze onderdelen worden niet gebouwd in het nieuwe dashboard. De oorspronkelijke HA-configuratie blijft alleen als historische referentie bestaan.

De Muur tablet is wel aanwezig (ID `3047fdb8-2dea-4cea-b023-27c9693b4635`) met `measure_battery`; momentopname 100%.

## 6. Logic-variabelen en schema's

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

Er zijn geen Logic-variabelen gevonden die de HA-schema's rechtstreeks bevestigen. De gebruiker heeft de schema's als volgt beoordeeld:
- `schedule.boven_ramen_open`: **Migreren**. Onderzoeken of het schema kan worden gereproduceerd en als herbruikbare bouwsteen in Blockly beschikbaar kan worden gemaakt.
- `schedule.slapen_sem`: **Niet migreren**.
- `schedule.slapen_bram`: **Niet migreren**.

De Homey-Flow-timeoutvariabelen mogen niet als vervanging voor het oorspronkelijke bovenramenschema worden gebruikt.

## 7. Voorlopige mappingstatus na gebruikerskeuzes

**Migreren**
- Koude-kamerkaarten Bram, Tess, ouderslaapkamer en zolder, met de expliciete grens <16 °C.
- Neerslagkans >25: migreren, maar op de backlog tot een geschikte app/databron met regenkans is gekozen.
- Bovenramenschema: migreren; onderzoek reproductie en herbruikbaarheid in Blockly.

**Niet migreren**
- Alle vier plantmeldingen (vochtigheid en voedingswaarde).
- Alle vijf telefoonbatterijmeldingen.
- Zon op raam Tess.
- Slaap-/schema-afhankelijkheid voor lamp Sem en lamp Bram.

**Nog open / bronmapping nodig**
- Temperatuursensor Tess.
- Bevestiging welke zoldertemperatuursensor voor de koude-zoldermelding bedoeld is.
- Reproductie van het bovenramenschema en de Blockly-bouwsteen.
- Geschikte bron/app voor neerslagkans.

## 8. Volgende stap

Zoek de ontbrekende temperatuursensor(en) en ontwerp de herbruikbare schema-bouwsteen voor `schedule.boven_ramen_open`. Zet neerslagkans op de backlog tot de gebruiker een geschikte weer-app/databron heeft gekozen. Niet-migreren-onderdelen worden uitgesloten van de nieuwe dashboardimplementatie, maar blijven traceerbaar in de historische HA-referentie.


## 9. Aanvullende temperatuurbroncontrole na migratiekeuzes

Een nieuwe actuele apparaatcontrole heeft de volgende kandidaten opgeleverd:

### Tess
- **Thermostaat Tess**, ID `203a126c-1923-4857-abcb-6a727a133099`, zone Eerste verdieping > Tess, heeft `measure_temperature = 16 °C` en `target_temperature = 12 °C`.
- **Radiator Tess**, ID `b95a295c-97c3-4188-8643-65c99f950783`, dezelfde zone, heeft eveneens `measure_temperature = 16 °C` en `target_temperature = 12 °C`.
- De gebruiker heeft bevestigd dat **Thermostaat Tess** de bron is voor de HA-kaart “Slaapkamer Tess koud”. **Radiator Tess** is niet geselecteerd.

### Zolder
- **Airco zolder**, ID `746e2538-bf25-45b0-8e98-3e0100bff811`, zone Zolder > Voorzolder, heeft `measure_temperature = 19 °C`.
- **Rookmelder zolder**, ID `480cee53-22da-47e0-a9bd-6a64c9b11c40`, zone Zolder > Voorzolder, heeft `measure_temperature = 20,2 °C`.
- **CO Sensor**, ID `6f1b28a0-0641-42d7-8f30-e6d8293c0b34`, zone Zolder > Voorzolder, heeft `measure_temperature = 19,6 °C`.
- De gebruiker heeft verduidelijkt dat met de zolderbron de temperatuursensor op slaapkamer Sem wordt bedoeld: **Temperatuur Sem**, ID `ba9336e2-f4ed-417c-bba6-3fafb735e61a`, zone Zolder > Sem, capability `measure_temperature` (momentopname tijdens inventarisatie: 16,5 °C). De sensoren op de Voorzolder zijn hiervoor niet bedoeld.

### Bram en ouderslaapkamer bevestigd
- **Temperatuur Bram**, ID `58f20a55-90b3-49cf-9af0-53a40f6e501c`, `measure_temperature = 17,4 °C`.
- **Temperatuur ouderslaapkamer**, ID `6d68c7ba-411f-47c1-9624-2f61a7006795`, `measure_temperature = 16,1 °C`.
- Deze apparaatnamen en zones passen direct bij de door de gebruiker bedoelde kamertemperatuurbronnen.

De waarden hierboven zijn momentopnames tijdens de inventarisatie. De dashboardregel voor alle vier kamers blijft exact **temperatuur <16 °C**. De bron voor Tess is door de gebruiker bevestigd als **Thermostaat Tess**. De zolderbron is door de gebruiker bevestigd als **Temperatuur Sem**.


### Bevestiging temperatuurbron Tess
De gebruiker heeft expliciet gekozen voor **Thermostaat Tess** (`203a126c-1923-4857-abcb-6a727a133099`) als bron voor de melding “Slaapkamer Tess koud”. Gebruik de capability `measure_temperature` en de ingestelde grens **lager dan 16 °C**. Radiator Tess is niet de gekozen bron.


### Bevestiging temperatuurbron zolder / slaapkamer Sem
De gebruiker heeft bevestigd dat de temperatuursensor op slaapkamer Sem bedoeld wordt voor de melding “Zolder koud”. Gebruik Homey-apparaat **Temperatuur Sem**, ID `ba9336e2-f4ed-417c-bba6-3fafb735e61a`, capability `measure_temperature`. De meldingsgrens blijft **lager dan 16 °C**. Airco zolder, Rookmelder zolder en CO Sensor op de Voorzolder zijn niet de gekozen bron.

## 10. Gebruikersbesluit – keuken-vriezergrens (12 november 2026)

Voor de melding **Vriezer keuken warm!** wordt een expliciete grenswaarde van **hoger dan 10 °C** gebruikt. De Homey-bron is het apparaat **Koelkast keuken temperatuur** (ID `64fc846e-01b0-438a-9114-4498ea8005e7`), capability `measure_temperature`. Bij een waarde >10 °C is de melding actief; bij ≤10 °C is deze inactief. De melding behoudt niveau **kritiek**. De oorspronkelijke HA-dashboard-YAML verwees naar `binary_sensor.vriezer_keuken_temperatuur_hoog`, maar bevatte zelf geen numerieke grens. De grens van 10 °C is daarom een expliciet nieuw gebruikersbesluit voor de migratie, niet een uit de YAML afgeleide waarde. De Logic-variabele `Vriezer_tempAlarm` wordt hiervoor niet gebruikt.

## 11. Gebruikersbevestiging – CO₂-woonkamerbron (12 november 2026)

Voor **CO₂ woonkamer hoog!** is Homey-apparaat **Multisensor woonkamer** met capability `measure_co2` bevestigd als bron. De oorspronkelijke grens blijft exact **>1200 ppm**. De melding is actief boven 1200 ppm en inactief bij 1200 ppm of lager. Meldingsniveau: **waarschuwing**.

## 12. Gebruikersbevestiging – neerslagkans (12 november 2026)

Voor **Kans op neerslag** bevestigt de gebruiker Homey-apparaat **Raamsdonksveer** (ID `b2fa37bb-45e2-4fda-87b7-24dcecf64420`), capability `measure_precipitation_probability`, als bron. De oorspronkelijke grens **>25%** blijft behouden. De melding is actief bij meer dan 25% en inactief bij 25% of lager. Meldingsniveau: **info**.

## 13. Gebruikersbevestiging – buitentemperatuur Achterdeur open (12 november 2026)

Voor de melding **Achterdeur open** bevestigt de gebruiker Homey-apparaat **Weer**, capability `measure_temperature`, als bron voor de buitentemperatuur. Behoud de oorspronkelijke YAML-conditie: achterdeurcontact open én (buitentemperatuur **<18 °C of >24 °C**). De temperatuurvergelijking is een OR-groep; deze wordt gecombineerd met het open deurcontact via AND. Het eerder vastgestelde meldingsniveau blijft **waarschuwing**.

## 14. Gebruikersbevestiging – Zolder koud (12 november 2026)

Voor **Zolder koud** bevestigt de gebruiker Homey-apparaat **Temperatuur Sem** (ID `ba9336e2-f4ed-417c-bba6-3fafb735e61a`), capability `measure_temperature`, als bron. De melding wordt actief bij een temperatuur **<12 °C** en inactief bij ≥12 °C. De kaart behoudt de oorspronkelijke verwijzing naar de ingestelde temperatuur van `climate.airco_zolder_thermostaat` voor de weergave. Meldingsniveau blijft **info**.

## 15. Gebruikersbesluit – herbruikbaar schema bovenramen (12 november 2026)

Het oorspronkelijke Home Assistant-schema `schedule.boven_ramen_open` wordt in Homey reproduceerbaar gemaakt als een **herbruikbare Blockly-bouwsteen**. De bouwsteen krijgt instelbare dagen en tijden, zodat de raamcondities het schema kunnen hergebruiken. De inhoudelijke werking blijft gebaseerd op het oorspronkelijke YAML-schema; Homey Flows worden niet als bron voor de dashboardlogica gebruikt.

### Wasmachine-wateralarm – gebruikersbevestiging (12 november 2026)

Voor de afzonderlijke melding **Wateralarm wasmachines!** bevestigt de gebruiker de afzonderlijke Homey-**Water sensor wasmachine** met capability `alarm_water` als bron. Gebruik dus niet de wasmachine zelf als wateralarmbron. De exacte apparaat-ID en actuele waarde zijn in deze bevestiging niet vastgelegd; die blijven te verifiëren in de Homey-inventarisatie. De bestaande YAML-voorwaarde en het meldingsniveau **kritiek** blijven ongewijzigd.


## 16. Zonnepanelen – historische gegevensinventarisatie (12 november 2026)

De gebruiker heeft het Homey-apparaat **Zonnepanelen** aangewezen. De actuele Homey-inventarisatie bevestigt:
- Apparaat-ID: `e743e650-8ac8-477a-b174-bc614fd6a5a2`.
- Type: `solarpanel`; zone: **Thuis > Dak**.
- Relevante actuele capabilities/waarden in de inventarisatiesnapshot: `measure_power = 0` W, `meter_power_today = 2.5` kWh en `meter_power = 13443.572` kWh.

De Insights-loglijst is eveneens gecontroleerd. Voor dit exacte apparaat-ID is momenteel alleen de boolean-log `onoff` / **Stroomproductie** aanwezig. Er zijn in de huidige Insights-inventarisatie geen numerieke historische logs voor `measure_power`, `meter_power` of `meter_power_today` gevonden. Andere logs met titels als **Power Produced** en **Energy Produced** horen bij een ander Homey-apparaat-ID en worden nadrukkelijk niet aan de zonnepanelen gekoppeld.

Conclusie: de actuele dagopbrengst kan uit de capability `meter_power_today` worden getoond, maar een historische productiecurve voor dit apparaat is met de momenteel zichtbare Insights-logs nog niet beschikbaar. Voordat een grafiek wordt gebouwd, moet worden vastgesteld of de zonnepanelenintegratie deze numerieke capabilities naar Homey Insights kan registreren of dat een eigen backendhistorie nodig is. Geen gegevens van een ander apparaat mogen als vervanging worden gebruikt.


## Correctie – numerieke zonnepanelen-Insights blijken beschikbaar (12 november 2026)

Bij een tweede controle is niet op logtitels gefilterd, maar op het exacte apparaat-ID `e743e650-8ac8-477a-b174-bc614fd6a5a2`. Daardoor zijn de volgende vijf Insights-logs gevonden: `connected_inverters` (number), `energy_power` (number, W), `meter_power` (number, kWh), `meter_power_today` (number, kWh) en `onoff` (boolean). Dit corrigeert de eerdere conclusie in sectie 16 dat er geen numerieke logs beschikbaar waren.

De numerieke logs zijn getest met resolutie `last24Hours`. Voor elk van de drie belangrijkste meetreeksen (`energy_power`, `meter_power`, `meter_power_today`) zijn 288 tijdstempels teruggekomen, met een interval van 5 minuten. `energy_power` varieerde in de opgehaalde periode van 0 tot 533 W en bevatte 109 niet-nulmetingen. `meter_power` liep op van circa 13441.071 naar 13443.572 kWh (ongeveer 2.5 kWh verschil). De `today`-resolutie leverde op het moment van testen 11 punten voor de lopende lokale dag op; de tijdstempels zijn UTC en moeten in de dashboardweergave naar de lokale tijdzone worden geconverteerd.

Conclusie: Homey Insights is voldoende voor de eerste historische zonnepanelengrafiek; er is voor deze grafiek geen eigen meetpuntenopslag in Docker nodig. Gebruik `energy_power` voor de vermogenscurve (W) en desgewenst `meter_power_today` of het verschil in `meter_power` voor energieopbrengst (kWh). De backend haalt de logmetadata op via `getLogs()` en de tijdreeks via `getLogEntries()` met een expliciete resolutie. Vereiste API-scope: `homey.insights.readonly`. Houd rekening met de door Homey gekozen aggregatie/resolutie bij langere perioden.
