# Configuratie

## Fase 1
Instellingenpagina beheert:
- Homey-verbinding en basisinstellingen.
- Selectie van apparaten en capabilities voor weer/temperaturen.
- Quick buttons: per knop kan de gebruiker kiezen tussen een Homey Flow en directe apparaatbediening.
- Meldingen: bestaande meldingen aan/uit zetten, naam aanpassen en prioriteit wijzigen. Onderliggende voorwaarden en meetwaarden worden in fase 1 niet via de beheerpagina bewerkt.

Apparaatselectie: toon een overzichtelijke lijst met gevonden Homey-apparaten. Na apparaatselectie kiest de gebruiker de gewenste meetwaarde/capability.

Wijzigingen worden pas definitief na expliciete actie op knop ‘Opslaan’. Als de gebruiker de pagina probeert te verlaten met niet-opgeslagen wijzigingen, verschijnt een waarschuwing.

De beheerpagina is bereikbaar via tablet, computer en telefoon en wordt met een pincode beveiligd. De gebruiker voert de pincode eenmaal per sessie in; na een instelbare periode zonder activiteit wordt automatisch uitgelogd.

De instellingenpagina biedt een testmogelijkheid voor de Homey-verbinding.

## Configuratiebestanden
Voorstel voor beheerbare, versieerbare configuratie:
- config/dashboard.json
- config/devices.json
- config/notifications/ (opgesplitst per categorie)
- config/actions/buttons.json
- config/actions/confirmations.json

JSON moet een schema-versie, stabiele IDs, validatie en begrijpelijke foutmeldingen ondersteunen. Condities verwijzen naar Homey device-ID's en capability-ID's, niet naar veranderlijke displaynamen.

## Fase 2
- Overzicht van alle definieerbare meldingen.
- Bewerken via potloodknop.
- Gespecialiseerde WYSIWYG-meldingeneditor.
- Samengestelde AND/OR-condities.
- Pushmeldingen vanuit Homey Flows.
- JSON blijft compatibel met de editor; fase 1 moet hier architectonisch op voorbereiden.

## Beveiliging
Pincode en eventuele API-keys/secrets worden nooit in Git opgeslagen. PIN-sessies verlopen na een instelbare periode van inactiviteit. Details zoals opslag, rate limiting en herstelprocedure moeten nog worden ontworpen.


## Algemeen – afgesproken instellingenpagina-onderdelen
De pagina Algemeen bevat naast algemene informatie/dashboardstatus ook instellingen voor datumweergave, tijdweergave en verversingssnelheid. De precieze opties en standaardwaarden worden nog vastgesteld.
