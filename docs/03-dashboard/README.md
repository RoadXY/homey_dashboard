# Dashboardontwerp

## Basislayout
- Donker thema.
- Landscape en responsive voor Samsung Galaxy Tab A SM-T515.
- Kolomverhouding: links 40%, rechts 60%.
- Dashboard zelf staat vast; geen paginascroll.
- Alleen het meldingenpaneel mag verticaal scrollen als er veel meldingen zijn.
- Bij een mislukte quick button-actie verschijnt een algemene foutmelding bovenaan het dashboard.

## Linkerzijde
- Grote klok met tijd in 24-uursnotatie (standaard); tijdnotatie wordt later instelbaar.
- Datum wordt standaard voluit getoond inclusief weekdag en maandnaam; datum- en weekdagpresentatie worden later instelbaar.
- Weer met groot icoon naast buitentemperatuur.
- Weersinformatie bevat gevoelstemperatuur, wind, neerslag, luchtvochtigheid en een korte weersomschrijving.
- Weersomschrijving bestaat uit een weericoon met korte tekst.
- Bij tijdelijk ontbrekende weerinformatie verschijnt een melding dat weerinformatie niet beschikbaar is.
- Maximaal vier door de gebruiker geselecteerde kamertemperaturen, weergegeven als afzonderlijke temperatuurtegels.
- Elke temperatuurtegel toont kamernaam, temperatuur en een klein temperatuur-icoon.
- Temperatuurtegels hebben een neutrale, uniforme stijl zonder kleurcodering op basis van de waarde.
- Bij een offline kamersensor blijft de tegel zichtbaar met de tekst ‘Geen gegevens’.
- Een waarde ouder dan 15 minuten wordt als verouderd beschouwd; alleen bij verouderde waarden wordt het tijdstip van laatste update getoond.

## Rechterzijde
- Quick buttons en meldingen, uitgaande van de bestaande dashboardindeling.
- Alle actieve meldingen blijven beschikbaar in scrollbaar meldingenpaneel.
- Sortering: eerst kritiek, dan waarschuwing, dan info; binnen elk niveau nieuwste activeringstijdstip eerst.
- Bij geen actieve meldingen: ‘Alles in orde’.

## Meldingsweergave
- Elke melding heeft precies één niveau: kritiek, waarschuwing of info.
- Standaardmelding: herkenbaar icoon, titel en actuele waarde.
- Waarschuwingsmeldingen: geel/ambergetinte achtergrond met contrasterende, goed leesbare tekst.
- Info en overige standaardmeldingen behouden dezelfde neutrale donkere achtergrond als de gewone kaarten.
- Kritieke meldingen: donker roodgetinte achtergrond met contrasterende, goed leesbare tekst.
- Waarschuwingsmeldingen: donker geel/ambergetinte achtergrond met contrasterende, goed leesbare tekst.
- Bij gelijke niveaus wordt de nieuwste actieve melding eerst getoond.
- Melding verdwijnt direct zodra de onderliggende voorwaarde niet meer actief is; er is geen geschiedenisoverzicht voor beëindigde meldingen.
- Activeringstijdstip wordt bijgehouden voor sortering.
- Mediaspelers Sem en Bram zijn volledig verwijderd uit het nieuwe dashboard.

## Quick buttons
Volgorde:
1. Q-Music
2. Q-Music Foute Uur
3. Rolluiken openen
4. Verjaardagmodus
5. Woonkamerverlichting uit
6. Sfeerverlichting
7. TV-modus
8. Bedtijd

Knoppen tonen icoon en label. Statuskleuren zijn gebaseerd op werkelijke Homey-status. Status wordt pas bijgewerkt nadat Homey de actie heeft bevestigd. Tijdens uitvoering wordt de betreffende knop uitgeschakeld. Na succes blijft de feedback ongeveer 5 seconden zichtbaar. Bij een mislukte actie verschijnt een algemene foutmelding bovenaan het dashboard. Kritische bevestiging is per knop configureerbaar en gebruikt een grotere dialoog met duidelijke actiebeschrijving. Er geldt ook een korte wachttijd na een geslaagde actie om dubbel indrukken te voorkomen; exacte duur volgt.
Per knop kan in de instellingen worden gekozen tussen het starten van een Homey Flow en directe apparaatbediening.

