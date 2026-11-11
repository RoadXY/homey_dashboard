

### Gebruikersbevestiging – Remeha-ketelstatusbronnen (11 november 2026)

Screenshots uit Homey Developer Tools bevestigen voor apparaat **Remeha ketel** (ID `ed9e603f-0930-4a37-8282-86298c6ecf56`) de relevante capabilities:
- `boiler_state` — boolean, titel **Ketel toestand**; getoonde waarde `false`.
- `DHW_state` — boolean, titel **Tap water toestand**; getoonde waarde `false`.
- `DHW_mode` — enum, titel **Tap water comfort modus**; getoonde waarde `off`.

De eerste twee zijn de gekozen read-only bronnen voor respectievelijk verwarming/ketel actief-inactief en tapwater actief-inactief. Voor beide geldt `true` = actief en `false` = inactief; een ontbrekende, ongeldige of niet-beschikbare waarde wordt als onbekend behandeld. `DHW_mode` is aanvullende informatie over de ingestelde comfortmodus en mag niet worden verward met de actuele tapwatertoestand. De getoonde waarden zijn slechts een momentopname.


**Afbakening:** conform bevestiging van de gebruiker blijft de Remeha-weergave beperkt tot verwarming actief/inactief en tapwater actief/inactief. `DHW_mode` wordt niet opgenomen in het dashboard.
