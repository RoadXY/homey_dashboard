# Blockly-meldingen – zichtbaarheidstijd

**Status:** Backend-time-out, beide Blockly-hoofdblokken en de categorie Meldingen zijn geïmplementeerd; end-to-end validatie volgt nog.  
**Besluitdatum:** 15 november 2026

## Wat doet de zichtbaarheidstijd?

Er komen twee aparte varianten van het vaste Blockly-blok **Genereer melding**:

- **Genereer melding zonder time-out:** behoudt het bestaande gedrag. De melding is zichtbaar zolang de voorwaarde actief is en verdwijnt zodra de voorwaarde inactief wordt.
- **Genereer melding met time-out:** toont de melding gedurende een gekozen vaste periode. Na afloop verdwijnt de melding automatisch.

De variant met time-out krijgt een vaste keuzelijst met de volgende mogelijkheden: **1 minuut, 2 minuten, 5 minuten, 15 minuten, 30 minuten, 1 uur, 2 uur, 4 uur, 8 uur, 12 uur en 24 uur**.

Er is geen optie **Nooit** in de time-outvariant. Wil je geen time-out, kies dan het aparte blok **Genereer melding zonder time-out**.

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

De bovenstaande werking, de twee afzonderlijke blokvarianten, de keuzelijst met tijdsduren en het niet-persistente timergedrag zijn door de gebruiker goedgekeurd en vormen het uitgangspunt voor de implementatie.

Beide hoofdblokken staan in de extra Blockly-categorie **Meldingen**. Sleep het gewenste hoofdblok vanuit die categorie naar de werkruimte om van variant te wisselen. De bestaande titel, tekst en volledige conditieboom blijven daarbij behouden. In de time-outvariant staat de keuzelijst direct onder Titel en Tekst. De volledige runtimewerking moet nog end-to-end worden gevalideerd; beschouw de feature daarom nog niet als afgerond.

De timer wordt niet bewaard over een Docker/container-herstart. Na een herstart hoeft een lopende time-out dus niet verder te lopen of te worden hersteld.

De zichtbaarheidstijd voor Blockly-meldingen staat los van de levensduurinstelling van de externe Notifications API. De API heeft een eigen contract en beheer; deze Blockly-instelling verandert dat niet.
