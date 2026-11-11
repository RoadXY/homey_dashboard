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

Onderstaande lijst volgt de functionele kaarten en voorwaarden uit `ha-baseline-analyse.md`. De Homey-koppeling is een databronmapping, geen overname van de Homey-Flow-notificatie. De expliciete migratiebesluiten in hoofdstuk 9 zijn leidend en kunnen onderdelen hieronder uitsluiten of verfijnen.

| HA-kaart / melding | Oorspronkelijke zichtbaarheid / conditie | Homey-databron of mappingstatus |
|---|---|---|
| Grote Bram | Contactstatus is `on` | **Door gebruiker bevestigd:** Onder raam Bram, `alarm_contact`. |
| Grote Tess | Contactstatus is `on` | **Door gebruiker bevestigd:** Onder raam Tess, `alarm_contact`. |
| Raam Tess niet open | Contact `off`; `schedule.boven_ramen_open` aan; zolder-airco niet cool/unavailable/heat; buitentemperatuur >18 én zon op raam Tess is off | Eigen schema-instantie voor deze melding; zon-op-raamconditie wordt niet gemigreerd. HA-conditie wordt aangepast volgens de expliciete migratiekeuze. |
| Grote Ouders open | Contactstatus is `on` | **Door gebruiker bevestigd:** Ouderslaapkamer onderraam, `alarm_contact`. |
| Raam Sem open | Contactstatus is `on` | **Door gebruiker bevestigd:** Raam Sem, `alarm_contact`. |
| Achterdeur open | Contact `on` én (buitentemperatuur <18 OF >24) | **Door gebruiker bevestigd:** Achterdeur, `alarm_contact`. Behoud daarnaast de HA-absolute buitentemperatuurvoorwaarde; niet vervangen door Homey-temperatuurverschil. |
| Voordeur open | Contactstatus is `on` | **Door gebruiker bevestigd:** Voordeur, `alarm_contact`. |
| Lamp Sem staat aan | `schedule.slapen_sem` aan én lamp aan | Slaap-/schema-afhankelijkheid Sem is expliciet niet migreren; kaart/regel niet overnemen. |
| Lamp Bram staat aan | `schedule.slapen_bram` aan én lamp aan | Slaap-/schema-afhankelijkheid Bram is expliciet niet migreren; kaart/regel niet overnemen. |
| Slaapkamer Bram koud | Temperatuursensor in de kamer <12 °C | Migreren; Homey-bron Temperatuur Bram, `measure_temperature`. |
| Slaapkamer Tess koud | Temperatuursensor in de kamer <12 °C | Migreren; Homey-bron **Thermostaat Tess**, `203a126c-1923-4857-abcb-6a727a133099`, capability `measure_temperature`. |
| Ouderslaapkamer koud | Temperatuursensor in de kamer <12 °C | Migreren; Homey-bron Temperatuur ouderslaapkamer, `measure_temperature`. |
| Zolder koud | Temperatuursensor in de kamer <12 °C | Migreren; Homey-bron **Temperatuur Sem** (slaapkamer Sem), `ba9336e2-f4ed-417c-bba6-3fafb735e61a`, capability `measure_temperature`. |
| Vriezer keuken warm! | `binary_sensor.vriezer_keuken_temperatuur_hoog` is on | **Door gebruiker bevestigd:** Koelkast keuken temperatuur (`64fc846e-01b0-438a-9114-4498ea8005e7`), capability `measure_temperature`. |
| Wasdroger klaar om | Droger machine state is `run`; template toont completion-time als HH:mm | Gebruiker kiest dashboardinformatie: status, voortgang en resterende tijd. Homey-bron: machine state, `localthings_cycle_active`, `localthings_progress`, `localthings_remaining_minutes`; exacte statuswaarden/templatevertaling nog technisch valideren. Geen energiekosten-tegel gevraagd. |
| Wasmachine staat aan | `binary_sensor.wasmachine` is on | **Gebruikerskeuze:** Logic-variabele `wasmachine_draait` (`c21929a1-2693-416b-9240-74b4ca5d96b9`) als statusbron. Deze is Flow-afhankelijk; dashboard leest de variabele uitsluitend read-only. |
| Galaxy A54 | Batterijpercentage <20 OF batterijstatus full | **Niet migreren** op verzoek gebruiker. |
| Telefoon batterij (SM-S721B) | Batterijpercentage <20 OF state-entiteit full | **Niet migreren** op verzoek gebruiker. |
| Pixel 7 Pro | Batterijpercentage <15 OF batterijstatus full | **Niet migreren** op verzoek gebruiker. |
| SM-F966B | Batterijpercentage <15 OF batterijstatus full | **Niet migreren** op verzoek gebruiker. |
| Moto G60S | Batterijpercentage <15 OF batterijstatus full | **Niet migreren** op verzoek gebruiker. |
| Muur tablet | Batterijpercentage <25 | Kandidaat: Muur tablet, `measure_battery`. |
| CO2 woonkamer hoog! | HA-bron: `sensor.eco2` >1200; kaart toont multisensor-CO2 | Homey live `measure_co2`; projectbesluit gebruikt voorlopig Homey-drempels 1000/2000/reset <990. Blockly-configuratie later. |
| Raam Bram niet open | Contact `off`; boven-ramenschema aan; gevoelstemperatuur <18 | Eigen, afzonderlijke schema-instantie voor deze melding. |
| Raam Ouders niet open | Contact `off`; boven-ramenschema aan; gevoelstemperatuur <18 | Eigen, afzonderlijke schema-instantie; initiële planning ma–za 07:00–20:00, zo 08:00–20:00. |
| Dakraam Sem niet open | Contact `off`; boven-ramenschema aan; weerstatus niet in opgegeven regen-/sneeuwlijst; zolder-airco niet cool/heat; neerslag <0,1 | Eigen, afzonderlijke schema-instantie; neerslagbron blijft open/backlog. |
| Airco keuken | Modus niet off en niet unavailable | Airco keuken: `thermostat_mode`, `onoff`, `target_temperature`. |
| Airco zolder | Modus niet off | Airco zolder: `thermostat_mode`, `onoff`, `target_temperature`. |
| Verwarming aan | Remeha verwarmen-binarysensor is on | Gebruiker wil verwarming actief/niet actief tonen; bron `boiler_state` moet nog technisch naar betekenisvolle status worden vertaald. |
| Warm water | Remeha huishoudelijk-warmwater-binarysensor is on | Gebruiker wil warm water actief/niet actief tonen; bron `DHW_state`/`DHW_mode` moet nog technisch naar betekenisvolle status worden vertaald. |
| Bak voorraam voeding! | Conductivity <350; kaart toont aparte voedingssensor | **Niet migreren** op verzoek gebruiker. |
| Bak voorraam water! | Vochtigheid <15 | **Niet migreren** op verzoek gebruiker. |
| Paradijsvogelplant water! | Vochtigheid <15 | **Niet migreren** op verzoek gebruiker. |
| Paradijsvogelplant voeding! | Conductivity <350 | **Niet migreren** op verzoek gebruiker. |
| Kans op neerslag | Neerslagkans >25 | **Migreren – backlog**. Homey-weather state bevat geen expliciete neerslagkans; gebruiker zoekt een app/databron met regenkans. |
| Truus | Werkstatus niet Sleeping, Charging, Unavailable of Standby | Truus: `measure_work_status`; statuswaarden rechtstreeks gebruiken en exacte strings behouden. |
| Truus wil opgehaald worden! | Werkstatus is Standby | Truus: `measure_work_status`; exacte statuswaarde. |
| Tuinhuis lamp | Switch is on gedurende 5 minuten | Tuinhuis lamp `onoff`; duurvoorwaarde van 5 minuten behouden. |
| Wateralarm wasmachines! | Watersensorstatus is on | **Door gebruiker bevestigd:** Water Sensor wasmachines, `alarm_water`. |
| Wateralarm vaatwasser! | Watersensorstatus is on | **Door gebruiker bevestigd:** Water sensor vaatwasser, `alarm_water`. |
| Deur tuinhuis open! | Contactstatus is on | **Door gebruiker bevestigd:** Deur tuinhuis, `alarm_contact`. |

