# Analyse functionele nulmeting – Home Assistant-dashboard

## Bron en reikwijdte
- Bronbestand: `tablet_home_assistant.yml`, aangeleverd door de gebruiker.
- Bestand telt **983 regels** (eerder in projectdocumentatie afgerond als 984).
- Eén view (`Home`), twee secties/kolommen.
- In totaal **55 kaarten**: 4 in de linkersectie en 51 in de rechtersectie.
- De YAML bevat 8 bedieningsknoppen, 2 mediaspelerkaarten, 2 grote temperatuurkaarten, 1 klok, 1 weerkaart en 41 overige tegels/kaarten.
- **43 kaarten hebben een `visibility`-voorwaarde**: de 2 mediaspelers en 41 overige tegels. De zichtbaarheid wordt bepaald door Home Assistant state- en numeric-state-condities, inclusief geneste AND/OR-groepen.
- Dit document is een eerste functionele inventarisatie, geen afgeronde Homey-mapping. Homey-device-ID's en capability-koppelingen moeten nog gericht worden geverifieerd.

## Huidige hoofdindeling uit de YAML
### Linkersectie (4 kaarten)
1. Digitale klok: tijdformaat `HH:mm`, datumformaat `d LLLL y`.
2. Weerkaart op `weather.buienradar`, huidige omstandigheden/details aan; geen forecast, geen hourly forecast.
3. Grote waarde Woonkamer: `sensor.gemiddelde_temperatuur_woonkamer`, afronding op 1 decimaal.
4. Grote waarde Keuken: `sensor.gemiddelde_temperatuur_keuken`, afronding op 1 decimaal.

### Rechtersectie (51 kaarten)
- 8 quick buttons (volgorde hieronder).
- 2 mediaspelers (Sem en Bram), alleen zichtbaar bij status `playing`.
- 41 overige tegels/kaarten voor ramen/deuren, lampen, temperaturen, vriezer, droger/wasmachine, telefoon- en tabletbatterijen, CO2, airco, verwarming/warm water, planten, neerslag, robotstofzuiger, tuinhuislamp en wateralarmen.

## Quick buttons – exacte volgorde en YAML-acties
1. **Q-Music** — entity `scene.beneden_q_music`; tap-action `toggle`.
2. **Q-Music foute uur** — entity `scene.beneden_q_music_foute_uur`; tap-action `toggle`.
3. **Rolluiken open** — entity `scene.rolluiken_allemaal_open`; tap-action `toggle`.
4. **Verjaardag modus** — entity `switch.verjaardagsmodus_verjaardagsmodus_aangezet`; tap-action `switch.toggle`.
5. **Woonkamer licht uit** — entity `scene.woonkamer_licht_uit`; tap-action `toggle`.
6. **Woonkamer sfeer** — entity `scene.sfeer_verlichting`; tap-action `toggle`.
7. **TV Kijken** — entity `scene.tv_kijken`; tap-action `scene.turn_on`.
8. **(geen naam)** — entity `scene.naar_bed`; tap-action `toggle`.

De acht YAML-knoppen komen inhoudelijk overeen met de eerder vastgelegde set. Enkele zichtbare labels wijken licht af van de besluitnotities (bijv. `Rolluiken open`, `Woonkamer licht uit`, `Woonkamer sfeer`, `TV Kijken`); de achtste knop heeft in de YAML geen expliciete `name`. Behoud van bestaande werking staat voorop; definitieve labels worden bij ontwerp/configuratie vastgesteld.

## Mediaspelers
- **Muziek Sem**: `media_player.slaapkamer_sem`; zichtbaar als de status `playing` is.
- **Muziek Bram**: `media_player.bram`; zichtbaar als de status `playing` is.

Beide YAML-kaarten zijn Mushroom media-player-kaarten met een toggle-tapactie. Dit wijkt af van de latere projectbeslissing dat media in het nieuwe dashboard uitsluitend informatief is en geen bediening krijgt. De projectbeslissing geldt voor het nieuwe ontwerp; het verschil met de bron is geregistreerd.

## Conditionele kaarten – bronvoorwaarden
Onderstaande voorwaarden zijn functioneel uit de YAML geïnventariseerd. Meerdere regels in één `visibility`-lijst werken als AND; geneste groepen behouden hun eigen AND/OR-semantiek.

