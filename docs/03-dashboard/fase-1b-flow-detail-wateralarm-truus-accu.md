# Fase 1B – detail Standard Flows wateralarm en Truus-accu

**Status:** read-only geïnventariseerd  
**Bron:** Homey Pro 2023 Standard Flow-definities en actuele apparaat-inventarisatie  
**Doel:** vastleggen welke bestaande signalen bruikbaar zijn voor het dashboard.  
**Veiligheidsgrens:** er zijn geen Flows, apparaten, variabelen of instellingen gewijzigd.

## 1. Wasmachines: water alarm

- **Flow-ID:** `f8f74cce-ffed-4246-af2d-f0b8bbb6d87d`
- **Status:** ingeschakeld; niet als defect gemarkeerd.
- **Trigger:** apparaat **Water Sensor wasmachines**, ID `8fbc6198-191f-4bdd-bc40-a09158441d2f`, capabilitykaart `alarm_water_true`.
- **Locatie:** Thuis > Zolder > Voorzolder.
- **Voorwaarden:** geen aanvullende voorwaarden in de Standard Flow-definitie.
- **Acties bij trigger:**
  - SOS-morse pushmelding.
  - Pushmelding: “Water lekkage gedetecteerd bij de wasmachine op zolder!”
  - Dezelfde tekst wordt naar twee gebruikers gepusht.
  - Drie bestaande Google TTS Advanced Flows worden aangeroepen: beneden, eerste verdieping (altijd melding) en tweede verdieping (altijd melding), met een gesproken waterlekkagewaarschuwing.
- **Actuele momentopname tijdens inventarisatie:** `alarm_water = false`.

**Dashboardbetekenis:** dit is een belangrijk alarm-event. De actuele apparaatstatus is rechtstreeks beschikbaar via `alarm_water`. Toon een actieve lekkage wanneer deze capability `true` is. De Flow-definitie bevat geen expliciete resetactie of dashboardvriendelijke statusvariabele; de sensorstatus is daarom de primaire kandidaat voor de actuele indicator. De momentopname `false` is alleen de waarde tijdens deze inventarisatie, geen garantie voor toekomstige status.

## 2. Truus: accu weer boven de 50%

- **Flow-ID:** `52c6c57a-f0b0-4137-bdce-a9646a0bdac4`
- **Status:** ingeschakeld; niet als defect gemarkeerd.
- **Trigger:** apparaat **Truus**, ID `1f76bd9a-b6f6-4f78-8734-742b9d054cfc`, batterijcapaciteit boven drempelwaarde 50%.
- **Voorwaarden:** geen aanvullende voorwaarden in de Standard Flow-definitie.
- **Actie:** pushmelding “Accu Truus is weer een beetje opgeslagen”.
- **Actuele momentopname tijdens inventarisatie:** batterij 100%, werkstatus `Sleeping`, gedockt `true`.

**Dashboardbetekenis:** de Flow meldt een batterij-drempeloverschrijding; het is geen indicatie dat Truus op dat moment aan het schoonmaken is of klaarstaat. Gebruik de live `measure_battery`-waarde voor het actuele batterijpercentage. Houd batterijstatus apart van werkstatus (`measure_work_status`) en dockstatus (`measure_docked`). De momentopname is geen blijvende status.

## 3. Gevolgen voor het dashboard

1. Neem waterlekkage op als alarmcategorie met hoge prioriteit, rechtstreeks gevoed door `alarm_water`.
2. Toon de lekkage-indicator actief wanneer `alarm_water = true`; toon geen alarm op basis van alleen het bestaan of afgaan van de Flow.
3. Toon Truus' actuele batterijpercentage vanuit `measure_battery`.
4. Toon Truus' werkstatus en dockstatus als afzonderlijke gegevens; de 50%-Flow blijft notificatielogica, niet de statusbron.

## 4. Open verificatiepunten

- De actuele `alarm_water`-waarde is bij deze inventarisatie `false`. De werking van de sensor bij een echte detectie is niet getest (en wordt niet getest door ons).
- De precieze betekenis van de verschillende Truus-werkstatuswaarden moet in de dashboardpresentatie worden afgestemd; de huidige snapshot is `Sleeping`.