De twee mediaspelerkaarten uit de HA-YAML zijn in de eerdere projectbesluiten uitgesloten van de nieuwe dashboardweergave; deze keuze blijft apart van de meldingenmatrix.

## 4. Live-statussen naast de meldingen

Deze gegevens kunnen als compacte status of waarde worden getoond, ook wanneer er geen conditionele melding actief is:

| Onderdeel | Homey-bron | Gebruik |
|---|---|---|
| Woonkamer- en keukentemperatuur | Reeds gemapte sensoren/Logic-waarde | Temperatuurtegels op hoofddashboard. |
| Bram, Tess, ouders, zolder | Temperatuurcapabilities na mapping | Waarde tonen wanneer bijbehorende HA-kaart actief is. |
| Weer | Weer-device: temperatuur, gevoelstemperatuur, actuele regen, conditie, wind | Weerkaart; neerslagkans blijft backlog. |
| Deuren en ramen | Individuele `alarm_contact` | Actuele open/dichtstatus, gebruikt voor HA-condities. |
| Wasmachine | Logic-status | Gebruik `wasmachine_draait` als gekozen statusbron; alleen read-only uitlezen. |
| Droger | Machine state, cycle active, progress, remaining minutes | Toon status, voortgang en resterende tijd; mapping van statuswaarden blijft technische validatie. |
| Truus | `measure_work_status`, `measure_docked`, `measure_battery` | Werkstatus, dockstatus en accupercentage afzonderlijk. |
| Airco's | `thermostat_mode`, `onoff`, `target_temperature` | Actuele modus en doeltemperatuur. |
| Remeha | `boiler_state`, `DHW_state`, `DHW_mode` | Toon verwarming en warm water actief/niet actief nadat de statuscodes zijn vertaald. |

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
- Configureerbare schema-/tijdvensterbouwstenen; elke melding krijgt een eigen schema-instantie, met gedeelde evaluatiecode.

De CO2-waarden 1000/2000/990 zijn dus initiële configuratiewaarden, geen hard gecodeerde onwijzigbare productkeuze. De temperatuurdrempel van 12 °C is eveneens een expliciet gekozen beginregel en moet later configureerbaar blijven.

## 7. Openstaande bronmappings

1. Neerslagkans >25: blijft op de backlog totdat een geschikte app/databron beschikbaar is.
2. Droger: de betekenis van de machine-state-waarden en de vertaling van de HA-completion-time-template technisch valideren.
3. Remeha: `boiler_state`, `DHW_state` en `DHW_mode` vertalen naar verwarming actief/niet actief en warm water actief/niet actief.

De volgende onderdelen zijn door de gebruiker expliciet uitgesloten en gelden dus niet meer als open migratiemapping: plantensensoren, vijf telefoonbatterijen, zon op raam Tess, schema slapen Sem en schema slapen Bram.

## 8. Volgende stap

Valideer de resterende droger- en Remeha-statusmapping. De keuken-vriezerbron en wasmachine-statusbron zijn door de gebruiker gekozen/bevestigd. De vier afzonderlijke bovenramenschema's zijn vastgelegd. Neerslagkans blijft op de backlog totdat een passende databron is gekozen. Daarna kan het regelmodel de gemigreerde HA-condition trees representeren en configureerbaar maken.

## 9. Gebruikersbesluiten – migratievragenlijst

De volgende keuzes zijn expliciet door de gebruiker ingediend. Ze zijn leidend voor ontwerp en implementatie; niet-gemigreerde onderdelen blijven alleen in de historische HA-referentie staan.

| Onderdeel | Besluit | Opmerking / uitwerking |
|---|---|---|
| Bak voorraam – voedingswaarde | Niet migreren | Geen |
| Bak voorraam – vochtigheid | Niet migreren | Geen |
| Paradijsvogelplant – vochtigheid | Niet migreren | Geen |
| Paradijsvogelplant – voedingswaarde | Niet migreren | Geen |
| Galaxy A54 | Niet migreren | Geen |
| SM-S721B | Niet migreren | Geen |
| Pixel 7 Pro | Niet migreren | Geen |
| SM-F966B | Niet migreren | Geen |
| Moto G60S | Niet migreren | Geen |
| Slaapkamer Bram koud | Migreren | Kamertemperatuursensor lager dan 12 °C |
| Slaapkamer Tess koud | Migreren | Kamertemperatuursensor lager dan 12 °C |
| Ouderslaapkamer koud | Migreren | Kamertemperatuursensor lager dan 12 °C |
| Zolder koud | Migreren | Kamertemperatuursensor lager dan 12 °C |
| Kans op neerslag | Migreren – backlog | Gebruiker zoekt een app die regenkans levert |
| Zon op raam Tess | Niet migreren | Geen |
| Boven ramen open | Migreren | Vier onafhankelijke schema-instanties; ma–za 07:00–20:00 en zo 08:00–20:00. Blockly-bouwsteen is fase 2. |
| Slapen Sem | Niet migreren | Geen |
| Slapen Bram | Niet migreren | Geen |

Onbeantwoorde onderdelen uit de vragenlijst zijn niet ingevuld; deze blijven open en worden niet als migratiebesluit geïnterpreteerd.


