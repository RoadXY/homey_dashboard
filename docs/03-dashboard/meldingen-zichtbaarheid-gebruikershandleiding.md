# Blockly-meldingen – zichtbaarheidstijd

**Status:** Goedgekeurd ontwerp; de bediening en werking moeten nog in Blockly worden geïmplementeerd.  
**Besluitdatum:** 15 november 2026

## Wat doet de zichtbaarheidstijd?

Met een zichtbaarheidstijd kan een Blockly-melding na activering nog een ingestelde periode zichtbaar blijven op het dashboard. De melding verdwijnt automatisch wanneer die periode voorbij is.

De zichtbaarheidstijd bepaalt dus hoelang de melding op het dashboard blijft staan. Dit is iets anders dan de bestaande Blockly-blokken **Gedurende X minuten actief** en **Gedurende X minuten inactief**. Die bestaande blokken bepalen wanneer een voorwaarde waar wordt; ze bepalen niet hoelang een melding zichtbaar blijft.

## Wat gebeurt er als de voorwaarde weer inactief wordt?

Zodra de melding wordt geactiveerd, begint de zichtbaarheidstijd te lopen. Wordt de onderliggende voorwaarde daarna inactief, dan blijft de melding zichtbaar totdat de ingestelde zichtbaarheidstijd volledig is verstreken.

**Voorbeeld**

- 12:00 – De voorwaarde wordt actief. De melding verschijnt en de timer start.
- 12:03 – De voorwaarde wordt inactief. De melding blijft zichtbaar.
- 12:15 – De ingestelde zichtbaarheidstijd is verstreken. De melding verdwijnt.

## Wat gebeurt er als de voorwaarde opnieuw actief wordt?

De oorspronkelijke timer blijft leidend. Opnieuw activeren start de timer niet opnieuw en verlengt de zichtbaarheidstijd niet.

**Voorbeeld**

Bij een zichtbaarheidstijd van 15 minuten:

- 12:00 – De melding verschijnt; de timer loopt tot 12:15.
- 12:03 – De voorwaarde wordt inactief; de melding blijft zichtbaar.
- 12:08 – De voorwaarde wordt opnieuw actief; de oorspronkelijke timer blijft ongewijzigd.
- 12:15 – De melding verdwijnt zoals oorspronkelijk gepland.

Opnieuw activeren verandert de oorspronkelijke vervaltijd dus niet.

## Wat is al besloten en wat volgt nog?

De bovenstaande werking is door de gebruiker goedgekeurd en wordt als uitgangspunt voor de implementatie gebruikt.

De precieze bediening in Blockly, beschikbare tijdsopties, standaardinstelling en het gedrag bij een Docker-herstart zijn nog niet vastgesteld. Deze handleiding beschrijft daarom het goedgekeurde gedrag, niet een reeds beschikbare instelling.

De zichtbaarheidstijd voor Blockly-meldingen staat los van de levensduurinstelling van de externe Notifications API. De API heeft een eigen contract en beheer; deze Blockly-instelling verandert dat niet.
