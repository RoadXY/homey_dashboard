# Fase 1B – voorstel meldingenmatrix en live-statussen

**Status:** ontwerpvoorstel, gebaseerd op read-only Homey-inventarisaties  
**Project:** Homey Dashboard – Homey Pro 2023  
**Branch:** `phase_1_foundation`  
**Veiligheidsgrens:** geen Homey-Flows, apparaten, Logic-variabelen of instellingen gewijzigd.

## 1. Ontwerpprincipes

1. **Live-status is leidend voor wat nú waar is.** Gebruik waar mogelijk de actuele capability van het apparaat.
2. **Een Flow-melding is een gebeurtenis, niet automatisch een blijvende status.** Regen-, accu- en voltooiingsmeldingen mogen niet als actuele alarmstatus blijven staan.
3. **Afgeleide Logic-variabelen alleen gebruiken als hun producerende Flow en betekenis bekend zijn.**
4. **Onzekere mappings niet stilzwijgend overnemen.** Semantische verschillen met de HA-bron blijven open tot een expliciet besluit.
5. **Homey blijft de runtime-bron.** De dashboardcontainer leest Homey; hij voert geen Homey-acties of Flows uit.
6. **Tabletweergave blijft rustig en scanbaar.** Alleen actuele en relevante informatie krijgt prominente ruimte.

## 2. Voorstel A – actieve alarmen

| Alarm | Voorgestelde bron | Weergavevoorstel | Betrouwbaarheid / status |
|---|---|---|---|
| Waterlekkage wasmachines | Water Sensor wasmachines, `alarm_water` | Hoog-prioriteitsalarm zolang capability true is; direct duidelijk zichtbaar | Directe capability bevestigd. Momentopname false. Sensorwerking bij echte detectie niet getest. |
| CO2 woonkamer | Multisensor `measure_co2` plus `eco2_woonkamer_status` | CO2-waarde met statusniveau; waarschuwing bij Homey-status 1 en kritisch bij 2 | Homey-Flow gebruikt >1000, >2000 en reset <990 ppm. HA-bron gebruikte >1200 ppm. Besluit vereist. |
| Vriezer(s) te warm | Temperatuurcapability + Flowgrenzen | Temperatuur zichtbaar; waarschuwing bij bevestigde drempel | Garage: >-13 °C waarschuwing, tweede tak >-5 °C, herstel <-17 °C. Keuken-device-ID/ruimte nog niet bevestigd. Gedeelde alarmvariabele en labelverschil open. |
| Achterdeur open onder ongunstige condities | Contact `alarm_contact`, airco-modus, temperatuur en bestaande Flow-logica | Alleen contextmelding wanneer de deur open is én de relevante conditie klopt | Flow is complex met temperatuurverschil, airco-condities, timer en maximaal 3 meldingen. Niet gelijk aan HA-absolute buitentemperatuurconditie. |
| Voordeur open onder ongunstige condities | Contact `alarm_contact` en bestaande Flow/variabele | Contextmelding bij bevestigde voorwaarden | Variabele en volledige producerende Flow-logica nog niet gevalideerd. |
| Regen terwijl ramen open zijn | Buienradar-trigger + contactstatussen | Gebeurtenismelding; eventueel een tijdelijke melding, niet permanent alarm na sluiten | Bestaande Flow gebruikt timeout en telt grote ramen. Voor actuele open ramen: contacten rechtstreeks lezen. |
| Regen terwijl deuren open zijn | Regen-event + voor-/achterdeurcontacten | Gebeurtenismelding; actuele deurstatus afzonderlijk tonen | Flow wacht 30 seconden en gebruikt 30-minutentimeout. Geen blijvende alarmstatus afleiden uit de timeout. |
| Rook-/CV-/overige veiligheidsalarmen | Nog te koppelen Homey-bronnen | Nog niet opnemen in eerste matrix tot bron en semantiek zijn bevestigd | In Flow-lijst genoemd, detailmapping nog niet compleet. |

### Prioriteitsvoorstel
- **Kritiek:** waterlekkage; CO2-status 2; bevestigde zeer hoge vriezertemperatuur.
- **Waarschuwing:** CO2-status 1; vriezer waarschuwingsgrens; deur/raam in combinatie met regen of relevante klimaatconditie.
- **Informatief:** normale open/dicht-statussen en afgeronde huishoudelijke cycli.

Prioriteiten zijn een voorstel voor de presentatie, niet een wijziging van Homey-logica.

## 3. Voorstel B – live-statussen

