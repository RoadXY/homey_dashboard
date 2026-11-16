# Project overview

## Doel
Een eigen dashboard ontwerpen en realiseren dat in een Docker-container op de Ubuntu-server draait en informatie van de Homey Pro 2023 toont.

De Samsung-tablet toont uitsluitend de website van deze container via Fully Kiosk Browser. De tablet voert zelf geen dashboardlogica uit.

## Uitgangspunten
- Homey Pro 2023 is de bron voor apparaten, sensoren, flows en automatiseringen.
- Het dashboard is een zelfstandige presentatie- en bedieningslaag; Home Assistant is geen runtime-afhankelijkheid.
- De bestaande Home Assistant-dashboardconfiguratie is de functionele nulmeting. Alle relevante informatie en voorwaarden moeten bij de port behouden blijven.
- Een lokale Homey-verbinding heeft de voorkeur. Cloud-afhankelijkheden worden afzonderlijk onderzocht en gedocumenteerd.
- Mockups en functionele besluiten worden expliciet afgestemd voordat nieuwe onderdelen worden gebouwd.
- Besluiten en voortgang worden in deze repository bijgehouden.

## Actuele projectstatus
De actuele fase, gerealiseerde onderdelen, resterende werkzaamheden en de voortgang van alle toekomstige fases worden uitsluitend bijgehouden in het [centrale document Projectfasering en actuele voortgang](../06-fases/README.md). Dit projectoverzicht bevat bewust geen tweede, mogelijk verouderende fasestatus.

## Apparatuur
- Backend: Homey Pro 2023.
- Server: Ubuntu met Docker.
- Scherm: Samsung Galaxy Tab A SM-T515, liggend, responsive.
- Kiosk: Fully Kiosk Browser, reeds aangeschaft.
- Scherm blijft 24/7 aan.

## Navigatie
- [Centraal fase- en voortgangsoverzicht](../06-fases/README.md)
- [Besluitenlog](besluitenlog.md)
- [Architectuur](../02-architectuur/README.md)
- [Dashboardontwerp](../03-dashboard/README.md)
- [Analyse functionele nulmeting – Home Assistant](../03-dashboard/ha-baseline-analyse.md)
- [Configuratie](../04-configuratie/README.md)
- [Tablet](../05-tablet/README.md)
- [Mockups en goedkeuring](../07-ontwerp/README.md)
- [Developer Guide](../10-ontwikkelaarshandleiding/README.md)
- [User Guide](../09-gebruikershandleiding/README.md)