## Functionele nulmeting
De aangeleverde Home Assistant-YAML en screenshot zijn de referentie. De YAML bevat 983 regels, één view, twee secties en 55 kaarten; 43 kaarten hebben een zichtbaarheidvoorwaarde (waarvan twee mediaspelers). De volledige eerste inventarisatie van de kaarten en zichtbaarheidvoorwaarden staat in [Analyse functionele nulmeting](ha-baseline-analyse.md). Bestaande informatie en condities moeten behouden blijven. Homey-mapping is nog niet afgerond.


## Eerste Homey-mappinginventarisatie (read-only)
De aangeleverde `tablet_home_assistant.yml` is lokaal uitgelezen: 983 regels. De dashboardview heeft twee secties. De eerste bevat klok, Buienradar-weer en gemiddelde temperaturen voor woonkamer/keuken. De tweede bevat de acht quick buttons, twee conditionele mediaspelers en de conditionele meldingen.

Tijdens deze inventarisatie zijn Homey-apparaten en zones read-only opgevraagd. Er zijn geen apparaten, waarden, flows of instellingen gewijzigd.

### Eerste kandidaat-koppelingen
Dit zijn kandidaten op basis van apparaatnaam en aangetroffen capabilities; nog geen definitieve één-op-één-bevestiging:
- Weer: Homey-apparaat `Weer` met onder meer `measure_temperature`, `measure_temperature_feelslike`, `measure_humidity`, `measure_wind_combined`, `measure_rain`, `measure_snow`, `description` en `conditioncode_text`.
- CO2 woonkamer: `Multisensor woonkamer`, capability `measure_co2` (ook TVOC, temperatuur en luchtvochtigheid beschikbaar).
- Wasdroger: `Samsung wasdroger`, met machine state, cycle active, progress en remaining minutes.
- Wasmachine: `Wasmachine`, met onoff en power-meting; exacte HA-binarysensorlogica nog controleren.
- Stofzuiger: `Truus`, met work status, docked/charging, error en vacuum state.
- Tuinhuislamp: `Tuinhuis lamp`, met onoff; de bestaande HA-voorwaarde dat deze vijf minuten aan moet staan blijft behouden.
- Contacten: onder meer `Deur tuinhuis`, `Voordeur`, `Woonkamer deur`, `Ouderslaapkamer onderraam`, `Onder raam Bram`, `Onder raam Tess`, `Dakraam Sem` en `Raam Sem` hebben een `alarm_contact`-capability.
- Temperatuur Sem/Bram: apparaten `Temperatuur Sem` en `Temperatuur Bram` hebben `measure_temperature`.
- Vriezer: `Vriezer garage temperatuur` heeft `measure_temperature`; de HA-kaartnaam noemt echter ‘Vriezer keuken’, dus dit is nadrukkelijk nog geen bevestigde match.
- Ketel: `Remeha ketel` heeft boiler/DHW-statussen en temperatuurvelden; de betekenis van de HA-afgeleide binary sensors moet nog worden vergeleken.
- Media: `Slaapkamer Sem` en `Chromecast Bram` bieden speaker_playing, artist en track; bevestig nog dat dit exact de twee HA-mediaspelers zijn.

### Logica die bij de port behouden moet blijven
- Meerdere visibility-voorwaarden en expliciete AND/OR-groepen moeten als dezelfde conditieboom worden vertaald.
- Raamwaarschuwingen combineren onder meer raamcontact, schema, buitentemperatuur/gevoelstemperatuur, zonstatus, neerslag en airco-modus.
- Tuinhuislamp: aan gedurende vijf minuten.
- Batterijmeldingen: verschillende drempels per toestel en OR-voorwaarden voor ‘full’.
- CO2: boven 1200.
- Planten: vochtigheid onder 15 en geleidbaarheid onder 350.
- Kans op neerslag: boven 25.
- Bepaalde kaarten tonen een entiteit die afwijkt van de entiteit waarop de visibility-conditie controleert. Deze bronafwijkingen worden niet stilzwijgend gecorrigeerd.

### Nog niet bevestigd
Gemiddelde kamer- en keukentemperaturen, plantensensoren, telefoon/tablet-batterijen, Buienradar-kans-op-neerslag, airco-modi, schema-entiteiten, zonstatussensoren en de precieze Remeha-afgeleide statussen vereisen verdere mapping. Ook de acht HA-scene-/actieknoppen moeten afzonderlijk aan Homey Flows, Moods of directe bediening worden gekoppeld.

### Werkwijze
Iedere koppeling krijgt een expliciete status: bevestigd, kandidaat, ontbreekt, semantisch verschil of bespreekpunt. Bij een niet-één-op-één-vertaling wordt niets zelfstandig vereenvoudigd of overgeslagen; dit wordt eerst met de gebruiker besproken.


