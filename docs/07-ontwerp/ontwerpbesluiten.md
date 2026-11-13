# Ontwerpbesluiten

Dit document bundelt de actuele ontwerpuitgangspunten. De detailgeschiedenis en eerdere besluiten blijven in `docs/01-project/besluitenlog.md` en `docs/07-ontwerp/README.md` staan.

## Hoofddashboard
- Donkere, minimalistische stijl met subtiele gradient/textuur.
- Kolomverhouding 40% links / 60% rechts.
- Links: klok/datum, weer en vier temperatuurtegels in vaste 2×2-indeling: Woonkamer, Keuken, Sem, Bram.
- Rechts: acht Quick Actions in één horizontale rij.
- In de eerste oplevering (fase 1A) worden meldingen niet getoond; dit verandert de goedgekeurde basisindeling niet definitief.
- Geen zichtbaar instellingenicoon; lang indrukken op de tijdkaart opent instellingen.
- Tablet: Samsung Galaxy Tab A SM-T515, landscape, Fully Kiosk Browser.

## Quick Actions
Volgorde: Q-Music, Q-Music Foute Uur, Rolluiken openen, Verjaardagmodus, Woonkamerverlichting uit, Sfeerverlichting, TV-modus, Bedtijd. Knoppen neutraal en monochroom volgens thema. De gebruiker maakt de benodigde Homey-Flows; dashboardintegratie wordt door ons uitgewerkt.

## Instellingen
- Donkere stijl, linker navigatiekolom, content rechts, duidelijke terugactie.
- Categorieën: Algemeen, Dashboard, Meldingen, Apparaten, Homey, Systeem.
- Algemene pagina: compacte instellingenlijst en compacte statuskaarten; datum/tijd, tijdzone en verversinstellingen.
- Dashboard: vier configureerbare temperatuurtegels, acht weeronderdelen met zichtbaarheidstoggles en configureerbare Quick Actions.
- Instellingen zijn bereikbaar vanaf tablet, computer en telefoon; PIN-beveiliging, sessie-time-out en expliciet opslaan.

## Meldingen – eigenaarschap en evaluatie (13 november 2026)
- Homey Pro 2023 is de databron: het dashboard leest de actuele apparaat-capabilities en eventueel geselecteerde Logic-variabelen read-only uit.
- Homey bepaalt niet welke meldingskaart op het dashboard zichtbaar wordt. Homey Dashboard is eigenaar van de presentatielogica en beslist zelf of een melding relevant/actief is.
- De gebruiker definieert de voorwaarden met Blockly. Blockly is de visuele editor voor het centrale, versiebeheerde JSON-voorwaardenmodel; de backend valideert en evalueert datzelfde model. Er komt geen afzonderlijke Blockly-evaluator.
- De backend moet hiervoor worden uitgebreid. De huidige evaluator ondersteunt nog niet alle beoogde constructies, waaronder duur- en tijdschema-voorwaarden. Deze uitbreiding hoort bij de implementatie van de meldingeneditor.
- Meldingen verdwijnen zodra hun voorwaarden niet meer actief zijn; de afgesproken dashboardweergave en sortering blijven leidend.
- Er zijn exact drie niveaus: **kritiek**, **waarschuwing** en **info**. De bestaande styling in `docs/03-dashboard/README.md` is leidend: kritiek = donkerroodgetinte kaart met contrasterende leesbare tekst; waarschuwing = donker geel/ambergetinte kaart met contrasterende leesbare tekst; info = neutrale donkere kaart. Sortering: kritiek, waarschuwing, info; binnen ieder niveau nieuwste activering eerst.
- Dit onderscheidt configureerbare, door Dashboard geëvalueerde meldingsregels van meldingen die later via de externe API worden gepubliceerd. De API-ingang mag de eigenaarschap-/presentatieregels van het dashboard niet omzeilen.

## Ontwerpstatus
Zie `goedkeuringsstatus.md` voor de actuele status per scherm. Visuele besluiten worden niet afgeleid uit niet-goedgekeurde voorbeeldinhoud van mockups.


## Meldingen – versiebeheer voorwaardenmodel (13 november 2026)

- Nieuwe meldingsconfiguraties gebruiken `schemaVersion: 2` en één expliciete conditieboom.
- Vergelijkingsbladen krijgen `type: "comparison"`; AND/OR, duration en schedule blijven composable nodes in dezelfde boom.
- Homey-apparaatbronnen worden geïdentificeerd met device-ID + capability-ID. Logic-bronnen in v2 worden geïdentificeerd met de stabiele Logic variable-ID, niet met de veranderlijke variabelenaam.
- Versie 1 blijft voorlopig compatibel via normalisatie naar hetzelfde interne model. Bestaande bestanden worden niet stilzwijgend herschreven. V1 Logic-bronnen worden alleen gemigreerd wanneer de naam via Homey eenduidig naar een variabele-ID kan worden vertaald.
- Het formele structurele contract staat in `docs/04-configuratie/schemas/notification-v2.schema.json`; backendvalidatie blijft aanvullend verantwoordelijk voor domeinregels.
- De Blockly-editor wordt gebouwd op v2 en mag geen eigen parallelle evaluatielogica introduceren.
