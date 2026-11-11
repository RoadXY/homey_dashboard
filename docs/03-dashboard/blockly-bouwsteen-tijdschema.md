# Blockly-bouwsteen – herbruikbaar tijdschema

**Status:** functioneel ontwerp, nog niet geïmplementeerd  
**Scope:** migratie van `schedule.boven_ramen_open` uit de oorspronkelijke Home Assistant-configuratie  
**Doel:** het schema als herbruikbare voorwaarde beschikbaar maken voor meerdere dashboardregels én als Blockly-blok.

## 1. Functionele bedoeling

Het bovenramenschema is door de gebruiker aangewezen voor migratie. Het moet kunnen bepalen wanneer regels voor bovenramen relevant zijn. Het schema zelf is een tijdvenster/kalenderregel; het mag niet worden verward met Homey-Flow-timeoutvariabelen zoals `regen_ramenOpenTimout` of `regen_deurOpenTimeout`.

De exacte dagen en begin-/eindtijden van het bestaande HA-schema zijn in de huidige projectdocumentatie nog niet vastgelegd. Daarom worden die waarden niet geraden of alvast hard gecodeerd. Ze moeten uit de oorspronkelijke HA-definitie worden overgenomen of door de gebruiker worden aangeleverd.

## 2. Voorgestelde Blockly-blokvorm

**Bloknaam:** `Tijdschema actief?`

Invoer/configuratie:
- Naam van het schema (bijvoorbeeld “Boven ramen open”).
- Dagen van de week (maandag t/m zondag, meerdere selecteerbaar).
- Begintijd (lokale tijd, 24-uursnotatie).
- Eindtijd (lokale tijd, 24-uursnotatie).
- Optioneel: actief vanaf / actief tot (datumgrenzen), alleen indien de oorspronkelijke HA-definitie dit vereist.
- Tijdzone: de ingestelde tijdzone van de dashboardserver/configuratie; geen handmatige vaste UTC-offset.

Uitgang:
- Boolean: `true` wanneer het schema op het huidige lokale moment actief is.
- Boolean: `false` wanneer het schema niet actief is.

## 3. Gedrag dat het blok moet ondersteunen

1. Meerdere weekdagen selecteren.
2. Begin- en eindtijd op dezelfde dag.
3. Een venster dat over middernacht loopt (bijvoorbeeld 22:00–07:00), waarbij de geselecteerde dag het startmoment bepaalt.
4. Correcte lokale tijd en zomer-/wintertijd via de ingestelde tijdzone.
5. Herbruikbaarheid: één schema kan door meerdere dashboardregels worden gebruikt.
6. Directe evaluatie bij laden en opnieuw evalueren bij tijdgrens/daggrens; de dashboardregel hoeft niet op een Homey-Flow-event te wachten.
7. Een duidelijke Blockly-weergave van de naam en instellingen, zodat de gebruiker later zelf de tijden/dagen kan aanpassen.

## 4. Opslag en runtime

- Sla schema's op in de bestaande dashboardconfiguratie (persistent volume), niet in Homey.
- Gebruik één gedeelde schema-evaluator in de backend/regellaag; voorkom dat elke dashboardkaart eigen tijdlogica implementeert.
- Het schema is alleen een voorwaarde voor dashboardzichtbaarheid. Het start, wijzigt of activeert geen Homey-Flow.
- De schema-editor en evaluator moeten onafhankelijk blijven van de visuele kaart waarop het schema wordt gebruikt.

## 5. Acceptatiecriteria

- Een gebruiker kan het schema “Boven ramen open” in Blockly openen en wijzigen.
- De gebruiker kan weekdagen, starttijd en eindtijd aanpassen.
- Een dashboardregel kan het schema als boolean-voorwaarde gebruiken.
- Het schema blijft na containerherstart behouden.
- Het schema werkt correct over middernacht en bij zomer-/wintertijd.
- Meerdere regels kunnen hetzelfde schema delen.
- Er worden geen Homey-apparaten of Flows aangestuurd.

## 6. Nog te bevestigen

1. De exacte weekdagen en begin-/eindtijden uit de oorspronkelijke HA-configuratie.
2. Of de oorspronkelijke schedule-definitie datumgrenzen, uitzonderingsdagen of een andere nuance bevat.
3. Of het schema uitsluitend voor bovenramen wordt gebruikt of later bewust als algemene bouwsteen beschikbaar moet zijn. Het ontwerp voorziet in hergebruik, maar maakt geen extra schema's aan zonder opdracht.

## 7. Relatie met temperatuurregels

De vier koude-kamermeldingen hebben een aparte, expliciete voorwaarde: temperatuur **lager dan 16 °C**. Deze drempel wordt als configureerbare numerieke waarde gemodelleerd. Het tijdschema “Boven ramen open” wordt niet automatisch op de koude-kamermeldingen toegepast.


## 8. Broncontrole – 11 november 2026

De projectbaseline `ha-baseline-analyse.md` bevestigt dat `schedule.boven_ramen_open` als `on`-voorwaarde voorkomt in de meldingen:
- Raam Tess niet open
- Raam Bram niet open
- Raam Ouders niet open
- Dakraam Sem niet open

De baseline-analyse beschrijft alleen het gebruik van de schedule-entiteit in de condition tree. Zij bevat niet de onderliggende schedule-configuratie met weekdagen, begin-/eindtijden of eventuele uitzonderingen. De oorspronkelijke bron `tablet_home_assistant.yml` is op dit moment niet beschikbaar via de gekoppelde projectbestanden of als bestand in de repository.

**Blokkade voor exacte reconstructie:** de oorspronkelijke YAML (of alleen de volledige definitie van `schedule.boven_ramen_open`) is nodig. Tot die bron beschikbaar is, blijven de concrete tijden/dagen onbekend en worden ze niet ingevuld op basis van aannames.

Na ontvangst wordt alleen de schedule-definitie uitgelezen en vastgelegd; daarna vertalen we de precieze configuratie naar het herbruikbare Blockly-blok en testen we de randgevallen.
