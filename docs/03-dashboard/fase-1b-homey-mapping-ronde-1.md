# Fase 1B – Homey-mapping ronde 1 (11 november 2026)

## Uitvoering
Op 11 november 2026 is de actuele Homey-inventarisatie opnieuw read-only opgehaald: apparaten, capabilities/states, Logic-variabelen en zones. Er zijn geen Homey-instellingen, apparaten, variabelen of Flows gewijzigd of gestart.

De mapping hieronder is gebaseerd op:
- de bestaande broninventarisatie in `ha-baseline-analyse.md`;
- actuele Homey-apparaatnamen en beschikbare capability/state-velden;
- actuele Logic-variabelen.

Een overeenkomst in naam of capability is nog geen bewijs dat de onderliggende logica semantisch gelijk is. Daarom worden kandidaten niet automatisch als definitief beschouwd.

## Directe capability-kandidaten

| Brononderdeel uit HA-analyse | Homey-kandidaat | Beschikbare capability/state | Status / aandachtspunt |
|---|---|---|---|
| Achterdeur open | Achterdeur | `alarm_contact` | Capability aanwezig; buitentemperatuurconditie apart mappen. |
| Voordeur open | Voordeur | `alarm_contact` | Capability aanwezig. |
| Deur tuinhuis open | Deur tuinhuis | `alarm_contact` | Capability aanwezig. |
| Raam Bram / raam niet open | Onder raam Bram | `alarm_contact` | Kandidaat op naam/ruimte; controleren of dit exact het bronraam is. |
| Raam Tess / raam niet open | Onder raam Tess | `alarm_contact` | Kandidaat op naam/ruimte; bronbenaming en fysieke positie verifiëren. |
| Raam Sem open | Raam Sem | `alarm_contact` | Sterke naamovereenkomst; bronstatus omkeren waar de YAML `off` eist. |
| Dakraam Sem niet open | Dakraam Sem | `alarm_contact` | Sterke naamovereenkomst; weer-, airco- en neerslagcondities ontbreken nog in deze mapping. |
| Ouderslaapkamer onderraam | Ouderslaapkamer onderraam | `alarm_contact` | Sterke naamovereenkomst. Daarnaast bestaat afzonderlijk `Bovenraam ouderslaapkamer`; niet verwisselen. |
| CO2 woonkamer hoog | Multisensor woonkamer | `measure_co2` | Capability aanwezig; actuele waarde bij inventarisatie 410,6. HA-bron gebruikte verschillende entiteiten voor trigger en getoonde waarde; exacte semantiek nog verifiëren. |
| Wasdroger actief/klaar | Samsung wasdroger | `localthings_machine_state`, `localthings_cycle_active`, `localthings_progress`, `localthings_remaining_minutes` | Machinegegevens aanwezig; HA-template voor eindtijd heeft nog geen één-op-één-mapping. |
| Wasmachine staat aan | Wasmachine | `onoff`, `measure_power` | Device aanwezig; HA-bron gebruikte een afgeleide binary sensor. Exacte detectieregel niet bevestigd. |
| Muurtablet batterij | Muur tablet | `measure_battery` | Directe capability aanwezig; actuele waarde 100. De melding blijft binnen scope. |
| Truus werkstatus | Truus | `measure_work_status` | Capability aanwezig; actuele status `Sleeping`. HA-statusuitsluitingen kunnen mogelijk rechtstreeks worden gemodelleerd, maar statuswaarden moeten exact worden vergeleken. |
| Tuinhuislamp | Tuinhuis lamp | `onoff` | Capability aanwezig; HA-eis 'aan gedurende vijf minuten' moet als duurvoorwaarde behouden blijven. |
| Airco keuken | Airco keuken | `thermostat_mode`, `onoff`, `target_temperature` | Capability/state-velden aanwezig. |
| Airco zolder | Airco zolder | `thermostat_mode`, `onoff`, `target_temperature` | Capability/state-velden aanwezig. |
| Verwarming / warm water | Remeha ketel | `boiler_state`, `DHW_state`, `DHW_mode`, statuscodes | Kandidaat; exacte betekenis van HA-afgeleide binary sensors nog bevestigen. |
| Weercondities | Weer | `measure_temperature`, `measure_temperature_feelslike`, `measure_rain`, `conditioncode`, windvelden e.d. | Veel basisvelden aanwezig; neerslagkans en exacte weerstatusmapping nog controleren. |
| Lamp Sem staat aan | Lamp Sem | `onoff` | Lamp-capability aanwezig; schema `slapen_sem` nog niet als Homey-bron bevestigd. |
| Lamp Bram staat aan | Lamp Bram | `onoff` | Lamp-capability aanwezig; schema `slapen_bram` nog niet als Homey-bron bevestigd. |

## Relevante Logic-variabelen gevonden

