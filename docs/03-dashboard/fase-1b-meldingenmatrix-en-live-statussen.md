

### 12.8 Gebruikersbevestiging – Remeha-capabilities vastgesteld (11 november 2026)

De gebruiker heeft screenshots uit Homey Developer Tools aangeleverd voor het apparaat **Remeha ketel** (apparaat-ID `ed9e603f-0930-4a37-8282-86298c6ecf56`). Het apparaat is op het getoonde moment Ready en Available. De volgende relevante capabilities zijn zichtbaar:

| Capability | Homey-titel | Type | Waarde in screenshot |
|---|---|---|---|
| `boiler_state` | Ketel toestand | boolean | `false` |
| `DHW_state` | Tap water toestand | boolean | `false` |
| `DHW_mode` | Tap water comfort modus | enum | `off` |

Hiermee zijn de twee gevraagde statusbronnen voor de dashboardweergave vastgesteld: `boiler_state` voor verwarming/ketel actief-inactief en `DHW_state` voor tapwater actief-inactief. De booleanwaarde wordt als status gebruikt (`true` = actief, `false` = inactief); ontbrekende, ongeldige of niet-beschikbare waarden blijven `unknown` en worden niet als inactief getoond. De enum `DHW_mode` geeft de ingestelde tapwater-comfortmodus weer en is aanvullende context, niet de actuele tapwatervraag. De getoonde `off`-waarde is een momentopname, geen vaste configuratiewaarde.

De exacte semantiek van de ketelstatus is voor de dashboardtegel functioneel voldoende als Homey deze boolean betrouwbaar bijwerkt. De dashboardapp leest alle waarden uitsluitend read-only uit en wijzigt geen Homey-instellingen.
