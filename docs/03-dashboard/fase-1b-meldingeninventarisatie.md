

### Gebruikersbevestiging – Remeha-ketelstatusbronnen (11 november 2026)

Screenshots uit Homey Developer Tools bevestigen voor apparaat **Remeha ketel** (ID `ed9e603f-0930-4a37-8282-86298c6ecf56`) de relevante capabilities:
- `boiler_state` — boolean, titel **Ketel toestand**; getoonde waarde `false`.
- `DHW_state` — boolean, titel **Tap water toestand**; getoonde waarde `false`.
- `DHW_mode` — enum, titel **Tap water comfort modus**; getoonde waarde `off`.

De eerste twee zijn de gekozen read-only bronnen voor respectievelijk verwarming/ketel actief-inactief en tapwater actief-inactief. Voor beide geldt `true` = actief en `false` = inactief; een ontbrekende, ongeldige of niet-beschikbare waarde wordt als onbekend behandeld. `DHW_mode` is aanvullende informatie over de ingestelde comfortmodus en mag niet worden verward met de actuele tapwatertoestand. De getoonde waarden zijn slechts een momentopname.


**Afbakening:** conform bevestiging van de gebruiker blijft de Remeha-weergave beperkt tot verwarming actief/inactief en tapwater actief/inactief. `DHW_mode` wordt niet opgenomen in het dashboard.


### Gebruikersbevestiging – weerbron en toekomstige conditie-overdracht (11 november 2026)

Voor de regenwaarschijnlijkheid is de Homey-weerdienst **Raamsdonksveer** bevestigd (apparaat-ID `b2fa37bb-45e2-4fda-87b7-24dcecf64420`, Open-Meteo-driver). Capability `measure_precipitation_probability` (number) levert de regenwaarschijnlijkheid; de bestaande grens blijft **groter dan 25%**. De screenshot toont 80 als momentopname.

De weer-icoonmatrix komt te vervallen. Gewenste toekomstige oplossing: een API-endpoint in de dashboardcontainer ontvangt de actuele weerconditie vanuit de toekomstige Homey-app. Die app biedt een Flow-kaart **‘Zet huidige weerconditie naar’** met een dropdown van de door het dashboard ondersteunde condities. De gebruiker bepaalt in Homey welke actuele conditie uit de eigen weerprovider wordt doorgestuurd. Canonieke condities, endpointcontract, beveiliging en stale/missing-data gedrag zijn nog uit te werken; endpoint en kaart zijn nog niet gebouwd.
