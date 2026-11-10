# Architectuur

## Hoofdcomponenten
- Homey Pro 2023: apparaten, sensoren, flows, moods en automatiseringen.
- Dashboardapplicatie: zelfstandige webapp voor presentatie en beperkte bediening.
- Docker op Ubuntu: host en runtime voor de dashboardapplicatie.
- Samsung Galaxy Tab A SM-T515: scherm in landscape.
- Fully Kiosk Browser: toont de dashboardwebsite; tablet bevat geen eigen dashboardlogica.

## Koppelingsprincipes
- Lokale Homey-verbinding heeft de voorkeur.
- API-key wordt gebruikt voor lokale authenticatie; geheimen horen niet in Git.
- Read-only apparaatontdekking tijdens configuratie; bediening alleen na expliciete gebruikersactie.
- Ondersteun directe apparaatbediening en Homey Flows.
- Toon bij verbindingsverlies laatst bekende waarden en een offline-indicator.

## Verversing
Doel voor belangrijke gegevens is 5 seconden, alleen als de Homey API dit ondersteunt en de belasting acceptabel blijft. Minder belangrijke gegevens krijgen een lager update-tempo. Dit moet technisch worden gevalideerd.

## Nog te ontwerpen
Netwerkdiagram, API-keuze, servicegrenzen, persistentie/cache, logging, health checks, backup/restore, secretsbeheer en foutafhandeling.