## Verdieping mapping: exacte bronvoorwaarden en actuele Homey-kandidaten

Deze aanvulling is gebaseerd op parsing van de YAML-kaarten en een nieuwe read-only uitlezing van Homey-apparaten, zones, Flows en Moods. Het betreft inventarisatie, geen wijziging aan Homey.

### Specifieke HA-condities uit de YAML
- `Raam Tess niet open`: bovenraam Tess moet dicht zijn, schema `boven_ramen_open` actief, airco-zolder mag niet in `cool`, `unavailable` of `heat` staan, én buitentemperatuur boven 18 met `zon_staat_op_raam_tess` uit.
- `Achterdeur open`: achterdeur open én buitentemperatuur lager dan 18 óf hoger dan 24.
- `Raam Bram niet open`: bovenraam Bram dicht, schema bovenramen actief en gevoelstemperatuur onder 18.
- `Raam Ouders niet open`: bovenraam ouders dicht, schema bovenramen actief en gevoelstemperatuur onder 18.
- `Dakraam Sem niet open`: dakraam dicht, schema actief, weerstatus niet een van de uitgesloten regen/onweer/sneeuwstatussen, airco-zolder niet in koelen/verwarmen en neerslag onder 0,1.
- `Lamp Sem/Bram staat aan`: bijbehorend slaapschema actief én de betreffende lamp aan.
- Koude slaapkamers: zichtbaarheid wordt gestuurd door aparte HA-binary sensors `temperatuur_bram_laag`, `temperatuur_tess_laag`, `temperatuur_ouders_laag`, `temperatuur_zolder_laag`; niet gelijkstellen aan een simpele actuele temperatuurdrempel zonder de oorspronkelijke logica te reconstrueren.
- Vriezerkaart toont `sensor.koelkast_temperatuur_koelkast_temperatuur_temperatuur`, terwijl de zichtbaarheid wordt bepaald door `binary_sensor.vriezer_keuken_temperatuur_hoog`. Deze afwijking is een expliciet bespreekpunt.
- CO2-kaart toont `sensor.multisensor_woonkamer_eco2`, maar zichtbaarheid checkt `sensor.eco2` boven 1200.
- Plantkaarten tonen vier sensorwaarden: gatenplant vochtigheid/voeding en paradijsvogelplant vochtigheid/voeding. De grenzen zijn vochtigheid onder 15 en geleidbaarheid onder 350.
- Batterijmeldingen: Galaxy A54 onder 20% of status full; SM-S721B onder 20% of status full; Pixel 7 Pro onder 15% of status full; SM-F966B onder 15% of status full; Moto G60S onder 15% of status full; muurtablet onder 25%.
- Truus: één kaart is zichtbaar zolang werkstatus niet Sleeping, Charging, Unavailable of Standby is; een tweede kaart is zichtbaar bij Standby.
- Tuinhuislamp: schakelaar moet 5 minuten onafgebroken aan zijn.
- Mediaspelers Sem en Bram zijn zichtbaar bij state `playing`.

### Nieuwe Homey-gegevens die de mapping verfijnen
- Airco keuken: Homey-apparaat `Airco keuken` bestaat met `thermostat_mode`, `onoff`, `target_temperature`, `fan_mode`, `swing_mode` en `measure_temperature`.
- Airco zolder: Homey-apparaat `Airco zolder` bestaat met dezelfde soort modus-/temperatuurvelden.
- Achterdeur: Homey-apparaat `Achterdeur` met `alarm_contact`.
- Bovenraam ouderslaapkamer: Homey-apparaat `Bovenraam ouderslaapkamer` met `alarm_contact`.
- Bovenraam Bram: Homey-apparaat `Bovenraam Bram` met `alarm_contact`.
- Bovenraam Tess: Homey-apparaat `Boven raam Tess` met `alarm_contact`.
- Temperatuur ouderslaapkamer: Homey-apparaat `Temperatuur ouderslaapkamer` met `measure_temperature`.
- Koelkast keuken temperatuur: Homey-apparaat `Koelkast keuken temperatuur` met `measure_temperature`; dit is een mogelijke match voor de getoonde koelkasttemperatuur, maar verklaart niet vanzelf de HA-vriezer-visibilitysensor.
- Muur tablet: apparaat heeft `measure_battery`; huidige uitlezing is 100%.
- Remeha ketel: `boiler_state`, `DHW_state`, `modulation_level`, `measure_temperature.intended`, `measure_temperature.boiler`, `measure_temperature.return`, `boiler_status_code`, `boiler_error_code`, `DHW_mode`.
- Homey Mood `TV kijken` bestaat in zone Begane grond. Dit is slechts een kandidaat voor de knop TV-modus; exacte actielogica moet nog worden vastgesteld.

