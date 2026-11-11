# Fase 1B – dashboardmeldingenmatrix en live-statussen

**Status:** functioneel ontwerpvoorstel, gebaseerd op de oorspronkelijke Home Assistant-YAML  
**Project:** Homey Dashboard – Homey Pro 2023  
**Branch:** `phase_1_foundation`  
**Besluit:** CO2 volgt voorlopig de huidige Homey-drempels (optie A). Deze waarden worden configureerbaar in de latere Blockly-regelbewerker.  
**Veiligheidsgrens:** Homey blijft uitsluitend een read-only databron; er worden geen Flows of apparaten bediend.

## 1. Leidende ontwerpkeuze

De meldingen op het dashboard hebben een ander doel dan push- en TTS-meldingen die in Homey-Flows zijn opgenomen.

**Daarom gebruiken we de Home Assistant-dashboardconfiguratie als functionele blauwdruk voor de dashboardmeldingen.** We nemen zo veel mogelijk de oorspronkelijke kaarten, zichtbaarheid, voorwaarden, drempels, combinaties en tijdsduur over. De Homey-Flow-acties (push, Google TTS, SOS, notificatieteksten en meldingslimieten) zijn geen dashboardvereisten en worden niet automatisch overgenomen.

Homey levert de actuele apparaatwaarden en Logic-waarden. De dashboardapplicatie beoordeelt daarmee zelfstandig de overgenomen Home Assistant-voorwaarden. Een Homey-Flow mag alleen als technische bron of als expliciet bevestigde statusbron worden gebruikt wanneer dat nodig is om een waarde te verkrijgen; de Flow-melding zelf bepaalt niet wat op het dashboard verschijnt.

### Ontwerpregels
1. De HA-YAML bepaalt welke dashboardmelding bestaat en onder welke voorwaarden deze zichtbaar wordt.
2. We vertalen de volledige condition tree: AND/OR-groepen, state/state-not, numerieke grenzen, templates en `for`-duur.
3. We vervangen alleen de entiteit/capability door een Homey-bron als de betekenis overeenkomt.
4. Als een bron nog niet betrouwbaar is gekoppeld, markeren we die regel als *mapping open*; we veranderen de HA-voorwaarde niet stilzwijgend.
5. De melding wordt berekend uit de actuele Homey-data. Een oude push- of TTS-melding speelt geen rol in de zichtbaarheid.
6. De gekozen CO2-drempels zijn voorlopig 1000/2000 ppm met herstel onder 990 ppm. Blockly moet deze waarden later instelbaar maken zonder codewijziging.

## 2. CO2-besluit

<badge color="success">Optie A gekozen</badge>

Voor de eerste implementatie volgen we de bestaande Homey-niveaus:
- Waarschuwing vanaf **1000 ppm**.
- Kritiek vanaf **2000 ppm**.
- Herstel wanneer de waarde **onder 990 ppm** komt.

De oorspronkelijke HA-weergave had één zichtbaarheidstrigger boven 1200 ppm. Dit verschil wordt bewust geregistreerd. In de latere Blockly-editor worden minimaal de waarschuwingsgrens, kritieke grens en herstelgrens instelbare parameters. De actuele Homey-Logic-statusvariabele `eco2_woonkamer_status` kan als referentie worden gebruikt, maar de dashboardregel moet primair toetsbaar blijven aan de live CO2-meting en ingestelde drempels.

## 3. Meldingenmatrix – oorspronkelijke Home Assistant-kaarten

Onderstaande lijst volgt de functionele kaarten en voorwaarden uit `ha-baseline-analyse.md`. De Homey-koppeling is een databronmapping, geen overname van de Homey-Flow-notificatie.

