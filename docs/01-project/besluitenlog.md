

## Gebruikersbevestiging – Remeha-statuscapabilities (11 november 2026)

- De gebruiker heeft de actuele capabilitylijst van Homey-apparaat **Remeha ketel** gedeeld (ID `ed9e603f-0930-4a37-8282-86298c6ecf56`).
- `boiler_state` (boolean, Ketel toestand) wordt gebruikt voor de statusweergave verwarming/ketel actief-inactief.
- `DHW_state` (boolean, Tap water toestand) wordt gebruikt voor de statusweergave tapwater actief-inactief.
- Voor beide boolean-bronnen geldt `true` = actief en `false` = inactief. Onbekende of niet-beschikbare waarden worden afzonderlijk als onbekend behandeld.
- `DHW_mode` (enum, Tap water comfort modus) met screenshotwaarde `off` is aanvullende modusinformatie, niet de actuele tapwatervraag.
- De getoonde waarden zijn een momentopname. Het dashboard leest de capabilities uitsluitend read-only uit en wijzigt Homey niet.