## 10. Aanvullende temperatuurbroncontrole en schema-ontwerp

De actuele Homey-apparaatcontrole heeft de volgende kandidaten opgeleverd:
- **Bram:** Temperatuur Bram (`58f20a55-90b3-49cf-9af0-53a40f6e501c`), `measure_temperature`.
- **Ouderslaapkamer:** Temperatuur ouderslaapkamer (`6d68c7ba-411f-47c1-9624-2f61a7006795`), `measure_temperature`.
- **Tess:** de gebruiker heeft **Thermostaat Tess** (`203a126c-1923-4857-abcb-6a727a133099`) bevestigd als bron; gebruik `measure_temperature`. Radiator Tess is niet geselecteerd.
- **Zolder:** Airco zolder (`746e2538-bf25-45b0-8e98-3e0100bff811`), Rookmelder zolder (`480cee53-22da-47e0-a9bd-6a64c9b11c40`) en CO Sensor (`6f1b28a0-0641-42d7-8f30-e6d8293c0b34`) leveren alle drie `measure_temperature`. Juiste kamersensor nog te bevestigen.

De vier regels blijven inhoudelijk gelijk: toon de melding als de bedoelde kamertemperatuur **lager dan 12 °C** is. De temperatuurbronnen voor Tess en slaapkamer Sem zijn door de gebruiker bevestigd.

Het functionele ontwerp van de Blockly-tijdschema's staat apart in `blockly-bouwsteen-tijdschema.md`. De vier onafhankelijke schema-instanties voor de raam-meldingen zijn bevestigd: maandag t/m zaterdag 07:00–20:00 en zondag 08:00–20:00.


### 10.1 Gebruikersbevestiging Tess
Thermostaat Tess (`203a126c-1923-4857-abcb-6a727a133099`) is de gekozen bron voor “Slaapkamer Tess koud”. De dashboardregel blijft **temperatuur <12 °C**.


### 10.2 Gebruikersbevestiging zolder / slaapkamer Sem
Voor de melding “Zolder koud” gebruiken we de temperatuursensor op slaapkamer Sem: **Temperatuur Sem** (`ba9336e2-f4ed-417c-bba6-3fafb735e61a`). De regel blijft **temperatuur <12 °C**.


### 10.3 Opschoning openstaande mappinglijst
De temperatuurbronnen voor Tess en slaapkamer Sem zijn nu bevestigd. De oude voorlopige vermeldingen in de oorspronkelijke meldingenmatrix zijn bijgewerkt. Ze staan niet langer op de openstaande mappinglijst. De resterende mappingvragen zijn neerslagkans, droger en Remeha. Keuken-vriezer en wasmachinebron zijn inmiddels door de gebruiker gekozen/bevestigd.


### 10.4 Gebruikersbesluit – schema's per melding

De gebruiker heeft verduidelijkt dat de planning niet als één gedeeld schema door vier meldingen moet worden gebruikt. We nemen de planning **vier keer afzonderlijk** over: één zelfstandige schema-instantie per raam-melding:
- Raam Tess niet open
- Raam Bram niet open
- Raam Ouders niet open
- Dakraam Sem niet open

Alle vier krijgen bij de migratie dezelfde beginconfiguratie uit Home Assistant:
- Maandag t/m zaterdag: 07:00–20:00
- Zondag: 08:00–20:00

De vier instanties blijven daarna onafhankelijk wijzigbaar. Dit maakt het later eenvoudiger om per melding een eigen schema naar Blockly te importeren en aan te passen. De implementatie mag één gedeelde technische evaluator gebruiken; dat betekent nadrukkelijk niet dat de vier meldingen één gedeelde schema-configuratie gebruiken.


## 11. Gebruikersbesluiten – inventarisatieronde 3 (11 november 2026)

De gebruiker heeft de volgende keuzes bevestigd. Deze besluiten zijn leidend voor de verdere mapping en implementatie.

| Onderdeel | Gebruikersantwoord | Vastgelegde uitwerking |
|---|---|---|
| Keuken-vriezer | Bevestigen | Koelkast keuken temperatuur (`64fc846e-01b0-438a-9114-4498ea8005e7`, `measure_temperature`) is de juiste Homey-bron voor “Vriezer keuken warm!”. De semantische koppeling is door de gebruiker bevestigd. |
| Wasdroger | Status, resterende tijd, voortgang | Dashboard toont de actuele status, resterende tijd en voortgang. Geen energie-/kostentegel gevraagd. |
| Remeha | Verwarming, warm water | Dashboard toont verwarming actief/niet actief en warm water actief/niet actief. De technische statuscodevertaling moet nog worden gevalideerd. |
| Wasmachine | Logic | Gebruik Logic-variabele `wasmachine_draait` (`c21929a1-2693-416b-9240-74b4ca5d96b9`) als gekozen statusbron. Alleen read-only uitlezen; geen Flow of variabele aanpassen. |
| Neerslagkans | Backlog | Blijft op de backlog totdat een geschikte bron/app beschikbaar is. |

Er zijn geen aanvullende opmerkingen meegegeven.

### 11.1 Resterende technische verificatie

- **Droger:** de gekozen weergave is status, voortgang en resterende tijd. Valideer de ruwe machine-state-waarden en hoe de oorspronkelijke HA-template voor de eindtijd kan worden vertaald. De Homey-capabilities `localthings_machine_state`, `localthings_cycle_active`, `localthings_progress` en `localthings_remaining_minutes` zijn de kandidaten.
- **Remeha:** valideer de ruwe waarden van `boiler_state`, `DHW_state` en `DHW_mode` om de twee gekozen booleaanse statussen correct af te leiden.
- **Wasmachine:** `wasmachine_draait` is de gekozen bron. Documenteer dat dit een Flow-onderhouden Logic-variabele is; de dashboardapp leest deze alleen en neemt de Flow-logica niet over.

### 11.2 Technische statuscontrole Remeha – 11 november 2026

Read-only momentopname van Homey-apparaat **Remeha ketel** (ed9e603f-0930-4a37-8282-86298c6ecf56):

| Capability | Waarde bij uitlezen |
|---|---:|
| boiler_state | false |
| DHW_state | false |
| DHW_mode | off |
| boiler_status_code | 0 |
| boiler_error_code | 255 |
| modulation_level | 0 |
| measure_temperature.boiler | 21.9 °C |
| measure_temperature.return | 21.4 °C |

De snapshot is consistent met geen actieve verwarmingsvraag en geen actieve warmwatervraag op dat meetmoment (boiler_state=false, DHW_state=false, DHW_mode=off). De ruwe statuscode 0 en foutcode 255 zijn nog niet semantisch gedecodeerd en worden niet als fout of normale status geïnterpreteerd zonder aanvullende broninformatie. Voor de dashboardindicatoren gebruiken we primair de booleans boiler_state en DHW_state; DHW_mode kan als aanvullende context dienen. Een momentopname bewijst nog niet alle mogelijke toestanden.


