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
