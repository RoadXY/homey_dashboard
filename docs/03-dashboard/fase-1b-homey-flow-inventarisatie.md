# Fase 1B – Homey Flow-inventarisatie (11 november 2026)

## Doel
Vaststellen welke bestaande Homey-Flows mogelijk de Logic-variabelen en afgeleide statussen produceren die relevant zijn voor de migratie van conditionele kaarten. Dit is uitsluitend een read-only inventarisatie. Flows zijn niet gestart, gewijzigd of uitgeschakeld.

## Inventarisatie
De actuele Flow-lijst is opgehaald. De volgende bestaande Flows zijn op naam relevant voor de bronvoorwaarden uit de Home Assistant-nulmeting:

| Homey Flow | ID | Type | Relatie / onderzoeksvraag |
|---|---|---|---|
| CO2 woonkamer: hoog | `50c29e2d-b71b-4974-b497-38c4f1be072d` | Advanced | Onderzoekt de CO2-status/variabele en drempel; vergelijken met HA-grens >1200. |
| Vriezer garage: temperatuur hoog | `7159bcdb-d0e2-45ba-9248-0f4d5b02d79f` | Advanced | Mogelijke relatie met `Vriezer_tempAlarm` en de Homey-vriezersensor. |
| Vriezer keuken: temperatuur hoog | `df1738b7-5e41-41d0-a651-4917c9eeccd6` | Advanced | Naam wijkt af van de gevonden vriezersensor in Garage; fysieke/semantische bron moet worden vastgesteld. |
| Achterdeur: deur open | `275d42f0-931b-4b4a-af59-c3430021f96a` | Advanced | Mogelijke relatie met achterdeurmelding en temperatuurvoorwaarden. |
| Voordeur: deur open | `af7fff6b-eeea-4392-84f0-64dcd6c0e758` | Advanced | Mogelijke relatie met voordeurmelding en temperatuurverschil. |
| Ramen: tel grote open ramen | `2e74809c-c880-419e-8477-12c1d0618acc` | Advanced | Mogelijke producer van `ramen_AantalOpen`. |
| Ramen: tel open ramen | `e5076e85-0498-47fb-842f-7751babdba67` | Advanced | Mogelijke producer van raamoverzicht/-aantal. |
| Regen: ramen open, melding | `e5f60ec8-ee94-4d9d-ae30-598eefd825e9` | Advanced | Mogelijke bron voor regen-/raamwaarschuwingen. |
| Regen: achter en voordeur open | `9c8446b8-5a30-4f74-b858-6bca601212e2` | Advanced | Mogelijke bron voor gecombineerde deur-/regenlogica. |
| Stofzuiger: status meldingen | `ddb4e277-743e-40ae-8ff2-945573070d5b` | Advanced | Mogelijke relatie met Truus-statusmeldingen. |
| Muur tablet: scherm | `f0e04f71-1574-41f9-b602-d9d31a3e93e2` | Advanced | Bestaat, maar de batterijmelding gebruikt rechtstreeks een Homey-device-capability. |
| Droger: looptijd en energie | `d022918b-357d-4e84-a96c-f3518e6ef648` | Advanced | Mogelijke relatie met drogerlooptijd/eindtijd; de bron-template moet apart worden vergeleken. |
| Onderraam ouders: raam ging open maar het gaat regenen | `4b7edbe6-a953-4343-bfa1-07d9cae8163e` | Standard | Mogelijke relatie met raam-/regencondities. |
| Onderraam Bram: raam ging open maar het gaat regenen | `60448c0d-0d72-4a6c-8a75-31f02f24675e` | Standard | Mogelijke relatie met raam-/regencondities. |
| Onderraam Tess: raam ging open maar het gaat regenen | `d57afcd6-ba69-4822-b479-a5f6a1b97ed3` | Standard | Mogelijke relatie met raam-/regencondities. |
| Dakraam Sem: open maar het gaat regenen | `8aff2e3a-3a64-4b0a-a455-dbfc93864c23` | Standard | Mogelijke relatie met dakraam-/regencondities. |

Ook zijn Flows aangetroffen met namen rond CV-ketelfoutcodes, rookmelders, hoge windsnelheid, vaatwasser-/wasmachinewateralarm, verwarming/raam open en temperatuurmeldingen. Deze zijn nog niet aan een specifieke YAML-kaart gekoppeld.

## Beperking van deze ronde
De Flow-lijst is succesvol opgehaald, maar het ophalen van de detaildefinities werd door de Homey-integratie tijdelijk geweigerd wegens te veel verzoeken. Daarom zijn de Flow-inhoud, gebruikte kaart-ID's, argumenten, conditionele groepen, variabele-writes en ingeschakelde status in deze ronde **niet** geverifieerd.

De Flow-namen in deze tabel zijn uitsluitend aanwijzingen. Er wordt geen producer-relatie als bevestigd geregistreerd totdat de Flow-detaildefinitie is gelezen en de relevante trigger/condities/acties zijn gecontroleerd.

## Volgende stap
- Flow-details in kleine batches read-only ophalen.
- Per gevonden Logic-variabele vaststellen welke Flow deze schrijft en onder welke voorwaarden.
- De YAML-conditieboom naast de Homey Flow-logica leggen; Flow-gedrag is niet automatisch gelijk aan dashboard-zichtbaarheid.
- Ontbrekende broninformatie en semantische verschillen als concrete vragen aan de gebruiker voorleggen.
- Geen Flow starten, wijzigen of aanmaken.