## 12. Fase 1-besluit – apparaatdiagnose en betrouwbaarheid van dashboardmeldingen (11 november 2026)

<badge color="success">Opgenomen in fase 1</badge>

**Besluit:** de gebruiker heeft bevestigd dat de apparaatdiagnose onderdeel wordt van fase 1. Dit is dus geen optionele latere uitbreiding. De onderstaande functionele eisen gelden als scope voor fase 1; de technische uitwerking en precieze vormgeving worden tijdens de implementatie verder uitgewerkt.

Het dashboard moet zichtbaar maken wanneer een Homey-apparaat niet bereikbaar is of wanneer een noodzakelijke bronwaarde ontbreekt/verouderd is. Een gebruiker mag een onbepaalbare status niet aanzien voor een normale of inactieve status.

### Hoofddashboard
- Toon een compacte, niet-dominante algemene waarschuwing wanneer één of meer relevante databronnen een probleem hebben.
- Toon daarnaast een waarschuwing/uitroepteken bij de betreffende tegel of melding wanneer die specifieke informatie hierdoor niet betrouwbaar kan worden bepaald.
- Vermeld een aantal aandachtspunten als er meerdere problemen zijn.
- Geen foutstatus tonen op basis van alleen een ontbrekende waarde voordat de oorzaak is vastgesteld; onderscheid apparaat-offline, ontbrekende capability/waarde, verouderde data en tijdelijke verbindingsfout.

### Instellingen – Systeem – Diagnose
Een diagnosepagina geeft per betrokken Homey-apparaat of databron ten minste:
- apparaatnaam en Homey-zone;
- bereikbaarheid/verbindingsstatus, voor zover Homey die betrouwbaar beschikbaar stelt;
- laatste succesvolle gegevensupdate en ouderdom van de waarde;
- betrokken dashboardtegel, live-status of meldingsregel;
- het concrete gevolg, bijvoorbeeld: “De melding Vriezer keuken warm kan momenteel niet worden bepaald”;
- huidige probleemstatus en herstelstatus.

### Betrouwbaarheids- en evaluatieregels
1. Een ontbrekende, ongeldige of te oude bronwaarde wordt **onbekend/onbeschikbaar**, nooit automatisch false, uit of normaal.
2. Als een melding afhankelijk is van een onbekende waarde, wordt de uitkomst **niet te bepalen** en wordt dit als diagnoseprobleem geregistreerd. De melding mag niet stilzwijgend als inactief worden beschouwd.
3. Wanneer een regel meerdere bronnen gebruikt, moet de diagnose aangeven welke bron(nen) de evaluatie blokkeren.
4. Een waarde geldt alleen als verouderd op basis van een expliciete, per datatype/capability vastgelegde versheidsgrens. Die grenzen zijn nog te ontwerpen; er wordt niet één willekeurige timeout voor alle apparaten gebruikt.
5. Na herstel en een nieuwe geldige meting verdwijnt de actuele waarschuwing automatisch. Een eventueel diagnose-/herstelhistoriek kan afzonderlijk worden bewaard; bewaartermijn nog te bepalen.
6. De diagnosefunctie blijft read-only: geen apparaten, Homey-Flows of Logic-variabelen aanpassen of opnieuw starten.

### Nog technisch te onderzoeken
- Welke online-/availability-informatie de Homey API per apparaat/capability daadwerkelijk levert en hoe betrouwbaar die is.
- Hoe laatste update-tijdstippen en ontbrekende waarden per capability kunnen worden vastgesteld.
- Welke versheidsgrenzen passend zijn voor temperatuur, contactstatus, machine-status, Logic-variabelen en weersinformatie.
- Hoe een apparaatprobleem wordt gekoppeld aan alle dashboardonderdelen en meldingsregels die ervan afhankelijk zijn.

Deze functie wordt in fase 1 gebouwd als generieke betrouwbaarheid-/diagnoselaag naast de bestaande HA-meldingenmatrix. Ze wijzigt de oorspronkelijke HA-condities of de gekozen Homey-bronmappings niet. De diagnosepagina en de waarschuwingen op het hoofddashboard vallen beide binnen de fase-1-scope.


### Meldingenheader – opvallende diagnosewaarschuwing
- In de header/menubalk waar de meldingenstatus wordt getoond, verschijnt een **knipperend rood waarschuwingssignaal** zodra één of meer meldingsregels niet betrouwbaar kunnen worden beoordeeld doordat een vereiste Homey-bron offline is, ontbreekt of verouderde/ongeldige gegevens levert.
- Het signaal is aanklikbaar. Aanklikken opent rechtstreeks **Instellingen → Systeem → Diagnose**.
- Het signaal blijft zichtbaar zolang er ten minste één onopgelost bronprobleem bestaat dat een dashboardmelding blokkeert. Na herstel en een nieuwe geldige meting verdwijnt het automatisch.
- De diagnosepagina maakt expliciet onderscheid tussen een actieve melding en een melding die **niet kan worden beoordeeld**. Een geblokkeerde melding mag niet verdwijnen zonder uitleg.

### Meldingsbeoordeling bij onbeschikbare bronnen
- De evaluatie van meldingsvoorwaarden gebruikt minimaal drie uitkomsten: **waar**, **onwaar** en **onbekend/niet te beoordelen**.
- Als een noodzakelijke bron ontbreekt, offline is of buiten de ingestelde versheidsgrens valt, wordt de betrokken voorwaarde onbekend.
- Een onbekende voorwaarde wordt nooit als onwaar behandeld. De bijbehorende melding wordt niet als normale actieve/inactieve status gepresenteerd; de diagnose toont welke melding hierdoor niet kan verschijnen of betrouwbaar worden beoordeeld.
- Bij samengestelde AND/OR-voorwaarden wordt onbekend volgens de logische uitkomst verwerkt. Alleen wanneer de totale voorwaarde niet eenduidig waar of onwaar kan worden vastgesteld, krijgt de melding de status niet te beoordelen.
- De diagnose toont per geblokkeerde meldingsregel de ontbrekende bron(nen), het laatst bekende meetmoment en de reden van blokkade.