| HA-kaart / melding | Oorspronkelijke zichtbaarheid / conditie | Homey-databron of mappingstatus |
|---|---|---|
| Grote Bram | Contactstatus is `on` | Kandidaat: Onder raam Bram, `alarm_contact`; fysieke match nog bevestigen. |
| Grote Tess | Contactstatus is `on` | Kandidaat: Onder raam Tess, `alarm_contact`; fysieke match nog bevestigen. |
| Raam Tess niet open | Contact `off`; `schedule.boven_ramen_open` aan; zolder-airco niet cool/unavailable/heat; buitentemperatuur >18 én zon op raam Tess is off | Raam-, airco- en weerbronnen deels aanwezig; schema en zonconditie nog niet gekoppeld. |
| Grote Ouders open | Contactstatus is `on` | Kandidaat: Ouderslaapkamer onderraam, `alarm_contact`. |
| Raam Sem open | Contactstatus is `on` | Kandidaat: Raam Sem, `alarm_contact`. |
| Achterdeur open | Contact `on` én (buitentemperatuur <18 OF >24) | Contact en weerwaarde beschikbaar. Behoud de HA-absolute buitentemperatuurvoorwaarde; niet vervangen door Homey-temperatuurverschil. |
| Voordeur open | Contactstatus is `on` | Kandidaat: Voordeur, `alarm_contact`. |
| Lamp Sem staat aan | `schedule.slapen_sem` aan én lamp aan | Lamp `onoff` beschikbaar; schema nog niet gekoppeld. |
| Lamp Bram staat aan | `schedule.slapen_bram` aan én lamp aan | Lamp `onoff` beschikbaar; schema nog niet gekoppeld. |
| Slaapkamer Bram koud | `binary_sensor.temperatuur_bram_laag` is on | Temperatuursensor kandidaat aanwezig; exacte bronconditie/threshold nog koppelen. |
| Slaapkamer Tess koud | `binary_sensor.temperatuur_tess_laag` is on | Temperatuursensor kandidaat aanwezig; exacte bronconditie/threshold nog koppelen. |
| Ouderslaapkamer koud | `binary_sensor.temperatuur_ouders_laag` is on | Temperatuurbron nog exact koppelen. |
| Zolder koud | `binary_sensor.temperatuur_zolder_laag` is on; kaart toont zolder-airco | Temperatuur-/aircobronnen aanwezig; lage-temperatuur-binarystatus nog koppelen. |
| Vriezer keuken warm! | `binary_sensor.vriezer_keuken_temperatuur_hoog` is on | Homey-device-ID uit Flow bekend, maar apparaatnaam/zone en relatie met HA-koelkastentity moeten nog bevestigd worden. |
| Wasdroger klaar om | Droger machine state is `run`; template toont completion-time als HH:mm | Droger-capabilities beschikbaar; statewaarde en templatevertaling nog valideren. Behoud de HA-voorwaarde, niet Flow-push. |
| Wasmachine staat aan | `binary_sensor.wasmachine` is on | Kandidaat: `wasmachine_draait` en/of vermogen. Exacte HA-afgeleide status eerst semantisch mappen. |
| Galaxy A54 | Batterijpercentage <20 OF batterijstatus full | Telefoonbron nog niet in Homey-inventarisatie gekoppeld. |
| Telefoon batterij (SM-S721B) | Batterijpercentage <20 OF state-entiteit full | Telefoonbron nog niet in Homey-inventarisatie gekoppeld. |
| Pixel 7 Pro | Batterijpercentage <15 OF batterijstatus full | Telefoonbron nog niet in Homey-inventarisatie gekoppeld. |
| SM-F966B | Batterijpercentage <15 OF batterijstatus full | Telefoonbron nog niet in Homey-inventarisatie gekoppeld. |
| Moto G60S | Batterijpercentage <15 OF batterijstatus full | Telefoonbron nog niet in Homey-inventarisatie gekoppeld. |
| Muur tablet | Batterijpercentage <25 | Kandidaat: Muur tablet, `measure_battery`. |
| CO2 woonkamer hoog! | HA-bron: `sensor.eco2` >1200; kaart toont multisensor-CO2 | Homey live `measure_co2`; projectbesluit gebruikt voorlopig Homey-drempels 1000/2000/reset <990. Blockly-configuratie later. |
| Raam Bram niet open | Contact `off`; boven-ramenschema aan; gevoelstemperatuur <18 | Contact kandidaat aanwezig; schema- en gevoelstemperatuurmapping nog verifiëren. |
| Raam Ouders niet open | Contact `off`; boven-ramenschema aan; gevoelstemperatuur <18 | Contact kandidaat aanwezig; schema- en gevoelstemperatuurmapping nog verifiëren. |
| Dakraam Sem niet open | Contact `off`; boven-ramenschema aan; weerstatus niet in opgegeven regen-/sneeuwlijst; zolder-airco niet cool/heat; neerslag <0,1 | Contact, weer, regen en airco deels beschikbaar; schema- en statusmapping nog verifiëren. |
| Airco keuken | Modus niet off en niet unavailable | Airco keuken: `thermostat_mode`, `onoff`, `target_temperature`. |
| Airco zolder | Modus niet off | Airco zolder: `thermostat_mode`, `onoff`, `target_temperature`. |
| Verwarming aan | Remeha verwarmen-binarysensor is on | Remeha capability aanwezig; betekenis van statuscode nog verifiëren. |
| Warm water | Remeha huishoudelijk-warmwater-binarysensor is on | Remeha capability aanwezig; betekenis van statuscode nog verifiëren. |
| Bak voorraam voeding! | Conductivity <350; kaart toont aparte voedingssensor | Plant-device/capability nog niet in Homey-inventarisatie bevestigd. |
| Bak voorraam water! | Vochtigheid <15 | Plant-device/capability nog niet in Homey-inventarisatie bevestigd. |
| Paradijsvogelplant water! | Vochtigheid <15 | Plant-device/capability nog niet in Homey-inventarisatie bevestigd. |
| Paradijsvogelplant voeding! | Conductivity <350 | Plant-device/capability nog niet in Homey-inventarisatie bevestigd. |
| Kans op neerslag | Neerslagkans >25 | Homey-weather state bevat geen expliciete neerslagkans; aanvullende databron of capability nodig. |
| Truus | Werkstatus niet Sleeping, Charging, Unavailable of Standby | Truus: `measure_work_status`; statuswaarden rechtstreeks gebruiken en exacte strings behouden. |
| Truus wil opgehaald worden! | Werkstatus is Standby | Truus: `measure_work_status`; exacte statuswaarde. |
| Tuinhuis lamp | Switch is on gedurende 5 minuten | Tuinhuis lamp `onoff`; duurvoorwaarde van 5 minuten behouden. |
| Wateralarm wasmachines! | Watersensorstatus is on | Water Sensor wasmachines `alarm_water`; actuele capability beschikbaar. |
| Wateralarm vaatwasser! | Watersensorstatus is on | Vaatwasser-watersensor nog exact koppelen. |
| Deur tuinhuis open! | Contactstatus is on | Deur tuinhuis `alarm_contact`. |

