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
| Grote Bram | Contactstatus is `on` | Kandidaat: Onder raam Bram, `alarm_contact`; fysieke match nog bevestigen. |
| Grote Tess | Contactstatus is `on` | Kandidaat: Onder raam Tess, `alarm_contact`; fysieke match nog bevestigen. |
| Raam Tess niet open | Contact `off`; `schedule.boven_ramen_open` aan; zolder-airco niet cool/unavailable/heat; buitentemperatuur >18 én zon op raam Tess is off | Eigen schema-instantie voor deze melding; zon-op-raamconditie wordt niet gemigreerd. HA-conditie wordt aangepast volgens de expliciete migratiekeuze. |
| Grote Ouders open | Contactstatus is `on` | Kandidaat: Ouderslaapkamer onderraam, `alarm_contact`. |
| Raam Sem open | Contactstatus is `on` | Kandidaat: Raam Sem, `alarm_contact`. |
| Achterdeur open | Contact `on` én (buitentemperatuur <18 OF >24) | Contact en weerwaarde beschikbaar. Behoud de HA-absolute buitentemperatuurvoorwaarde; niet vervangen door Homey-temperatuurverschil. |
| Voordeur open | Contactstatus is `on` | Kandidaat: Voordeur, `alarm_contact`. |
| Lamp Sem staat aan | `schedule.slapen_sem` aan én lamp aan | Slaap-/schema-afhankelijkheid Sem is expliciet niet migreren; kaart/regel niet overnemen. |
| Lamp Bram staat aan | `schedule.slapen_bram` aan én lamp aan | Slaap-/schema-afhankelijkheid Bram is expliciet niet migreren; kaart/regel niet overnemen. |
| Slaapkamer Bram koud | Temperatuursensor in de kamer <16 °C | Migreren; Homey-bron Temperatuur Bram, `measure_temperature`. |
| Slaapkamer Tess koud | Temperatuursensor in de kamer <16 °C | Migreren; Homey-bron **Thermostaat Tess**, `203a126c-1923-4857-abcb-6a727a133099`, capability `measure_temperature`. |
| Ouderslaapkamer koud | Temperatuursensor in de kamer <16 °C | Migreren; Homey-bron Temperatuur ouderslaapkamer, `measure_temperature`. |
| Zolder koud | Temperatuursensor in de kamer <16 °C | Migreren; Homey-bron **Temperatuur Sem** (slaapkamer Sem), `ba9336e2-f4ed-417c-bba6-3fafb735e61a`, capability `measure_temperature`. |
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
| Raam Ouders niet open | Contact `off`; boven-ramenschema aan; gevoelstemperatuur <18 | Bovenramenschema migreren; Blockly-herbruikbaarheid onderzoeken. |
| Dakraam Sem niet open | Contact `off`; boven-ramenschema aan; weerstatus niet in opgegeven regen-/sneeuwlijst; zolder-airco niet cool/heat; neerslag <0,1 | Bovenramenschema migreren; bronwaarden verder mappen. |
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
| Wateralarm wasmachines! | Watersensorstatus is on | Water Sensor wasmachines `alarm_water`; actuele capability beschikbaar. |
| Wateralarm vaatwasser! | Watersensorstatus is on | Water sensor vaatwasser `alarm_water`; actuele capability beschikbaar. |
| Deur tuinhuis open! | Contactstatus is on | Deur tuinhuis `alarm_contact`. |

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

De CO2-waarden 1000/2000/990 zijn dus initiële configuratiewaarden, geen hard gecodeerde onwijzigbare productkeuze. De temperatuurdrempel van 16 °C is eveneens een expliciet gekozen beginregel en moet later configureerbaar blijven.

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
| Slaapkamer Bram koud | Migreren | Kamertemperatuursensor lager dan 16 °C |
| Slaapkamer Tess koud | Migreren | Kamertemperatuursensor lager dan 16 °C |
| Ouderslaapkamer koud | Migreren | Kamertemperatuursensor lager dan 16 °C |
| Zolder koud | Migreren | Kamertemperatuursensor lager dan 16 °C |
| Kans op neerslag | Migreren – backlog | Gebruiker zoekt een app die regenkans levert |
| Zon op raam Tess | Niet migreren | Geen |
| Boven ramen open | Migreren | Onderzoeken of schema reproduceerbaar is en als herbruikbare Blockly-bouwsteen kan dienen |
| Slapen Sem | Niet migreren | Geen |
| Slapen Bram | Niet migreren | Geen |

Onbeantwoorde onderdelen uit de vragenlijst zijn niet ingevuld; deze blijven open en worden niet als migratiebesluit geïnterpreteerd.


## 10. Aanvullende temperatuurbroncontrole en schema-ontwerp

De actuele Homey-apparaatcontrole heeft de volgende kandidaten opgeleverd:
- **Bram:** Temperatuur Bram (`58f20a55-90b3-49cf-9af0-53a40f6e501c`), `measure_temperature`.
- **Ouderslaapkamer:** Temperatuur ouderslaapkamer (`6d68c7ba-411f-47c1-9624-2f61a7006795`), `measure_temperature`.
- **Tess:** de gebruiker heeft **Thermostaat Tess** (`203a126c-1923-4857-abcb-6a727a133099`) bevestigd als bron; gebruik `measure_temperature`. Radiator Tess is niet geselecteerd.
- **Zolder:** Airco zolder (`746e2538-bf25-45b0-8e98-3e0100bff811`), Rookmelder zolder (`480cee53-22da-47e0-a9bd-6a64c9b11c40`) en CO Sensor (`6f1b28a0-0641-42d7-8f30-e6d8293c0b34`) leveren alle drie `measure_temperature`. Juiste kamersensor nog te bevestigen.

De vier regels blijven inhoudelijk gelijk: toon de melding als de bedoelde kamertemperatuur **lager dan 16 °C** is. De temperatuurbronnen voor Tess en slaapkamer Sem zijn door de gebruiker bevestigd.

Het functionele ontwerp van de Blockly-tijdschema's staat apart in `blockly-bouwsteen-tijdschema.md`. De vier onafhankelijke schema-instanties voor de raam-meldingen zijn bevestigd: maandag t/m zaterdag 07:00–20:00 en zondag 08:00–20:00.


### 10.1 Gebruikersbevestiging Tess
Thermostaat Tess (`203a126c-1923-4857-abcb-6a727a133099`) is de gekozen bron voor “Slaapkamer Tess koud”. De dashboardregel blijft **temperatuur <16 °C**.


### 10.2 Gebruikersbevestiging zolder / slaapkamer Sem
Voor de melding “Zolder koud” gebruiken we de temperatuursensor op slaapkamer Sem: **Temperatuur Sem** (`ba9336e2-f4ed-417c-bba6-3fafb735e61a`). De regel blijft **temperatuur <16 °C**.


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