### Correctie vormgeving diagnose-indicator en toegang instellingen
- De header toont **uitsluitend een rood uitroepteken binnen een cirkel** (geen tekstlabel of knipperende tekst).
- Alleen het pictogram knippert wanneer er één of meer meldingsregels door een onbeschikbare/onbetrouwbare bron niet beoordeeld kunnen worden. De rest van de interface blijft clean en ongewijzigd.
- Het pictogram is aanklikbaar. Na aanklikken wordt eerst de instellingen-PIN gevraagd; pas na correcte invoer wordt **Instellingen → Systeem → Diagnose** geopend.
- De PIN-beveiliging geldt voor iedere route naar de instellingen, dus ook voor deze snelkoppeling vanuit de meldingenheader. Er mag geen alternatieve onbeveiligde route bestaan.
- De eerdere omschrijving van een tekstuele/uitgeschreven rode headerwaarschuwing vervalt en wordt door deze pictogram-only variant vervangen.
- **Fase-indeling PIN:** de bestaande ontwerpdocumentatie die bij dit besluit is gecontroleerd, legt de fase voor de PIN-beveiliging niet expliciet vast. Om de door de gebruiker vereiste toegangsbescherming te waarborgen, valt minimaal het PIN-invoerscherm en de toegangscontrole voor Instellingen binnen fase 1. Uitgebreider PIN-beheer kan alleen naar een latere fase worden verplaatst als dat afzonderlijk wordt besloten.


### 12.1 Gebruikersbesluit – detectiemethode offline apparaten (11 november 2026)

**Keuze gebruiker: optie A – uitsluitend Homey-status.**

Voor fase 1 controleren we de door Homey beschikbaar gestelde apparaat-/verbindingsstatus om vast te stellen of een apparaat offline is. We voeren in fase 1 dus geen aanvullende controle uit op de ouderdom van meetwaarden of het uitblijven van nieuwe gegevens.

De gecombineerde methode (Homey-status plus controle op tijdige nieuwe gegevens; eerder optie C) wordt door de gebruiker expliciet doorgeschoven naar **fase 3**.

**Technische randvoorwaarde:** tijdens de technische validatie moet worden vastgesteld welke apparaatbeschikbaarheidsstatus de gebruikte Homey API daadwerkelijk levert en hoe betrouwbaar die is. Als voor een apparaat geen bruikbare status beschikbaar is, mag het dashboard niet zelf een offline-status verzinnen; dit wordt als beperking/onbekend geregistreerd en aan de gebruiker getoond. Deze beperking mag niet stilzwijgend worden opgelost door alsnog de fase-3-methode toe te passen.

De reeds vastgelegde regel blijft gelden dat een ontbrekende of ongeldige waarde niet als normale/inactieve melding mag worden gepresenteerd. De precieze behandeling van ontbrekende waarden zonder expliciete offline-status wordt in de volgende ontwerpvragen uitgewerkt.


### 12.2 Gebruikersbesluit – ontbrekende apparaatstatus in Homey (11 november 2026)

**Keuze gebruiker: optie D – eerst per apparaat onderzoeken.**

We brengen per relevant Homey-apparaat in kaart of de gebruikte Homey API een expliciete en bruikbare beschikbaarheidsstatus levert. Op basis van die inventarisatie bepalen we hoe de status in het dashboard wordt weergegeven.

Er wordt geen algemene aanname toegepast dat een ontbrekende status gelijkstaat aan offline of online. Ook wordt de fase-3-methode (controle op verouderde of uitblijvende meetwaarden) niet voortijdig ingevoerd.

De uitkomst van de inventarisatie moet per apparaat vastleggen:
- of de API een beschikbaarheidsstatus aanbiedt;
- welke waarde(n) of signalen beschikbaar zijn;
- of de betekenis voldoende duidelijk is om online/offline te tonen;
- hoe het dashboard de situatie weergeeft als de status ontbreekt of niet eenduidig is.


### 12.3 Gebruikersbesluit – reikwijdte inventarisatie beschikbaarheidsstatus (11 november 2026)

**Keuze gebruiker: optie B – uitsluitend apparaten die meldingen aansturen.**

De inventarisatie van expliciete beschikbaarheidsstatussen via de Homey API richt zich in deze ontwerpfase alleen op Homey-apparaten die als bron dienen voor dashboardmeldingen. Apparaten die uitsluitend voor andere dashboardtegels of algemene statusinformatie worden gebruikt, vallen buiten deze inventarisatie.

Per meldingsbron wordt vastgelegd of de API een bruikbare beschikbaarheidsstatus aanbiedt, wat de betekenis daarvan is en hoe ontbrekende of niet-eenduidige statusinformatie wordt behandeld. Er wordt geen ontbrekende status automatisch als online of offline geïnterpreteerd.


### 12.4 Aanvulling gebruiker – beschikbaarheidsstatus via Homey Apps SDK (11 november 2026)

De gebruiker vult de eerdere keuze over de reikwijdte aan: de online/offline-status wordt voorlopig bepaald voor **alle Homey-apparaten die het dashboard gebruikt**, niet uitsluitend voor apparaten die dashboardmeldingen aansturen. Dit vervangt voor de beschikbaarheidsinventarisatie de beperktere reikwijdte uit besluit 12.3.

De gebruiker wijst op de methode `getAvailable()` uit de Homey Apps SDK. Deze retourneert een boolean:
- `true`: Homey markeert het apparaat als beschikbaar.
- `false`: Homey markeert het apparaat als niet beschikbaar.

Voor de technische uitwerking gebruiken we deze methode als bron voor de beschikbaarheidsstatus, voor zover de methode via de gebruikte Homey API/client voor de betreffende apparaten beschikbaar is. We controleren dit in de implementatie en tonen de door Homey geretourneerde status; we leiden geen extra offline-status af uit verouderde meetwaarden. Als de methode voor een apparaat niet beschikbaar is of niet kan worden uitgelezen, registreren en tonen we dat als onbekend/niet vast te stellen.

De eerder gemaakte keuze blijft gelden: controle op uitblijvende of verouderde meetwaarden wordt pas in fase 3 toegevoegd.


### 12.5 Gebruikersbesluit – broninventarisatie voor meldingen (11 november 2026)

**Voorlopige keuze gebruiker: optie B – actuele Homey Flows opnieuw onderzoeken.**

Voor het vaststellen van de apparaten en Logic-variabelen die bij dashboardmeldingen betrokken zijn, onderzoeken we voorlopig de actuele Homey Flows opnieuw. De bestaande meldingenmatrix blijft documentatie en referentie, maar wordt niet zonder controle als actuele werkelijkheid aangenomen.

De inventarisatie is uitsluitend read-only: de gebruiker beheert de Homey Flows; er worden geen Flows, apparaten, variabelen of instellingen gewijzigd. De resultaten worden naast de bestaande meldingenmatrix gelegd en eventuele verschillen worden expliciet gerapporteerd.


### 12.6 Correctie gebruikersbesluit – broninventarisatie voor meldingen (11 november 2026)

