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
