# Dashboardontwerp

## Basislayout
- Donker thema.
- Landscape en responsive voor Samsung Galaxy Tab A SM-T515.
- Twee gelijke kolommen (50/50).
- Dashboard zelf staat vast; geen paginascroll.
- Alleen het meldingenpaneel mag verticaal scrollen als er veel meldingen zijn.

## Linkerzijde
- Grote klok met datum kleiner eronder.
- Weer met groot icoon naast buitentemperatuur.
- Weersinformatie bevat gevoelstemperatuur, wind, neerslag, luchtvochtigheid en een korte weersomschrijving.
- Weersomschrijving bestaat uit een weericoon met korte tekst.
- Bij tijdelijk ontbrekende weerinformatie verschijnt een melding dat weerinformatie niet beschikbaar is.
- Maximaal vier geselecteerde kamertemperaturen, weergegeven als afzonderlijke temperatuurtegels.

## Rechterzijde
- Quick buttons en meldingen, uitgaande van de bestaande dashboardindeling.
- Alle actieve meldingen blijven beschikbaar in scrollbaar meldingenpaneel.
- Sortering: ernst/prioriteit, daarna tijdstip.
- Bij geen actieve meldingen: ‘Alles in orde’.

## Meldingsweergave
- Niveaus: kritiek, waarschuwing, info.
- Standaard: herkenbaar icoon per niveau, geen opvallende achtergrond.
- Kritiek: rode achtergrond met goed leesbare contrasterende tekst; definitieve stijl volgt in mockup.
- Compacte basisweergave: titel en actuele waarde.
- Meldingen verdwijnen zodra de voorwaarde niet langer actief is.
- Trigger-/activeringstijdstip wordt bijgehouden.
- Mediaspelers zijn meldingsachtige items, alleen zichtbaar wanneer actief; titel, artiest en afspeelstatus. Sem en Bram naast elkaar als beide actief zijn.

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

Knoppen tonen icoon en label. Statuskleuren zijn gebaseerd op werkelijke Homey-status. Status wordt pas bijgewerkt na bevestiging door Homey. Fouten worden getoond zonder de knop onbruikbaar te maken. Kritieke bevestiging is per knop configureerbaar. Per knop kan in de instellingen worden gekozen tussen het starten van een Homey Flow en directe apparaatbediening.

## Functionele nulmeting
De aangeleverde Home Assistant YAML (984 regels) en screenshot zijn de referentie. Bestaande meldingen, condities, knoppen en informatie moeten functioneel behouden blijven. Deze bron moet als projectbestand beschikbaar blijven en bij de port systematisch worden gemapt.