**Definitieve keuze gebruiker op vraag 4: optie A – bestaande meldingenmatrix gebruiken.**

Dit besluit vervangt de voorlopige keuze B uit paragraaf 12.5. Voor de koppeling tussen dashboardmeldingen en de bijbehorende Homey-apparaten/Logic-variabelen gebruiken we voorlopig de bestaande meldingenmatrix als uitgangspunt. Er wordt dus niet standaard een volledige herinventarisatie van alle actuele Homey Flows uitgevoerd.

Als tijdens de verdere uitwerking een concrete onduidelijkheid of tegenstrijdigheid naar voren komt, kan die gericht worden gecontroleerd in de betreffende Homey Flow. Dit blijft read-only: er worden geen Homey Flows, apparaten, variabelen of instellingen gewijzigd.


### 12.7 Definitieve verduidelijking – Homey als databron, dashboardlogica intern (11 november 2026)

**Gebruikersbesluit: voor fase 1 nemen we Homey als waarheid voor de actuele apparaatstatus en gegevens. We gebruiken geen Homey Flows voor de logica van het dashboard.**

De architectuur voor fase 1 is:
- Homey Pro 2023 is de bron voor de actuele gegevens en apparaatstatussen die het dashboard uitleest.
- De dashboardapplicatie haalt de benodigde gegevens read-only uit Homey.
- De voorwaarden, vergelijkingen, meldingsregels en statusbeoordelingen voor het dashboard worden intern in onze eigen applicatie uitgevoerd.
- Eenvoudige voorwaarden worden rechtstreeks in de dashboardlogica geïmplementeerd; waar passend moeten deze later ook via Blockly configureerbaar zijn.
- We starten, wijzigen of gebruiken geen Homey Flows om de dashboardlogica uit te voeren. Homey Flows zijn dus geen runtime-afhankelijkheid van de dashboardmeldingen.

Dit verduidelijkt en vervangt de eerdere suggestie in paragraaf 12.6 om bij twijfel gericht Homey Flows te controleren. Voor fase 1 gebruiken we de bestaande meldingenmatrix als functionele referentie, maar we vertalen de benodigde regels naar interne dashboardlogica en baseren de actuele invoer op de gegevens die Homey beschikbaar stelt. We gaan niet standaard Flows inspecteren of herinventariseren.

**Fase 3:** uitgebreidere validatie en diagnose van databronnen, gegevensactualiteit en eventuele bestaande Homey-automatiseringen worden uitgesteld tot fase 3. Ook de combinatie van Homey-beschikbaarheidsstatus en detectie van verouderde/uitblijvende meetwaarden blijft fase 3.

De keuze om `getAvailable()` als Homey-beschikbaarheidsstatus te gebruiken blijft staan, voor zover de gebruikte API/client deze status voor de betreffende apparaten beschikbaar maakt. De status wordt niet afgeleid uit een Homey Flow.


### 12.8 Aanvulling gebruiker – Homey Logic-variabelen zijn toegestane databronnen (11 november 2026)

De gebruiker verduidelijkt dat de dashboardapplicatie in fase 1 **wel Homey Logic-variabelen mag uitlezen en als invoer voor dashboardmeldingen mag gebruiken**.

Afspraken:
- Homey-apparaatgegevens en Homey Logic-variabelen zijn beide toegestane read-only databronnen.
- De dashboardapplicatie leest de actuele waarde van een Logic-variabele uit en voert de bijbehorende meldingsvoorwaarde zelf uit.
- Het is de verantwoordelijkheid van de gebruiker om ervoor te zorgen dat de waarde van een gebruikte Logic-variabele op het juiste moment en op de juiste manier wordt bijgewerkt.
- Het dashboard neemt geen verantwoordelijkheid voor het vullen of wijzigen van Logic-variabelen en voert daarvoor geen Homey Flows uit.
- Een Logic-variabele mag dus afkomstig zijn uit een door de gebruiker beheerde Homey Flow of een andere door de gebruiker ingerichte bron; de dashboardapplicatie blijft uitsluitend lezer.
- Dit is geen afhankelijkheid van Homey Flow-logica in de dashboardapplicatie: de dashboardregel zelf wordt intern uitgevoerd.

Deze afspraak nuanceert de eerdere formulering dat alle benodigde invoer rechtstreeks uit apparaat-capabilities moet komen. Een Logic-variabele is een volwaardige, expliciet toegestane invoerbron wanneer de gebruiker die daarvoor aanwijst.


### 12.9 Gebruikersbesluit – databron en vaste prioriteit per Blockly-melding (11 november 2026)

De gebruiker verduidelijkt dat de keuze tussen een rechtstreekse Homey-apparaatwaarde/capability en een Homey Logic-variabele **niet projectbreed of vooraf per melding wordt vastgelegd**. De gebruiker kiest dit zelf tijdens het bouwen/configureren van een melding in de Blockly-editor.

Daarom moet de Blockly-bouwsteen de gebruiker als databron laten selecteren:
- een relevante waarde/capability van een Homey-apparaat; of
- een bestaande Homey Logic-variabele.

Beide bronnen worden uitsluitend read-only door de dashboardapplicatie uitgelezen. Als de gebruiker een Logic-variabele kiest, is de gebruiker zelf verantwoordelijk voor het vullen en actueel houden van die variabele. De dashboardapplicatie voert geen Homey Flow uit en wijzigt de variabele niet.

**Prioriteit is een vaste eigenschap van iedere afzonderlijke melding.** De prioriteit verandert niet dynamisch op basis van de actuele bronwaarde of de uitkomst van een voorwaarde. Wil de gebruiker bijvoorbeeld zowel een normale als een hoge-prioriteitsmelding, dan maakt de gebruiker twee afzonderlijke meldingen met elk een eigen prioriteit en eigen voorwaarden.

De bronkeuze en de prioriteitsinstelling zijn dus twee afzonderlijke configuraties in Blockly. Voor de CO₂-melding wordt op dit moment geen vaste bronkeuze opgelegd; de gebruiker kiest die bij het aanmaken van de melding.


### 12.10 Aanvulling gebruiker – eerst JSON-meldingen, Blockly pas later (11 november 2026)

**Volgorde van implementatie bevestigd door gebruiker:**

1. Vertaal eerst de bestaande, voor migratie goedgekeurde dashboardmeldingen uit de huidige Home Assistant-YAML naar JSON-configuratiebestanden.
2. Laat de dashboardapplicatie deze JSON-configuratie inlezen.
3. Lees de benodigde apparaatwaarden/capabilities en eventueel door de gebruiker gekozen Homey Logic-variabelen read-only uit Homey.
4. Evalueer de JSON-voorwaarden intern in de dashboardapplicatie en toon de actieve meldingen.
5. Test de meldingen en corrigeer de vertaling totdat het gedrag klopt.
6. Integreer Blockly pas daarna. Blockly wordt een gebruikersinterface om dezelfde JSON-configuratie te lezen, te bewerken en nieuwe meldingen te genereren.

