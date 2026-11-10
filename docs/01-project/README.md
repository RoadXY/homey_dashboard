# Project overview

## Doel
Een eigen dashboard ontwerpen en realiseren dat in een Docker-container op de Ubuntu-server draait en informatie van de Homey Pro 2023 toont.

De Samsung-tablet toont uitsluitend de website van deze container via Fully Kiosk Browser. De tablet voert zelf geen dashboardlogica uit.

## Uitgangspunten
- Homey Pro 2023 is de bron voor apparaten, sensoren, flows en automatiseringen.
- Het dashboard is een zelfstandige presentatie- en bedieningslaag; Home Assistant is geen runtime-afhankelijkheid.
- De bestaande Home Assistant-dashboardconfiguratie is de functionele nulmeting. Het aangeleverde bestand telt 983 regels; alle bestaande informatie en voorwaarden moeten bij de port behouden blijven.
- Een lokale Homey-verbinding heeft de voorkeur. Cloud-afhankelijkheden moeten afzonderlijk worden onderzocht en gedocumenteerd.
- Er wordt niet gebouwd voordat mockups en functioneel ontwerp zijn goedgekeurd.
- Besluiten en voortgang worden in deze repository bijgehouden.

## Projectstatus
Inventarisatierondes 1 t/m 22 zijn afgerond en vastgelegd in het besluitenlog. De eerste inhoudelijke analyse van de Home Assistant-YAML is uitgevoerd en staat in [Analyse functionele nulmeting](../03-dashboard/ha-baseline-analyse.md). De koppeling van alle YAML-entiteiten en voorwaarden aan Homey-apparaten/capabilities moet nog worden uitgevoerd. Mockups en functioneel ontwerp zijn nog niet goedgekeurd; implementatie is daarom nog niet gestart.

## Apparatuur
- Backend: Homey Pro 2023.
- Server: Ubuntu met Docker.
- Scherm: Samsung Galaxy Tab A SM-T515, liggend, responsive.
- Kiosk: Fully Kiosk Browser, reeds aangeschaft.
- Scherm blijft 24/7 aan.

## Navigatie
- [Besluitenlog](besluitenlog.md)
- [Architectuur](../02-architectuur/README.md)
- [Dashboardontwerp](../03-dashboard/README.md)
- [Analyse functionele nulmeting – Home Assistant](../03-dashboard/ha-baseline-analyse.md)
- [Configuratie](../04-configuratie/README.md)
- [Tablet](../05-tablet/README.md)
- [Fases](../06-fases/README.md)
- [Mockups en goedkeuring](../07-ontwerp/README.md)
