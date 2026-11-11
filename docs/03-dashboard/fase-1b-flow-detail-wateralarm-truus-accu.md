# Fase 1B – detail Standard Flows wateralarm en Truus-accu

**Status:** read-only geïnventariseerd  
**Bron:** Homey Pro 2023 Standard Flow-definities  
**Doel:** vastleggen welke bestaande signalen bruikbaar zijn voor het dashboard.  
**Veiligheidsgrens:** er zijn geen Flows, apparaten, variabelen of instellingen gewijzigd.

## 1. Wasmachines: water alarm

- **Flow-ID:** `f8f74cce-ffed-4246-af2d-f0b8bbb6d87d`
- **Status:** ingeschakeld; niet als defect gemarkeerd.
- **Trigger:** apparaat `8fbc6198-191f-4bdd-bc40-a09158441d2f`, capabilitykaart `alarm_water_true`.
- **Voorwaarden:** geen aanvullende voorwaarden in de Standard Flow-definitie.
- **Acties bij trigger:**
  - SOS-morse pushmelding.
  - Pushmelding: “Water lekkage gedetecteerd bij de wasmachine op zolder!”
  - Dezelfde tekst wordt naar twee gebruikers gepusht.
  - Drie bestaande Google TTS Advanced Flows worden aangeroepen: beneden, eerste verdieping (altijd melding) en tweede verdieping (altijd melding), met een gesproken waterlekkagewaarschuwing.

**Dashboardbetekenis:** dit is een belangrijk alarm-event. De Flow-definitie bevat geen expliciete resetactie, actuele alarmstatus of dashboardvriendelijke statusvariabele. De triggerkaart suggereert een watersensor-signaal, maar de apparaatnaam en actuele capabilitywaarde zijn met deze Flow-uitlezing niet vastgesteld. Voor een blijvende alarmindicator moet de actuele apparaatstatus rechtstreeks uit Homey worden gelezen en getest; alleen het bestaan van deze Flow bewijst geen actieve lekkage.

## 2. Truus: accu weer boven de 50%

- **Flow-ID:** `52c6c57a-f0b0-4137-bdce-a9646a0bdac4`
- **Status:** ingeschakeld; niet als defect gemarkeerd.
- **Trigger:** apparaat Truus, ID `1f76bd9a-b6f6-4f78-8734-742b9d054cfc`, batterijcapaciteit boven drempelwaarde 50%.
- **Voorwaarden:** geen aanvullende voorwaarden in de Standard Flow-definitie.
- **Actie:** pushmelding “Accu Truus is weer een beetje opgeslagen”.

**Dashboardbetekenis:** de Flow meldt een batterij-drempeloverschrijding; het is geen indicatie dat Truus op dat moment aan het schoonmaken is of klaarstaat. Voor de actuele batterijstatus kan het dashboard de live `measure_battery`-waarde van het apparaat gebruiken. De pushactie zelf is geen blijvende status.

## 3. Gevolgen voor het dashboard

1. Neem waterlekkage op als alarmcategorie met hoge prioriteit.
2. Toon een blijvende alarmstatus alleen wanneer een actuele Homey-capability of een expliciet statusgegeven dit ondersteunt; gebruik niet uitsluitend de Flow-trigger als actuele status.
3. Toon Truus' actuele batterijpercentage vanuit `measure_battery`; behandel de 50%-Flow als notificatielogica, niet als statusbron.
4. Houd Truus' actuele werkstatus apart van batterijstatus. De eerder geïnventariseerde `measure_work_status` blijft de kandidaat voor schoonmaak-/dockstatus.

## 4. Open verificatiepunten

- De apparaatnaam en actuele waarde van apparaat `8fbc6198-191f-4bdd-bc40-a09158441d2f` moeten nog via de Homey-apparaatinventaris worden bevestigd.
- De actuele waarde en eventuele resetsemantiek van `alarm_water_true` zijn in deze Flow-uitlezing niet vastgesteld.
- Er is geen blijvende Logic-variabele voor het wateralarm aangetroffen in deze Standard Flow.