**Belangrijke scope-afbakening:** Blockly is geen voorwaarde voor de eerste werkende meldingen en wordt nu niet geïmplementeerd. Eerst moet de JSON-gedreven meldingenengine functioneren.

De JSON-configuratie is de runtime-configuratiebron voor meldingen. De eerste JSON-bestanden worden opgesteld op basis van de huidige HA-YAML, met inachtneming van de expliciete migratiebesluiten en uitsluitingen in deze documentatie. Home Assistant blijft niet nodig tijdens runtime.

Homey blijft de read-only databron. De dashboardapplicatie voert alle voorwaarden intern uit. Homey Logic-variabelen zijn toegestane invoerbronnen wanneer de configuratie die aanwijst; de gebruiker is verantwoordelijk voor het vullen en actueel houden ervan. Een meldingsprioriteit is statisch per afzonderlijke melding.


### 12.11 Gebruikersbesluit – CO₂-melding testen met handmatig bedienbare Logic-variabele (11 november 2026)

Voor de eerste JSON-proefmelding kiest de gebruiker bewust een Homey Logic-variabele als databron, zodat de melding handmatig aan en uit gezet kan worden zonder de CO₂-waarde in de woonkamer fysiek te hoeven verhogen.

**Voorstel voor een aparte testvariabele:**
- Naam: `dashboard_test_co2_melding`
- Type: boolean (waar/onwaar)
- `true`: de testmelding wordt actief en zichtbaar.
- `false`: de testmelding is niet actief en verdwijnt van het dashboard.

Dit is een afzonderlijke testvariabele en vervangt of beïnvloedt niet de bestaande productievariabele `eco2_woonkamer_status`. De testmelding wordt als test/configuratieproef herkenbaar gehouden en is geen definitieve CO₂-drempelimplementatie.

De gebruiker maakt en bedient de Logic-variabele zelf in Homey. De dashboardapplicatie leest de boolean uitsluitend read-only uit en evalueert de JSON-voorwaarde intern. Er hoeft voor deze proef geen Homey Flow te worden aangemaakt of gewijzigd.

De exacte naam en het type worden als voorstel vastgelegd; vóór de implementatie moet de gebruiker bevestigen dat deze variabele in Homey is aangemaakt of een andere bestaande testvariabele aanwijzen.


### 12.12 Implementatie eerste JSON-proefmelding (11 november 2026)

De eerste CO₂-proefmelding is als JSON-configuratie toegevoegd in `config/notifications/co2-woonkamer-test.json`. De databron is de aparte Homey Logic-boolean `dashboard_test_co2_melding`; `true` activeert de testwaarschuwing en `false` maakt deze inactief. De bestaande productievariabele en fysieke CO₂-sensor worden niet gebruikt voor deze proef.

De server leest JSON-configuraties uit `config/notifications/`, haalt de genoemde Logic-variabelen read-only op en evalueert de booleanvoorwaarde intern. De nieuwe endpoint is `GET /api/notifications`. De frontend toont actieve meldingen en toont bij ontbrekende, ongeldige of onbereikbare bron een onbekende status; onbekend wordt niet gelijkgesteld aan onwaar.

De eerste evaluator ondersteunt bewust alleen de boolean-gelijkheidsvoorwaarde die nodig is voor deze proef. Numerieke vergelijkingen en volledige HA-condition trees volgen pas in vervolgstappen. De implementatie en handmatige testprocedure staan in [JSON-meldingenproef CO₂](json-meldingen-proef-co2.md). De Docker-build en runtime-test op de Ubuntu-server moeten nog worden uitgevoerd.


### 12.13 Gebruikerscorrectie – temperatuurdrempel slaapkamers (11 november 2026)

De gebruiker heeft de eerder vastgelegde temperatuurdrempel van **16 °C** gecorrigeerd naar **12 °C**. Voor alle vier de meldingen geldt voortaan strikt **lager dan 12 °C**:
- Slaapkamer Bram – Temperatuur Bram.
- Slaapkamer Tess – Thermostaat Tess.
- Ouderslaapkamer – Temperatuur ouderslaapkamer.
- Zolder – Temperatuur Sem (slaapkamer Sem).

De grens is exclusief: exact 12,0 °C activeert de melding niet; waarden onder 12,0 °C wel. Deze correctie vervangt de eerdere 16 °C-vermelding in deze meldingenmatrix.


## 12. Gebruikersbevestiging – wateralarmen en deur-/raamcontacten (11 november 2026)

De gebruiker heeft de volgende Homey-apparaatkoppelingen expliciet bevestigd. De apparaatnaam en capability zijn bevestigd; exacte apparaat-ID's zijn in deze inventarisatiestap niet vastgelegd.

| Homey-apparaat | Capability | Bijbehorende dashboardkaart(en) | Mappingstatus |
|---|---|---|---|
| Water Sensor wasmachines | `alarm_water` | Wateralarm wasmachines! | Bevestigd door gebruiker |
| Water sensor vaatwasser | `alarm_water` | Wateralarm vaatwasser! | Bevestigd door gebruiker |
| Deur tuinhuis | `alarm_contact` | Deur tuinhuis open! | Bevestigd door gebruiker |
| Voordeur | `alarm_contact` | Voordeur open | Bevestigd door gebruiker |
| Achterdeur | `alarm_contact` | Achterdeur open | Bevestigd door gebruiker |
| Onder raam Bram | `alarm_contact` | Grote Bram; Raam Bram niet open | Bevestigd door gebruiker |
| Onder raam Tess | `alarm_contact` | Grote Tess; Raam Tess niet open | Bevestigd door gebruiker |
| Ouderslaapkamer onderraam | `alarm_contact` | Grote Ouders open; Raam Ouders niet open | Bevestigd door gebruiker |
| Raam Sem | `alarm_contact` | Raam Sem open | Bevestigd door gebruiker |

De gebruiker heeft geen aanvullende opmerkingen of correcties meegegeven. De oorspronkelijke zichtbaarheidvoorwaarden uit de HA-referentie blijven ongewijzigd; deze bevestiging valideert uitsluitend de Homey-bron/device-capability-koppelingen. Er worden geen Homey-apparaten of instellingen aangepast.

**Nog niet bevestigd in deze stap:** exacte Homey-apparaat-ID's, de verdere samengestelde voorwaarden van de raam-/deurmeldingen en de uiteindelijke JSON-configuraties. De achterdeurmelding behoudt dus nadrukkelijk de oorspronkelijke extra voorwaarde: deur open én (buitentemperatuur <18 °C óf >24 °C).


