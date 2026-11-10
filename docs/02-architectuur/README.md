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

## Technisch stackvoorstel
De technische stack is op 11 november 2026 goedgekeurd en vastgelegd in [Technisch stackvoorstel](technisch-stackvoorstel.md): TypeScript, React + Vite, Node.js + Fastify, de officiële homey-api-client, SSE als kandidaat voor statusupdates, JSON-configuratie op een persistent volume en een multi-stage Docker-build. Concrete versies, Homey-permissies, netwerkdetails en operationele instellingen worden tijdens technische validatie vastgesteld.

## Nog te ontwerpen
Netwerkdiagram, definitieve API-keuze en SDK-versie, servicegrenzen, persistentie/cache, logging, health checks, backup/restore, secretsbeheer en foutafhandeling.
