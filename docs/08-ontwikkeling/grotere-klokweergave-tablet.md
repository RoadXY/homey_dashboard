# Grotere klokweergave op tablet

**Datum:** 13 november 2026  
**Branch:** `phase_1_foundation`

## Aanpassing

De tijd in de klokkaart is vergroot om de beschikbare ruimte op de vaste dashboardtablet beter te benutten.

- Desktop/tablet: `clamp(110px, 12.5vw, 220px)`.
- Smalle schermen: `clamp(100px, 19vw, 160px)`.
- De datum, kaartafmetingen en overige dashboardtegels zijn ongewijzigd.

## Validatie

De CSS-aanpassing is gebaseerd op de door de gebruiker aangeleverde foto van de fysieke tablet. De uiteindelijke leesbaarheid en eventuele afkapping moeten na de volgende Docker-build op de tablet zelf visueel worden gecontroleerd.