De twee mediaspelerkaarten uit de HA-YAML zijn in de eerdere projectbesluiten uitgesloten van de nieuwe dashboardweergave; deze keuze blijft apart van de meldingenmatrix.

## 4. Live-statussen naast de meldingen

Deze gegevens kunnen als compacte status of waarde worden getoond, ook wanneer er geen conditionele melding actief is:

| Onderdeel | Homey-bron | Gebruik |
|---|---|---|
| Woonkamer- en keukentemperatuur | Reeds gemapte sensoren/Logic-waarde | Temperatuurtegels op hoofddashboard. |
| Bram, Tess, ouders, zolder | Temperatuurcapabilities na mapping | Waarde tonen wanneer bijbehorende HA-kaart actief is. |
| Weer | Weer-device: temperatuur, gevoelstemperatuur, actuele regen, conditie, wind | Weerkaart; neerslagkans blijft apart open. |
| Deuren en ramen | Individuele `alarm_contact` | Actuele open/dichtstatus, gebruikt voor HA-condities. |
| Wasmachine | Live vermogen en/of gemapte status | Alleen als de bronsemantiek overeenkomt met HA-binarysensor. |
| Droger | Machine state, cycle active, progress, remaining minutes | Status en resterende tijd na validatie. |
| Truus | `measure_work_status`, `measure_docked`, `measure_battery` | Werkstatus, dockstatus en accupercentage afzonderlijk. |
| Airco's | `thermostat_mode`, `onoff`, `target_temperature` | Actuele modus en doeltemperatuur. |
| Remeha | `boiler_state`, `DHW_state`, `DHW_mode` | Pas tonen nadat de statuscodes zijn vertaald. |
| Plant sensoren | Nog te koppelen | Meldingen pas activeren na bronmapping. |

