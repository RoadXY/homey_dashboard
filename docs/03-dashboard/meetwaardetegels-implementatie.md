# Meetwaardetegels

## Los editor-kaartje (13 november 2026)

Het bewerken van een meetwaardetegel gebeurt voortaan in een afzonderlijke editor-kaart onder de lijst en voorbeeldkaarten, in dezelfde vormgeving en interactie als de editor voor Snelle acties. De editor opent wanneer een tegelrij wordt geselecteerd en kan met het kruisje worden gesloten. De lijst en preview blijven onafhankelijk zichtbaar.

## Preview en dashboardweergave gelijkgetrokken (13 november 2026)

- De instellingenpreview gebruikt nu dezelfde `TemperatureTile`-component als het dashboard, inclusief gescheiden waarde en eenheid.
- De gedeelde formattering rondt waarden vanaf 1.000 af op hele eenheden en verbergt de eenheid bij absolute waarden boven 99,99 om de tegel op tablets compact te houden.
- De cijfergrootte op het dashboard is verhoogd van 16 naar 18 container-query-eenheden, met een minimum van 32 px en maximum van 88 px. De preview schaalt relatief aan zijn bredere voorbeeldtegels zodat de verhoudingen overeenkomen met de kleinere dashboardtegels.
- De waarde blijft op één regel staan; de eenheid blijft kleiner en wordt alleen getoond wanneer er voldoende ruimte is.

## Gelijke hoogte van de bovenste instellingenkaarten (13 november 2026)

De kaart **Meetwaardetegels** en de kaart **Voorbeeld** worden even hoog weergegeven zolang ze naast elkaar staan. Dit is opgelost met de grid-uitlijning van `.measurement-workspace`: de grid-items rekken uit tot de hoogte van de hoogste kaart binnen dezelfde rij.

Wanneer de beschikbare breedte kleiner wordt en de kaarten onder elkaar worden geplaatst, krijgt iedere kaart weer de hoogte die bij de eigen inhoud hoort. Er wordt dus geen vaste gelijke hoogte afgedwongen over afzonderlijke rijen. De wijziging is beperkt tot de meetwaardetegels-instellingen en verandert de Quick Actions- of dashboardtegels niet.

## Gestapelde tablet-/smalle layout hersteld (13 november 2026)

De meetwaardetegels gebruikten ook de algemene Quick Actions-breakpointregels. Die regels zetten de preview expliciet op gridrij 3 en lieten de meetwaardetegelspecifieke minimale kaarthoogtes staan. In de gestapelde weergave kon daardoor onnodige ruimte/een verkeerde gridplaatsing ontstaan. Een gerichte override voor maximaal 1100 px zet beide kaarten terug in normale documentvolgorde, maakt de kaarthoogte inhoudsafhankelijk en houdt de previewtegels in twee kolommen. De editor blijft daarna als afzonderlijke kaart onder beide kaarten staan. De gelijke hoogte geldt uitsluitend wanneer de twee kaarten naast elkaar staan.


## Instelbaar aantal meetwaardetegels (15 november 2026)

Het aantal zichtbare meetwaardetegels is instelbaar via een dropdown met **2, 4 of 6** opties. De standaardwaarde blijft vier. De configuratie bewaart altijd zes vaste tegelrecords; verlagen van het zichtbare aantal verbergt de overige records zonder hun naam of Homey-bron te wissen. Bij opnieuw verhogen komen die instellingen terug.

De dashboardlayout plaatst de meetwaardegroep altijd onder de weerkaart. De tegels staan in twee kolommen met één, twee of drie rijen voor respectievelijk 2, 4 of 6 tegels. De hoogte van de tegelgroep groeit mee met het aantal rijen. De instellingenlijst en preview tonen direct het gekozen aantal.

De opslagstructuur is vervangen door een object met `count` en `tiles`. De API-instellingenroutes lezen en bewaren dit model; de dashboardroute geeft alleen de zichtbare tegels en hun meetwaarden terug. De zes vaste configuraties gebruiken stabiele IDs `measurement-1` t/m `measurement-6`.

De gebruiker heeft bevestigd dat geen migratie nodig is: het dashboard is nog in ontwikkeling en heeft één gebruiker. De nieuwe opslagstructuur kan daarom direct worden gebruikt. De tegelconfiguratie bevat alleen naam en numerieke Homey-meetbron.