### 12.1 Gebruikersbesluit – activeringsmoment wateralarmen (11 november 2026)

Voor beide wateralarmmeldingen kiest de gebruiker voor **directe weergave** zodra de Homey-capability `alarm_water` actief wordt. Er wordt geen extra vertraging of duurvoorwaarde toegevoegd. De oorspronkelijke voorwaarde `state is on` blijft behouden.


## Compatibiliteit toekomstige Blockly-editor – randvoorwaarde voor alle nieuwe meldingen (11 november 2026)

De gebruiker benadrukt dat de huidige JSON-meldingen vanaf het begin compatibel moeten worden ontworpen met de toekomstige Blockly-editor.

Daarom gelden voor alle volgende meldingen en uitbreidingen de volgende technische randvoorwaarden:
- JSON blijft de versiebeheerde, centrale representatie van iedere melding en voorwaarde; Blockly wordt later een editor/visualisatie van dit model en introduceert geen tweede, afwijkende runtime-logica.
- Voorwaarden worden opgeslagen als een generieke, versieerbare condition tree/AST met expliciete operatoren, operands en bronverwijzingen. Ook eenvoudige voorwaarden worden in diezelfde structuur vastgelegd, zodat ze later met AND/OR, state-is/state-is-not, vergelijkingen, tijdschema's en duurvoorwaarden gecombineerd kunnen worden.
- Bronselectie (Homey-apparaat-capability of Logic-variabele), meldingmetadata (titel, tekst, severity, ingeschakeld) en voorwaardestructuur blijven logisch gescheiden.
- Blockly moet bestaande JSON-regels zonder informatieverlies kunnen inlezen, weergeven, bewerken en opnieuw opslaan. Onbekende of nog niet ondersteunde operatoren mogen niet stilzwijgend worden verwijderd of vereenvoudigd.
- Evaluatie van JSON en evaluatie na Blockly-bewerking gebruiken dezelfde backend-evaluator. Blockly genereert/bewerkt configuratie; het voert geen aparte conditielogica uit.
- Nieuwe configuraties krijgen schema-versiebeheer en validatie. Migraties naar een nieuw schema moeten expliciet en reproduceerbaar zijn.

**Belangrijke huidige beperking:** de eerste evaluator is nog een proefimplementatie met een platte enkele voorwaarde (equals/lessThan/greaterThan); device-capability-bronnen zijn daarin momenteel alleen numeriek getypeerd. Dit is nog niet het definitieve Blockly-geschikte model. Voordat de volgende meldingen daadwerkelijk worden geïmplementeerd, wordt het JSON-schema/evaluatiemodel uitgebreid naar de generieke condition tree, inclusief boolean device-capabilities en samengestelde AND/OR-groepen. De bestaande CO₂- en temperatuurconfiguraties moeten daarbij gecontroleerd en zo nodig migratiegewijs omgezet worden, zonder gedragsverandering.


### 12.2 Gebruikersbesluit – deur- en raamcontactmeldingen direct tonen (11 november 2026)

De gebruiker kiest voor de eenvoudige deur- en raamcontactmeldingen voor **directe weergave zodra het contact opent**. Er wordt voor deze meldingen geen aanvullende wachttijd of minimale open-duur toegevoegd. Dit besluit geldt voor:
- Voordeur open.
- Deur tuinhuis open!.
- Grote Bram.
- Grote Tess.
- Grote Ouders open.
- Raam Sem open.

Er zijn geen aanvullende opmerkingen of uitzonderingen meegegeven. De bevestigde Homey-bron voor deze contacten blijft de bijbehorende `alarm_contact`-capability; de dashboardapplicatie leest deze read-only uit.

**Afbakening:** dit besluit wijzigt de samengestelde voorwaarde van **Achterdeur open** niet: daarvoor blijft gelden contact open én (buitentemperatuur <18 °C óf >24 °C). Ook de vier afzonderlijke meldingen over ramen die niet open zijn, behouden hun eigen contact-, schema- en overige voorwaarden; die worden niet door dit besluit vervangen.


### 12.3 Gebruikersbesluit – vriezerregel ongewijzigd overnemen (11 november 2026)

Voor **Vriezer keuken warm!** kiest de gebruiker ervoor de oorspronkelijke Home Assistant-voorwaarde ongewijzigd aan te houden. De precieze temperatuurgrens/onderliggende definitie van `binary_sensor.vriezer_keuken_temperatuur_hoog` moet eerst in de oorspronkelijke Home Assistant-configuratie worden achterhaald. Er wordt nu geen nieuwe of veronderstelde drempelwaarde ingevuld.

De gekozen Homey-bron blijft **Koelkast keuken temperatuur**, capability `measure_temperature` (apparaat-ID `64fc846e-01b0-438a-9114-4498ea8005e7`). Zodra de oorspronkelijke grens is vastgesteld, vertalen we de HA-regel één-op-één naar deze Homey-temperatuurbron. Er zijn geen aanvullende opmerkingen meegegeven.


### 12.4 Gebruikersbevestiging – type wasmachine-Logic-variabele (11 november 2026)

De gebruiker bevestigt dat de Logic-variabele **`wasmachine_draait`** (`c21929a1-2693-416b-9240-74b4ca5d96b9`) het type **Ja/Nee (boolean)** heeft. Deze variabele is de gekozen statusbron voor **Wasmachine staat aan**. Het dashboard leest de variabele uitsluitend read-only uit; de bestaande Homey-Flow/logica die de variabele beheert blijft ongewijzigd. De statusvoorwaarde is boolean `true` voor draaiend en `false` voor niet draaiend. Onbekende of niet-beschikbare waarden blijven een afzonderlijke onbekende status en worden niet als `false` geïnterpreteerd.


### 12.5 Gebruikersbesluit – severity vriezer (11 november 2026)

De gebruiker kiest voor **critical (kritiek)** als vast meldingsniveau voor **Vriezer keuken warm!**. Er zijn geen aanvullende opmerkingen meegegeven. De severity is metadata van de melding en staat los van de nog te achterhalen oorspronkelijke temperatuurvoorwaarde; deze keuze legt dus geen temperatuurdrempel vast.


### 12.6 Gebruikersbesluit – severity wasmachine (11 november 2026)

De gebruiker kiest voor **info (informatie)** als vast meldingsniveau voor **Wasmachine staat aan**. Er zijn geen aanvullende opmerkingen meegegeven. De statusbron blijft de bevestigde boolean Logic-variabele `wasmachine_draait`; deze keuze wijzigt de read-only bronkoppeling of de onbekend-statusafhandeling niet.