## 5. Wat we nadrukkelijk niet overnemen uit Homey-Flows

De volgende Flow-acties zijn bedoeld voor het Homey-notificatie-/spraakgebruik en zijn geen dashboardregels:
- Pushberichten en hun tekst.
- Google TTS-berichten.
- SOS-morseacties.
- Aanwezigheidsafhankelijke pushlogica.
- Flow-timeouts en meldingtellers die alleen dubbele push/TTS-berichten voorkomen.
- Accu-drempelmeldingen van Truus als gebeurtenis.

De dashboardapp berekent de zichtbaarheid op basis van de HA-condities en actuele Homey-data. Alleen als een Flow een statusvariabele produceert die nodig is om een HA-bronwaarde te reconstrueren, onderzoeken we die variabele als databron; we nemen de notificatieactie zelf niet over.

## 6. Blockly-configuratie – later aanpasbaar

De volgende instellingen moeten in de latere Blockly-regelbewerker configureerbaar worden:
- Numerieke grenzen (bijvoorbeeld CO2, temperatuur, vochtigheid, conductivity, batterijpercentage, neerslagkans).
- Vergelijkingen (`<`, `>`, `=`, state-is, state-is-not).
- AND/OR-groepen en geneste voorwaarden.
- Tijdsduren (`for`, bijvoorbeeld tuinhuislamp 5 minuten).
- Weerstatus in/uit een lijst.
- Welke bronwaarde wordt getoond en welke voorwaarde de kaart zichtbaar maakt.
- Meldingstitel, omschrijving, prioriteit en eventueel icoon.

De CO2-waarden 1000/2000/990 zijn dus initiële configuratiewaarden, geen hard gecodeerde onwijzigbare productkeuze.

## 7. Openstaande bronmappings

1. Schema's `schedule.boven_ramen_open`, `schedule.slapen_sem` en `schedule.slapen_bram`.
2. Zonconditie `zon_staat_op_raam_tess`.
3. Fysieke mapping van de Bram-/Tess-raamcontacten.
4. Lage-temperatuur-binarysensoren voor Bram, Tess, ouders en zolder.
5. Keuken-vriezer device-ID en relatie met HA-entity die `koelkast` in de naam heeft.
6. Exacte Homey-statuswaarden voor droger en de HA-completion-time-template.
7. Vaatwasser-wateralarm.
8. Telefoonbatterijen.
9. Plantvochtigheid en conductivity.
10. Neerslagkans >25.
11. Remeha-statuscodevertaling.
12. Exacte semantische bron van de wasmachine-binarysensor.

Deze punten zijn mappingwerk; ze zijn geen reden om de oorspronkelijke HA-condities te vervangen door Flow-notificatiegedrag.

## 8. Volgende stap

Werk de open bronmappings systematisch af vanuit de oorspronkelijke HA-YAML. Daarna maken we een regelmodel dat deze condities exact kan representeren en dat later door Blockly kan worden aangepast. Pas daarna koppelen we de regels aan de dashboardweergave.
