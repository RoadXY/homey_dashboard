# Dashboardontwerp

## Basislayout
- Donker thema.
- Landscape en responsive voor Samsung Galaxy Tab A SM-T515.
- Twee gelijke kolommen (50/50).
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
- Standaard meldingen hebben geen opvallende achtergrondkleur.
- Kritieke meldingen: rode achtergrond met contrasterende, goed leesbare tekst; definitieve stijl volgt in mockup.
- Bij gelijke niveaus wordt de nieuwste actieve melding eerst getoond.
- Melding verdwijnt direct zodra de onderliggende voorwaarde niet meer actief is; er is geen geschiedenisoverzicht voor beëindigde meldingen.
- Activeringstijdstip wordt bijgehouden voor sortering.
- Mediaspelers zijn meldingsachtige items, alleen zichtbaar wanneer actief; titel, artiest en afspeelstatus. Sem en Bram naast elkaar als beide actief zijn. In het nieuwe dashboard is dit informatief en niet bedienbaar.

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