### Nog niet gevonden of niet gelijkwaardig bewezen
- De YAML-verwijzingen naar plantensensoren hebben in de huidige gefilterde Homey-inventarisatie geen bevestigde overeenkomst opgeleverd.
- De telefoonbatterij-entiteiten (Galaxy A54, SM-S721B, Pixel 7 Pro, SM-F966B en Moto G60S) zijn niet aan Homey-apparaten gekoppeld in de huidige inventarisatie.
- De HA-schema's `boven_ramen_open`, `slapen_sem` en `slapen_bram` zijn geen apparaat-capabilities uit de huidige device-inventaris. Er moet worden vastgesteld of hiervoor Homey Logic-variabelen of Flows een equivalent bieden.
- `zon_staat_op_raam_tess` is een HA-afgeleide sensor; geen equivalent is bevestigd.
- Homey-apparaat `Weer` biedt actuele temperatuur, gevoelstemperatuur, vochtigheid, wind, regen, sneeuw en beschrijving, maar de YAML gebruikt ook Buienradar-specifieke neerslagkans en forecast-entiteiten. Een equivalent voor `rainchance_1d` is niet vastgesteld.
- De YAML bevat twee temperatuur-gemiddelden (woonkamer en keuken). In Homey bestaan Flows met namen die gemiddelden vanaf thermostaat/multisensor of verwarming/airco suggereren; de Flow-inhoud moet nog worden onderzocht voordat we kunnen vaststellen of dit de exacte bronberekening is.
- De HA-entity `binary_sensor.wasmachine` is een afgeleide status; Homey `Wasmachine` heeft onoff en vermogenswaarden. De exacte detectielogica moet worden vergeleken.
- Voor de acht HA-scene-knoppen zijn nog niet alle bijbehorende Homey Flows/Moods definitief vastgesteld. Alleen de Mood `TV kijken` is op naam een duidelijke kandidaat. Er bestaan relevante Flows rond Q-Music en rolluiken, maar hun inhoud moet worden gelezen voordat een knop eraan wordt gekoppeld.

### Relevante gevonden Homey Flows (namen, nog niet inhoudelijk geverifieerd)
Er zijn onder meer Flows gevonden met namen rond: temperatuur gemiddelde woonkamer/keuken, CO2 woonkamer hoog, verwarming/airco, rolluiken, regen en open ramen, wateralarmen, droger looptijd/energie, wasmachine start/klaar, verjaardagsmodus, TV en Q-Music. Deze namen zijn aanwijzingen voor mogelijk herbruikbare bestaande logica, geen bevestiging van de werking.


## Aanvullingen Homey-mapping en scope (10 november 2026)

### Gemiddelde temperaturen
De gebruiker heeft in Homey twee Logic-variabelen aangemaakt:
- `temperatuur_gemiddeld_keuken`
- `temperatuur_gemiddeld_woonkamer`

Deze variabelen zijn de beoogde bron voor de gemiddelde keuken- en woonkamer-temperaturen op het dashboard. De mapping is functioneel kandidaat/beoogd, maar moet technisch nog worden gecontroleerd op variabeletype, actuele waarde, eenheid en de Flow-logica die de waarden bijwerkt. De variabelen zelf zijn door de gebruiker aangemaakt; er is vanuit het dashboardproject niets gewijzigd.

### Vervallen dashboardonderdelen
De volgende onderdelen worden niet meegenomen in het nieuwe dashboard:
- Batterijniveaus van telefoons.
- Plantensensoren (vochtigheid/voeding).

Dit is een expliciete scope-uitzondering op de eerdere afspraak om de bestaande Home Assistant-YAML als functionele nulmeting 1:1 te behouden. Andere batterijmeldingen, zoals de muurtablet, zijn hiermee niet automatisch vervallen.

### Q-Music en rolluiken openen
Voor de quick buttons `Q-Music` en `Rolluiken openen` moeten nieuwe Homey Flows worden gemaakt die vanuit de Homey Dashboard-app/container gestart kunnen worden. De bestaande Flow-namen zijn niet voldoende als bevestiging van een geschikte aanroepmethode; de exacte trigger-/API-route, Flow-inhoud en foutafhandeling moeten nog worden vastgesteld.