- **Grote Bram** (`binary_sensor.onder_raam_bram_onder_raam_bram_contact_alarm`): sensorstatus is `on`.
- **Grote Tess** (`binary_sensor.onder_raam_tess_onder_raam_tess_contact_alarm`): sensorstatus is `on`.
- **Raam Tess niet open** (`binary_sensor.boven_raam_tess_boven_raam_tess_contact_alarm`): raamstatus is `off` EN `schedule.boven_ramen_open` is `on` EN zolder-airco is niet `cool`, niet `unavailable` en niet `heat` EN (buitentemperatuur > 18 EN `binary_sensor.zon_staat_op_raam_tess` is `off`).
- **Grote Ouders open** (`binary_sensor.ouderslaapkamer_onderraam_ouderslaapkamer_onderraam_contact_alarm`): sensorstatus is `on`.
- **Raam Sem open** (`binary_sensor.raam_sem_raam_sem_contact_alarm`): sensorstatus is `on`.
- **Achterdeur open** (`binary_sensor.achterdeur_achterdeur_contact_alarm`): deurstatus is `on` EN (buitentemperatuur < 18 OF > 24).
- **Voordeur open** (`binary_sensor.voordeur_voordeur_contact_alarm`): sensorstatus is `on`.
- **Lamp Sem staat aan** (`light.lamp_sem_lamp_sem`): `schedule.slapen_sem` is `on` EN lamp is `on`.
- **Lamp Bram staat aan** (`light.lamp_bram_lamp_bram`): `schedule.slapen_bram` is `on` EN lamp is `on`.
- **Slaapkamer Bram koud**: `binary_sensor.temperatuur_bram_laag` is `on`; getoonde waarde komt van `sensor.temperatuur_bram_temperatuur_bram_temperatuur`.
- **Slaapkamer Tess koud**: `binary_sensor.temperatuur_tess_laag` is `on`; getoonde waarde komt van `sensor.temperatuur_tess_temperatuur_tess_temperatuur`.
- **Ouderslaapkamer koud**: `binary_sensor.temperatuur_ouders_laag` is `on`; getoonde waarde komt van `sensor.temperatuur_ouderslaapkamer_temperatuur_ouderslaapkamer_temperatuur`.
- **Zolder koud**: `binary_sensor.temperatuur_zolder_laag` is `on`; kaart verwijst naar `climate.airco_zolder_thermostaat`.
- **Vriezer keuken warm!**: `binary_sensor.vriezer_keuken_temperatuur_hoog` is `on`; getoonde entity-ID bevat `koelkast`.
- **Wasdroger klaar om**: `sensor.droger_dryer_machine_state` is `run`; template toont de completion-time als `HH:mm`.
- **Wasmachine staat aan**: `binary_sensor.wasmachine` is `on`.
- **Galaxy A54**: batterijpercentage < 20 OF batterijstatus is `full`.
- **Telefoon batterij (SM-S721B)**: batterijpercentage < 20 OF de gebruikte state-entiteit is `full`.
- **Pixel 7 Pro**: batterijpercentage < 15 OF batterijstatus is `full`.
- **SM-F966B**: batterijpercentage < 15 OF batterijstatus is `full`.
- **Moto G60S**: batterijpercentage < 15 OF batterijstatus is `full`.
- **Muur tablet**: `sensor.tablet_batterij` < 25.
- **CO2 woonkamer hoog!**: `sensor.eco2` > 1200; kaart toont `sensor.multisensor_woonkamer_eco2`.
- **Raam Bram niet open**: raamstatus is `off` EN `schedule.boven_ramen_open` is `on` EN gevoelstemperatuur < 18.
- **Raam Ouders niet open**: raamstatus is `off` EN `schedule.boven_ramen_open` is `on` EN gevoelstemperatuur < 18.
- **Dakraam Sem niet open**: raamstatus is `off` EN `schedule.boven_ramen_open` is `on` EN weerstatus is niet `pouring`, `lightning-rainy`, `lightning`, `rainy`, `snowy-rainy` of `snowy` EN zolder-airco is niet `cool` of `heat` EN neerslag < 0,1.
- **Airco keuken**: modus is niet `off` EN niet `unavailable`; toont modus en ingestelde temperatuur.
- **Airco zolder**: modus is niet `off`; toont modus en ingestelde temperatuur.
- **Verwarming aan**: `binary_sensor.remeha_ketel_verwarmen` is `on`.
- **Warm water**: `binary_sensor.remeha_ketel_huishoudelijk_warmwater_status` is `on`.
- **Bak voorraam voeding!**: `sensor.plant_sensor_a80b_conductivity` < 350; kaart toont `sensor.gatenplant_keuken_voeding`.
- **Bak voorraam water!**: `sensor.gatenplant_keuken_vochtigheid` < 15.
- **Paradijsvogelplant water!**: `sensor.plant_sensor_a7da_vochtigheid` < 15.
- **Paradijsvogelplant voeding!**: `sensor.plant_sensor_a7da_conductivity` < 350.
- **Kans op neerslag**: `sensor.buienradar_rainchance_1d` > 25.
- **Truus**: werkstatus is niet `Sleeping`, niet `Charging`, niet `Unavailable` en niet `Standby`.
- **Truus wil opgehaald worden!**: werkstatus is `Standby`.
- **Tuinhuis lamp**: switchstatus is `on` gedurende 5 minuten.
- **Wateralarm wasmachines!**: wateralarmstatus is `on`.
- **Wateralarm vaatwasser!**: wateralarmstatus is `on`.
- **Deur tuinhuis open!**: contactstatus is `on`.

