# Blockly-bouwsteen – databron en voorwaarde vergelijken

**Status:** eerste functionele ontwerpschets, nog niet geïmplementeerd  
**Fase:** 1  
**Doel:** de gebruiker moet in Blockly zelf een Homey-databron kunnen kiezen, de actuele waarde uitlezen en daar een eenvoudige voorwaarde mee samenstellen voor een dashboardmelding.

## 1. Leidende uitgangspunten

- Homey Pro 2023 is de bron voor actuele apparaatgegevens, beschikbaarheidsstatussen en Logic-variabelen.
- De dashboardapplicatie leest Homey uitsluitend read-only uit.
- De gebruiker kiest per melding zelf de databron in Blockly; er wordt geen vaste bron voor bijvoorbeeld CO₂ voorgeschreven.
- Toegestane bronsoorten zijn:
  1. een Homey-apparaat en een capability/waarde van dat apparaat;
  2. een bestaande Homey Logic-variabele.
- Als een Logic-variabele wordt gekozen, is de gebruiker verantwoordelijk voor het vullen en actueel houden van die variabele. De dashboardapplicatie leest de waarde alleen.
- De voorwaarde en de evaluatie worden intern in de dashboardapplicatie uitgevoerd. Er worden geen Homey Flows gestart of uitgevoerd.
- De prioriteit is een vaste eigenschap van de afzonderlijke melding. De prioriteit verandert niet dynamisch op basis van de bronwaarde of een voorwaarde. Voor verschillende prioriteiten maakt de gebruiker afzonderlijke meldingen met eigen voorwaarden.
- Dezelfde bronselectie- en vergelijkingsbouwstenen moeten herbruikbaar zijn voor verschillende soorten dashboardmeldingen.

## 2. Voorgestelde opbouw in Blockly

De gebruiker bouwt een regel met drie herkenbare onderdelen:

1. **Databron kiezen** – selecteer een Homey-apparaat/capability of een Logic-variabele.
2. **Waarde ophalen** – de applicatie leest de actuele waarde van de geselecteerde bron.
3. **Voorwaarde vergelijken** – vergelijk de waarde met een ingestelde waarde of andere eenvoudige operand.

Schematisch:

```
[Homey-apparaat/capability OF Logic-variabele]
                    |
                    v
             [Actuele waarde]
                    |
                    v
       [Vergelijking + ingestelde waarde]
                    |
                    v
            [Waar / Onwaar]
```

De uitkomst van de vergelijking kan vervolgens onderdeel zijn van een samengestelde meldingsvoorwaarde.

## 3. Bronselectie

### 3.1 Homey-apparaat

De gebruiker selecteert:
- een apparaat uit de Homey-apparatenlijst;
- vervolgens een beschikbare capability/waarde van dat apparaat.

De keuzelijst moet begrijpelijke apparaatnamen tonen en de technische capability-identificatie herkenbaar beschikbaar maken, zodat gelijksoortige apparaten of waarden niet met elkaar worden verward.

### 3.2 Homey Logic-variabele

De gebruiker selecteert een bestaande Logic-variabele uit de Homey Logic-inventarisatie. De actuele waarde en het datatype worden uit Homey gelezen. De gebruiker blijft verantwoordelijk voor het vullen en bijwerken van de variabele.

### 3.3 Read-only en foutafhandeling

- Blockly biedt geen actie om Homey-apparaten, capabilities of Logic-variabelen te wijzigen.
- De bron wordt tijdens runtime opnieuw read-only uitgelezen volgens het ingestelde verversings-/evaluatiemodel van de dashboardapplicatie.
- Een niet beschikbare bron of een niet uitleesbare waarde mag niet stilzwijgend als `false`, nul of een normale status worden behandeld.
- De exacte fout-/onbekend-afhandeling en diagnoseweergave worden verder uitgewerkt binnen de fase-1-scope; detectie van verouderde meetwaarden blijft fase 3.

## 4. Vergelijkingsbouwsteen

De eerste versie moet eenvoudige voorwaarden kunnen uitdrukken. De definitieve operatorlijst en ondersteuning per datatype moeten nog worden bevestigd.

Voorbeelden van bedoelde vergelijkingen:
- numeriek: groter dan, groter dan of gelijk aan, kleiner dan, kleiner dan of gelijk aan, gelijk aan;
- tekst/status: is gelijk aan, is niet gelijk aan;
- boolean: is waar, is onwaar.

