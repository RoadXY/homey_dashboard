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

### 10.1 Praktijktest op de Ubuntu-server – 13 november 2026

Na het uitrollen van de versie met de broncatalogus heeft de gebruiker de endpoint getest vanuit een ingelogde dashboardinstellingen-sessie via de browserconsole. De response was succesvol:

- HTTP-status: `200`.
- `devices`: 127 apparaten.
- `variables`: 23 Logic-variabelen.
- `zones`: 22 ruimtes.
- `retrievedAt`: timestamp aanwezig.

Hiermee is bevestigd dat de beveiligde instellingenroute op de draaiende Docker-installatie bereikbaar is en dat de backend de Homey-inventarisatie succesvol kan ophalen. De aantallen zijn een momentopname van deze test en kunnen veranderen wanneer de Homey-inventaris wijzigt.

De test bevestigt nog niet dat bronselectie al in Blockly beschikbaar is; dat blijft onderdeel van de volgende frontend-implementatiestap.

## 11. Eerste frontend-koppeling broncatalogus

De instellingenpagina voor meldingen laadt nu naast de bestaande meldingsconfiguraties ook `GET /api/settings/notification-sources`. De catalogus wordt gebruikt voor een eerste bronkeuzecontrole met:

- apparaatnaam en capabilitytitel;
- capabilitytype (boolean/getal) en eventuele eenheid;
- Logic-variabelen met hun datatype;
- beschikbaarheidsinformatie in de apparaatopties.

De catalogusfout is bewust onafhankelijk van het laden van meldingsconfiguraties: als Homey tijdelijk niet bereikbaar is, blijven bestaande meldingen en de editorpagina beschikbaar. De bronkeuze is in deze tussenstap nog niet gekoppeld aan de opgeslagen condition-JSON; de UI meldt dit expliciet. De volgende stap is de bronkeuze als Blockly-bouwsteen modelleren en de bestaande JSON-configuraties round-trip veilig houden.

### 11.1 Bronkeuze schrijft nu naar het bestaande condition-model

De bronkeuze op de meldingeninstellingenpagina is aangesloten op het opgeslagen condition-model. Bij een melding met een vergelijkingsnode wordt de geselecteerde apparaat-capability of Logic-variabele als bron op de eerste vergelijkingsnode toegepast. De rest van de condition-boom blijft behouden. De selectie gebruikt uitsluitend stabiele Homey-ID's; namen en eenheden dienen alleen voor de presentatie.

Bij een bronwissel blijft de vergelijking behouden als de waarde bij het datatype past. Past deze niet, dan wordt voor een numerieke bron `equals 0` en voor een booleaanse bron `equals false` gebruikt. Zo wordt geen ongeldige datatype/operator-combinatie in het JSON-model opgeslagen. Meldingconfiguraties zonder vergelijkingsnode houden de bronkeuze uitgeschakeld. Dit is een tussenstap richting het uiteindelijke Blockly-bronblok; de huidige bronkeuze is nog een instellingenveld en nog geen Blockly-bouwsteen.

### 11.2 Homey-bron als zichtbare Blockly-bouwsteen

De losse HTML-bronkeuze is vervangen door een eigen Blockly-blok `homey_notification_source`. De dropdown in dit blok wordt gevuld vanuit de opgehaalde broncatalogus en toont apparaat/capability of Logic-variabele. De geselecteerde waarde blijft gebaseerd op stabiele IDs en wordt doorgegeven aan de bestaande bron-updatefunctie voor het condition-model.

Het bestaande tijdschema-blok blijft in dezelfde Blockly-workspace beschikbaar. De Homey-bron en het tijdschema zijn op dit moment afzonderlijke zichtbare blokken; de volledige verbinding van bron → vergelijking → logische combinaties en het round-trip laden van de volledige condition-boom zijn nog vervolgstappen. Deze tussenstatus is bewust expliciet: een los bronblok mag niet de indruk wekken dat de volledige visuele regel-editor al gereed is.

### 11.3 Vergelijkingsblok als volgende Blockly-bouwsteen

De Blockly-workspace bevat nu ook een afzonderlijk vergelijkingsblok met operator- en waardekeuze. De operatorlijst is datatypebewust: numerieke bronnen bieden alle zes afgesproken operatoren; booleaanse bronnen alleen `equals` en `notEquals`. Wijzigingen aan operator en waarde worden teruggeschreven naar de eerste vergelijkingsnode in het bestaande condition-model, zonder de omliggende EN/OF-structuur te vervangen.

Dit is nog een tussenstap: bron- en vergelijkingsblokken zijn zichtbaar naast elkaar en nog niet via Blockly-verbindingen tot één expressie gekoppeld. Het round-trip laden van willekeurige bestaande condition-bomen en de visuele EN/OF/NIET-compositie volgen hierna. Tot die tijd blijft de bestaande JSON-configuratie de bron van waarheid.
### 11.4 Eerste logische Blockly-blokken

De Blockly-workspace toont nu drie aanvullende logische blokken:

- **EN** (`homey_notification_logic_and`): twee boolean-aansluitingen; beide voorwaarden moeten waar zijn.
- **OF** (`homey_notification_logic_or`): twee boolean-aansluitingen; minimaal één voorwaarde moet waar zijn.
- **NIET** (`homey_notification_logic_not`): één boolean-aansluiting; keert de uitkomst om.

Het vergelijkingsblok levert nu eveneens een boolean-uitgang, zodat het technisch op de logische aansluitingen kan worden aangesloten. De blokken gebruiken het afgesproken canonieke typegedrag; de backend combineert bestaande AND/OR-nodes al met drie-waardige logica en ondersteunt ook de NOT-node.

**Status en beperking:** dit is de eerste visuele/verbindingstechnische stap, nog geen complete Blockly-editor. De workspace maakt de blokken zichtbaar, maar laadt de volledige bestaande conditieboom nog niet als verbonden blokken en vertaalt gewijzigde verbindingen nog niet terug naar JSON. Ook is de bediening van EN/OF momenteel op twee ingangen ingericht. Het bestaande JSON-model en de backend blijven leidend; er wordt nog niets beweerd over round-trip of opslaan van een via verbindingen gebouwde logische boom. De volgende stap is de volledige conditieboom veilig inlezen en serialiseren, inclusief behoud van onbekende of niet-bewerkbare constructies.