Deze twee knoppen worden dus gekoppeld aan nieuw te maken, expliciet aanroepbare Flows. Er is nog geen Flow aangemaakt of aangepast. Homey blijft read-only vanuit onze inventarisatiewerkzaamheden totdat de gebruiker expliciet opdracht geeft om Flows te maken of te wijzigen.


### Verificatie gemiddelde temperatuurvariabelen (10 november 2026)
De twee door de gebruiker aangemaakte Logic-variabelen zijn read-only uitgelezen en bevestigd:
- `temperatuur_gemiddeld_woonkamer`: type `number`; actuele waarde bij uitlezen: 21,5.
- `temperatuur_gemiddeld_keuken`: type `number`; actuele waarde bij uitlezen: 22,5.

Daarmee zijn naam en numeriek datatype bevestigd. De waarden zijn uitsluitend een momentopname; de logica/Flows die deze variabelen bijwerken en de gebruikte temperatuureenheid moeten nog worden bevestigd. Er zijn geen waarden aangepast.


## Vooruitblik fase 2: configureerbare knopacties (10 november 2026)

De gebruiker heeft de beoogde inrichting van quick buttons voor fase 2 verduidelijkt:

- **Actieknop (Flow):** in de instellingen komt een selector waarmee een bestaande Homey Flow kan worden gekozen. De actieknop start vervolgens de geselecteerde Flow. Flows blijven echte Homey Flows en moeten dus ook vanuit Homey zelf handmatig gestart kunnen worden.
- **Apparaatknop:** in de instellingen kiest de gebruiker eerst een Homey-apparaat en vervolgens één van de acties die dat apparaat ondersteunt. De knop voert die geselecteerde apparaatactie uit.

Dit is fase-2-functionaliteit en verandert de fase-1-afspraak niet: de huidige knoppen kunnen per knop aan een Flow of directe apparaatbediening worden gekoppeld, maar de uitgebreide selectors en dynamische configuratie van bestaande Flows/apparaatacties worden later uitgewerkt.

Voor Q-Music en Rolluiken openen worden in fase 1 echte, zelfstandig bruikbare Homey Flows voorzien die ook handmatig vanuit Homey gestart kunnen worden en daarnaast vanuit het dashboard aanroepbaar moeten zijn. Er is nog geen Flow aangemaakt of gewijzigd.


## Hoofdschermmockup – aanvullende ontwerpkeuzes (10 november 2026)
- De gebruiker kiest voor een rustige, minimalistische donkere stijl, met een subtiel speels verloop op de achtergrond. Achtergrondkleuren mogen niet overheersen.
- Actieknoppen zijn neutraal en hebben geen eigen decoratieve kleuren. Kleur wordt alleen functioneel gebruikt.
- De aparte kop/balk ‘Snelle acties’ vervalt; de actieknoppen blijven bovenaan de rechterzijde staan.
- De twee mediaspelerkaarten/-knoppen vervallen volledig uit het dashboard.
- De meldingen staan onder de actieknoppen in twee kolommen. Alle meldingskaarten hebben dezelfde vaste, bijna vierkante afmetingen; langere tekst loopt over meerdere regels.
- Links worden vier bijna vierkante temperatuurtegels in een 2×2-raster getoond.
- Dashboardtekst en waarden moeten vanaf circa vier meter afstand goed leesbaar zijn.
- Temperatuurtegels en actieknoppen blijven neutraal; kleur wordt uitsluitend functioneel gebruikt, bijvoorbeeld voor meldingsniveaus/statussen.

### Temperatuurtegels – definitieve indeling
De vier temperatuurtegels zijn allemaal exact even groot en worden in een vast 2×2-raster geplaatst. Ze gebruiken een neutrale stijl en grote, goed leesbare waarden.

### Actieknoppen – definitieve plaatsing
De acht actieknoppen staan in één horizontale rij boven de meldingen, zoals in de mockup. De eerder vastgelegde volgorde blijft behouden. De gebruiker geeft aan dat de bediening bewust dichtbij het tabletscherm plaatsvindt; daarom is één compacte rij gewenst.

### Kolomverhouding – bijgewerkt ontwerpbesluit
De gebruiker kiest voor een verhouding van 40% links en 60% rechts, zoals de besproken mockup. Dit vervangt de eerdere voorlopige 50/50-verdeling. Links blijven klok, weer en vier temperatuurtegels; rechts komen de acht actieknoppen en de meldingen in twee kolommen.