| Onderdeel | Homey-bron | Voorgestelde tegel/status | Opmerkingen |
|---|---|---|---|
| Voordeur, achterdeur, tuinhuisdeur | `alarm_contact` | Open/dicht | Rechtstreeks uitlezen; combineer niet met de temperatuurmelding in dezelfde status. |
| Ramen | Afzonderlijke `alarm_contact`-capabilities | Aantal open + eventueel namen/lijst | Beter dan `ramen_telRamenOpenReden`, want die variabele bewaart slechts één laatst verwerkte raamnaam. Fysieke mapping Bram/Tess nog bevestigen. |
| Wasmachine | `wasmachine_draait` + `measure_power` | Draait / niet actief, eventueel vermogen | Boolean wordt door Flow onderhouden. Start >120 W, stop <2 W na countdown. Toon bronafhankelijkheid in implementatie. |
| Wasdroger | `localthings_machine_state`, `localthings_cycle_active`, `localthings_progress`, `localthings_remaining_minutes` | Draait / klaar / resterende tijd indien waarden gevalideerd | State-waarden en eindtijdmapping nog valideren. |
| Truus | `measure_work_status`, `measure_docked`, `measure_battery` | Werkstatus + dockstatus + batterijpercentage | Gescheiden gegevens. Momentopname: Sleeping, gedockt, 100%. |
| CO2 woonkamer | `measure_co2` | Actuele ppm-waarde | Numerieke meting rechtstreeks uit sensor. |
| Vriezers | `measure_temperature` per bevestigd apparaat | Actuele temperatuur per vriezer | Keukenbron en gedeelde alarmvariabele eerst verifiëren. |
| Weer | Weer-device: temperatuur, gevoelstemperatuur, `measure_rain`, conditioncode, wind | Compact weerblok | Neerslagkans is niet beschikbaar in de geïnventariseerde Homey-state. |
| Airco keuken/zolder | `thermostat_mode`, `onoff`, `target_temperature` | Aan/uit, modus, doeltemperatuur | Logic `aircoZolder_aan` niet als waarheid gebruiken zonder reconciliatie; device-modus was eerder off. |
| Remeha | `boiler_state`, `DHW_state`, `DHW_mode` | Alleen tonen na statuscode-mapping | Betekenis van statuscodes nog niet bevestigd. |
| Lampen Sem/Bram/tuinhuis | `onoff` | Aan/uit indien relevant | Slaap-/schema-condities niet aan Homey-bron gekoppeld. |
| Muurtablet | `measure_battery` | Alleen in systeem-/instellingenstatus | Momentopname 100%; niet prominent op hoofdscherm nodig. |

## 4. Voorstel C – gebeurtenismeldingen

Deze gebeurtenissen kunnen als korte melding verschijnen, maar mogen niet zonder aanvullende actuele status als blijvend alarm worden getoond:

- Regen begint terwijl ramen of deuren open zijn.
- Wasmachine start en is klaar.
- Droger start, status verandert of cyclus eindigt.
- Truus meldt voldoende accu of accu boven 50%.
- Truus rondt een schoonmaakcyclus af.
- CO2 herstelt onder de Homey-resetgrens.
- Vriezer herstelt onder de ingestelde herstelgrens.

**Voorgestelde UX:** toon een melding kort en/of in een compacte meldingenlijst met tijdstip. De actuele status blijft apart zichtbaar. De precieze bewaartermijn en het aantal zichtbare meldingen worden in de UI-fase bepaald.

## 5. Nog niet veilig te implementeren

| Onderwerp | Wat ontbreekt | Benodigde vervolgstap |
|---|---|---|
| CO2-drempel | HA >1200 ppm versus Homey >1000 / >2000 / reset <990 | Gebruikersbesluit: HA-gedrag behouden of huidige Homey-niveaus volgen. |
| Keuken-vriezer | Device-ID `64fc846e-01b0-438a-9114-4498ea8005e7` niet definitief aan naam/zone gekoppeld | Device-inventarisatie op exact ID en variabeleproducer controleren. |
| Gedeeld vriezeralarm | Zelfde Logic-ID met labels `Vriezer_tempAlarm` en `tempVriezer_alarm` | Vaststellen of beide vriezers één gedeelde alarmstatus gebruiken. |
| Achterdeur | Homey gebruikt temperatuurverschil en airco-modus; HA gebruikte absolute buitentemperatuurgrenzen | Alleen tonen op basis van de bestaande Homey-Flow-condities, of expliciet ontwerpbesluit over afwijkend gedrag. |
| Voordeur | Variabele `voordeur_melding` en volledige producerende logica niet gevalideerd | Flow-detail en schrijvers van de variabele controleren. |
| Ramen Bram/Tess | Homey-naam versus HA-bronnaam/positie niet bevestigd | Fysieke sensor-mapping bevestigen. |
| Droger | Machine-state-waarden en exacte eindtijdsemantiek niet gevalideerd | Capabilitywaarden documenteren en gebruikersvriendelijke labels mappen. |
| Remeha | Statuscodes niet vertaald | Device-state en bijbehorende documentatie/Flow-voorwaarden analyseren. |
| Weer | Neerslagkans ontbreekt in huidige Homey-state | Bepalen of actuele regen voldoende is of dat aanvullende bron nodig is. |

## 6. Aanbevolen implementatievolgorde

1. **Eerst betrouwbare live-statussen:** deuren/ramen, waterlekkage, Truus, wasmachine, droger, CO2 en temperaturen.
2. **Daarna alarmregels:** CO2, vriezers en deur-/regencombinaties, pas na expliciete mapping.
3. **Daarna gebeurtenismeldingen:** start/klaar, regenwaarschuwingen, Truus-berichten en herstelmeldingen.
4. **Tot slot instellingen en verfijning:** prioriteiten, zichtduur, meldingenlijst en tabletgedrag.

## 7. Besluiten die nog van de gebruiker nodig zijn

De eerste inhoudelijke ontwerpkeuze is de CO2-weergave:
- **Optie A – Homey volgen:** waarschuwing vanaf 1000 ppm, kritisch vanaf 2000 ppm, herstel onder 990 ppm.
- **Optie B – HA-bron behouden:** waarschuwing pas boven 1200 ppm; daarnaast bepalen hoe de Homey-kritieke grens van 2000 ppm wordt gebruikt.

Voor alle overige onzekere mappings geldt: niet gokken; eerst bron en betekenis verifiëren. De dashboardimplementatie blijft read-only richting Homey.