## Technische bijzonderheden en aandachtspunten
- De YAML gebruikt zowel `entity` als `entity_id` in voorwaarden; beide vormen moeten bij de parser/import worden ondersteund.
- Er zijn geneste `and`- en `or`-groepen. De geneste AND-groep bij **Raam Tess niet open** combineert buitentemperatuur boven 18 met `zon_staat_op_raam_tess` uit.
- De kaart **Achterdeur open** vereist zowel de deurstatus `on` als een buitentemperatuur lager dan 18 of hoger dan 24.
- **Dakraam Sem niet open** bevat meerdere uitsluitingen op weerstatus, airco-modus en neerslag onder 0,1.
- **Tuinhuis lamp** heeft een state-voorwaarde met een duur van vijf minuten. Tijdsduren moeten dus in het nieuwe regelmodel behouden kunnen blijven.
- De drogerkaart gebruikt een Home Assistant-template om een completion-time als `HH:mm` te tonen. Dit is geen simpele statische sensorweergave en vereist een expliciete vertaling.
- Bij **Bak voorraam voeding!** verschilt de entiteit die de zichtbaarheid triggert (`sensor.plant_sensor_a80b_conductivity`) van de entiteit die de kaart toont (`sensor.gatenplant_keuken_voeding`). Dit verschil niet automatisch corrigeren; eerst Homey-equivalent en bedoelde logica verifiëren.
- Bij **CO2 woonkamer hoog!** toont de kaart `sensor.multisensor_woonkamer_eco2`, maar de zichtbaarheid controleert `sensor.eco2`. Dit moet bij mapping worden gecontroleerd.
- **Vriezer keuken warm!** verwijst als zichtbare entiteit naar een entity-ID met `koelkast`; controleren of dit bewust de vriezerwaarde vertegenwoordigt.
- De zolder-aircokaart sluit `off` uit, maar sluit `unavailable` niet expliciet uit zoals de keukenkaart. Dit verschil behouden totdat anders besloten.
- De YAML gebruikt state strings, numeric thresholds, state-not, arrays van states, templates en `for`-duur. Alle varianten moeten in de migratiechecklist terechtkomen.

## Verschillen met reeds genomen projectbesluiten (niet stilzwijgend oplossen)
1. YAML toont twee kamertemperaturen (Woonkamer en Keuken); projectbesluit staat maximaal vier selecteerbare temperatuurtegels toe.
2. YAML-weerkaart is `weather.buienradar`; projectbesluiten voorzien Homey als voorkeursbron en selectie via instellingen.
3. YAML-mediaspelers zijn bedienbaar via toggle; projectbesluit voor nieuw dashboard is informatief zonder mediabediening.
4. YAML heeft een naamloze knop `scene.naar_bed`; in de eerdere besluiten heet deze `Bedtijd`.
5. YAML heeft 43 conditioneel zichtbare kaarten, waarvan 41 gewone tegels en 2 mediaspelers. Projectregels voor meldingsniveaus (kritiek/waarschuwing/info), sortering en levenscyclus moeten bij het porteren expliciet aan elk item worden toegekend zonder broncondities te wijzigen.

## Nog uit te voeren voor functioneel ontwerp
- Iedere YAML-entity koppelen aan het juiste Homey-apparaat en capability; ontbrekende of afwijkende waarden markeren.
- Per conditionele kaart het Homey-equivalent van alle condities verifiëren, inclusief geneste AND/OR, statusuitsluitingen, numerieke grenzen en duurvoorwaarden.
- Per melding niveau (kritiek/waarschuwing/info), icoon, titel, getoonde waarde/tekst en sorteer-/activeringsgedrag vastleggen. De YAML levert niet voor alle kaarten expliciet deze nieuwe metadata.
- Quick-button-acties één voor één mappen op Homey Flow of directe apparaatbediening; tijdens analyse geen acties uitvoeren.
- Weerbron, temperatuurbronnen en mediaspelers valideren tegen de actuele Homey-inventaris.
- Onoplosbare verschillen apart aan de gebruiker voorleggen; niet zelf aanpassen.