| Variabele | Type | Actuele waarde | Mogelijke relatie |
|---|---|---:|---|
| `Vriezer_tempAlarm` | boolean | false | Kandidaat voor vriezeralarm; bronconditie/waarde nog verifiëren. |
| `ramen_AantalOpen` | number | 0 | Mogelijk gerelateerd aan raamstatussen; geen vervanging voor afzonderlijke contactcondities zonder bevestiging. |
| `ramen_telRamenOpenReden` | string | Dakraam Sem | Mogelijk gerelateerd aan raamoverzicht; betekenis nog verifiëren. |
| `achterdeur_melding` | string | De verwarming staat aan | Mogelijk gerelateerd aan achterdeurmelding; actuele tekst lijkt niet eenduidig een deurstatus. |
| `achterdeur_tempVerschilBinnenBuiten` | number | 0,2 | Kandidaat voor temperatuurverschil; niet gelijkstellen aan HA-buitentemperatuurdrempel zonder de producerende logica te kennen. |
| `voordeur_melding` | string | Het is erg koud buiten | Mogelijk gerelateerd aan voordeurmelding; betekenis/voorwaarden nog verifiëren. |
| `voordeur_tempVerschilBinnenBuiten` | number | 15,4 | Kandidaat voor temperatuurverschil; niet gelijkstellen aan absolute buitentemperatuur. |
| `wasmachine_draait` | boolean | true | Kandidaat voor wasmachine-status; producerende logica nog controleren. |
| `aircoZolder_aan` | boolean | true | Kandidaat voor zolder-aircostatus; actuele device-modus was `off`, dus de variabele mag niet zonder verificatie als actuele modus worden gebruikt. |
| `eco2_woonkamer_status` | number | 0 | Kandidaat voor CO2-status, maar de actuele multisensor meet 410,6; betekenis en schaal van de variabele onbekend. |
| `keukenTemp_meldingActief` | boolean | false | Temperatuurmelding keuken; buiten de directe mapping van de huidige eerste tranche. |
| `regen_ramenOpenTimout` | boolean | false | Kandidaat voor regen/raam-timeout; relatie met YAML-voorwaarden nog niet vastgesteld. |

De actuele waarden zijn momentopnames op het moment van uitlezen en vormen geen validatie van de volledige logica.

## Nog niet gekoppeld / semantisch onzeker
1. De bron noemt `Grote Tess` bij een contactentiteit en `Raam Tess niet open` bij een andere entiteit. Homey bevat `Onder raam Tess`, maar de exacte fysieke match moet door de gebruiker worden bevestigd.
2. De bron noemt `Grote Bram` en `Raam Bram niet open`; Homey bevat `Onder raam Bram`. Fysieke en functionele relatie nog bevestigen.
3. De YAML-conditie voor `Achterdeur open` gebruikt absolute buitentemperatuur (<18 of >24). De gevonden Logic-variabele `achterdeur_tempVerschilBinnenBuiten` is een temperatuurverschil en is dus niet automatisch equivalent.
4. De YAML gebruikt schema-entiteiten zoals `schedule.boven_ramen_open`, `schedule.slapen_sem` en `schedule.slapen_bram`. Deze zijn in deze ronde niet aan een expliciete Homey-bron gekoppeld.
5. De zonstatus `zon_staat_op_raam_tess` is nog niet gekoppeld. Er is wel een Homey-apparaat `Zon positie` met `measure_numeric`, maar dat bewijst niet dat de specifieke raamzonconditie gelijkwaardig is.
6. De regenwaarschuwing gebruikt neerslagkans; het Homey-apparaat `Weer` biedt actuele neerslag maar in de getoonde state geen expliciete neerslagkans.
7. De YAML-template voor de droger-eindtijd moet apart worden vertaald; de resterende minuten zijn beschikbaar, maar niet noodzakelijk dezelfde betekenis als de HA-completion-time.
8. Vriezer: Homey bevat `Vriezer garage temperatuur` met `measure_temperature` (momentopname -22,6) en Logic `Vriezer_tempAlarm`; de bronkaart heet `Vriezer keuken warm!` en verwijst in de bronanalyse naar een entity met 'koelkast'. Locatie/semantiek eerst bevestigen.
9. De wasmachine Homey-device heeft `onoff` en vermogen; de bron gebruikt een afgeleide HA-binarysensor. De Logic-variabele `wasmachine_draait` bestaat, maar de producerende Flow en definitie zijn niet geverifieerd.
10. Remeha-capabilities `boiler_state` en `DHW_state` zijn aanwezig, maar betekenis/relatie met de twee HA-binary sensors moet nog worden vastgesteld.

## Voorlopige mappingstatus
- Direct beschikbare Homey-capability-kandidaten gevonden voor diverse contacten, CO2, wasdroger, wasmachine, muurtablet-batterij, Truus, tuinhuislamp, airco's, Remeha en weer.
- Geen enkele samengestelde YAML-conditie wordt op basis van alleen deze ronde als volledig gemigreerd of semantisch gevalideerd aangemerkt.
- Alle uitzonderingen en onzekerheden blijven expliciet open; geen bronlogica is aangepast.

## Volgende ronde
1. Homey-Flows read-only inventariseren die de gevonden Logic-variabelen en afgeleide statussen produceren.
2. De bronvoorwaarden per kaart omzetten naar een expliciete condition tree zonder Homey-acties uit te voeren.
3. Alleen de echte semantische verschillen aan de gebruiker voorleggen.
4. Een eerste JSON-schema/voorbeeldregels opstellen nadat de condition tree volledig is afgebakend.