De editor moet voorkomen dat een ongeldige combinatie wordt samengesteld, bijvoorbeeld een numerieke vergelijking op een tekstwaarde. De operand en het datatype moeten aansluiten op de geselecteerde bron.

## 5. Relatie met meldingen

- De databron en voorwaarde bepalen wanneer de melding actief is.
- De prioriteit wordt apart en vast op de melding ingesteld.
- De prioriteit wordt niet afgeleid uit de uitkomst van een vergelijking.
- Een gebruiker die een waarschuwing én een kritieke melding wil, maakt twee afzonderlijke meldingen met elk een eigen voorwaarde en vaste prioriteit.
- Een melding verdwijnt volgens de bestaande dashboardafspraak zodra de onderliggende voorwaarde niet meer actief is; er wordt geen geschiedenis van beëindigde meldingen bijgehouden.

## 6. Voorbeeld – CO₂

De gebruiker kan zelf kiezen uit:
- multisensor woonkamer → `measure_co2`; of
- Logic-variabele `eco2_woonkamer_status`.

Er wordt geen van beide bronnen verplicht voorgeschreven. De gebruiker configureert de gewenste vergelijking(en) en maakt afzonderlijke meldingen met vaste prioriteit als meerdere meldingsniveaus gewenst zijn.

De eerder besproken CO₂-waarden (waarschuwing vanaf 1000 ppm, kritiek vanaf 2000 ppm en herstel onder 990 ppm) blijven functionele referentiewaarden uit de meldingenmatrix. Ze leggen niet vast welke bron de gebruiker in Blockly moet selecteren.

## 7. Nog te bevestigen

1. Welke vergelijkingsoperatoren moeten in de eerste versie beschikbaar zijn?
2. Moet de eerste versie naast enkele eenvoudige vergelijkingen direct AND/OR-combinaties ondersteunen, of wordt dat een afzonderlijke bouwsteen/stap?
3. Hoe wil de gebruiker in Blockly een bron kiezen: via twee aparte bronblokken (apparaatwaarde en Logic-variabele) of één bronblok met een keuzetype?

## 8. Acceptatiecriteria voor de eerste bouwsteen

- De gebruiker kan een Homey-apparaat selecteren en een capability daarvan kiezen.
- De gebruiker kan een Homey Logic-variabele selecteren.
- Beide bronnen worden uitsluitend read-only uitgelezen.
- De gebruiker kan een eenvoudige vergelijking samenstellen die een boolean-uitkomst oplevert.
- De applicatie voert de vergelijking zelf uit; er is geen Homey Flow nodig.
- Bronkeuze en meldingsprioriteit zijn afzonderlijke instellingen.
- De gebruiker kan verschillende meldingen met verschillende vaste prioriteiten aanmaken.
- Ongeldige datatype-/operatorcombinaties worden in de editor voorkomen.


## 9. Implementatievolgorde – bewust uitgesteld

Deze bouwsteen wordt **niet** geïmplementeerd voordat de eerste JSON-gedreven meldingen werken. Eerst worden de bestaande goedgekeurde meldingen uit de Home Assistant-YAML naar JSON-configuratie vertaald en door de dashboardapplicatie uitgevoerd. Daarna wordt Blockly als editor op die bestaande JSON-configuratie aangesloten, zodat Blockly configuraties kan lezen, bewerken en genereren.

Deze schets beschrijft dus het latere Blockly-doel en is geen opdracht om nu al Blockly te bouwen.


## 10. Implementatiestap – read-only broncatalogus

De backend biedt nu een afzonderlijke broncatalogus voor de meldingeneditor via `GET /api/settings/notification-sources`.

- De route is uitsluitend beschikbaar met een geldige instellingen-PIN-sessie.
- De catalogus bevat Homey-apparaten, hun boolean- en numerieke capabilities, ruimtes en boolean-/numerieke Logic-variabelen.
- Apparaat-ID's, capability-ID's en Logic-variable-ID's zijn de opgeslagen sleutels; namen zijn uitsluitend presentatietekst.
- Tekst- en enum-capabilities/variabelen worden bewust nog niet aangeboden, omdat het huidige canonieke notification-v1-bronmodel alleen `boolean` en `number` ondersteunt.
- De bestaande meetwaardetegelcatalogus blijft ongewijzigd en numeriek; deze uitbreiding beïnvloedt de instellingen voor meetwaardetegels niet.
- Deze stap levert alleen de broncatalogus. De Blockly-blokken en JSON-roundtrip volgen in de volgende implementatiestappen.
