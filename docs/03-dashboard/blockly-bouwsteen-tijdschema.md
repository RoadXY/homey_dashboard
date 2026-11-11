# Blockly-bouwsteen – tijdschema's per dashboardmelding

**Status:** functioneel ontwerp, nog niet geïmplementeerd  
**Scope:** migratie van `schedule.boven_ramen_open` uit de oorspronkelijke Home Assistant-configuratie  
**Doel:** de oorspronkelijke planning per dashboardmelding afzonderlijk vastleggen, zodat elke melding later onafhankelijk in Blockly kan worden aangepast of geïmporteerd. De evaluatielogica mag technisch wel gedeeld zijn.

## 1. Functionele bedoeling

Het bovenramenschema is door de gebruiker aangewezen voor migratie. Het moet kunnen bepalen wanneer regels voor bovenramen relevant zijn. Het schema zelf is een tijdvenster/kalenderregel; het mag niet worden verward met Homey-Flow-timeoutvariabelen zoals `regen_ramenOpenTimout` of `regen_deurOpenTimeout`.

De weekplanning is door de gebruiker bevestigd via de Helper-instellingen: maandag t/m zaterdag 07:00–20:00 en zondag 08:00–20:00. Deze waarden vormen de initiële configuratie van elk van de vier onafhankelijke schema-instanties.

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
5. Onafhankelijke schema-instanties: elke melding heeft een eigen schema-instelling en eigen opgeslagen configuratie. De onderliggende evaluatiecode mag gedeeld zijn, maar wijzigingen aan het ene schema veranderen de andere niet.
6. Directe evaluatie bij laden en opnieuw evalueren bij tijdgrens/daggrens; de dashboardregel hoeft niet op een Homey-Flow-event te wachten.
7. Een duidelijke Blockly-weergave van de naam en instellingen, zodat de gebruiker later zelf de tijden/dagen kan aanpassen.

## 4. Opslag en runtime

- Sla schema's op in de bestaande dashboardconfiguratie (persistent volume), niet in Homey.
- Gebruik één gedeelde schema-evaluator in de backend/regellaag; voorkom dat elke dashboardkaart eigen tijdlogica implementeert. Dit is gedeelde programmacode, geen gedeelde schema-instantie.
- Het schema is alleen een voorwaarde voor dashboardzichtbaarheid. Het start, wijzigt of activeert geen Homey-Flow.
- De schema-editor en evaluator moeten onafhankelijk blijven van de visuele kaart waarop het schema wordt gebruikt.

## 5. Acceptatiecriteria

- Een gebruiker kan het schema “Boven ramen open” in Blockly openen en wijzigen.
- De gebruiker kan weekdagen, starttijd en eindtijd aanpassen.
- Een dashboardregel kan het schema als boolean-voorwaarde gebruiken.
- Het schema blijft na containerherstart behouden.
- Het schema werkt correct over middernacht en bij zomer-/wintertijd.
- Elk van de vier raamregels heeft een eigen schema-instantie met eigen instellingen.
- Een wijziging aan één melding wijzigt de andere drie schema's niet.
- Er worden geen Homey-apparaten of Flows aangestuurd.

## 6. Nog te bevestigen

1. De exacte weekdagen en begin-/eindtijden uit de oorspronkelijke HA-configuratie.
2. Of de oorspronkelijke schedule-definitie datumgrenzen, uitzonderingsdagen of een andere nuance bevat.
3. De vier schema-instanties worden afzonderlijk aan de vier raamregels gekoppeld; de Blockly-bouwsteen zelf blijft generiek inzetbaar.

## 7. Relatie met temperatuurregels

De vier koude-kamermeldingen hebben een aparte, expliciete voorwaarde: temperatuur **lager dan 16 °C**. Deze drempel wordt als configureerbare numerieke waarde gemodelleerd. Het tijdschema “Boven ramen open” wordt niet automatisch op de koude-kamermeldingen toegepast.


## 8. Broncontrole – 11 november 2026

De projectbaseline `ha-baseline-analyse.md` bevestigt dat `schedule.boven_ramen_open` als `on`-voorwaarde voorkomt in de meldingen:
- Raam Tess niet open
- Raam Bram niet open
- Raam Ouders niet open
- Dakraam Sem niet open

De gebruiker heeft op 11 november 2026 de volgende YAML-statusmomentopname van de entiteit aangeleverd:

```yaml
state: 'on'
last_changed: '2026-11-11T06:00:00.001Z'
last_updated: '2026-11-11T06:00:00.001Z'
attributes:
  editable: true
  next_event: '2026-11-11T20:00:00+01:00'
  icon: mdi:window-closed
  friendly_name: Boven ramen open
```

Deze momentopname bevestigt dat de entiteit op dat moment `on` was en dat Home Assistant 20:00 uur (offset `+01:00`) als volgende omschakeling rapporteerde. De statusmomentopname bevat op zichzelf geen volledig weekpatroon.

### 8.1 Terugkerende weekplanning bevestigd via Helper-instellingen

Een screenshot van de Helper-instellingen voor `schedule.boven_ramen_open`, aangeleverd door de gebruiker op 11 november 2026, toont de volgende wekelijkse tijdblokken:

| Weekdag | Start | Einde |
|---|---:|---:|
| Maandag | 07:00 | 20:00 |
| Dinsdag | 07:00 | 20:00 |
| Woensdag | 07:00 | 20:00 |
| Donderdag | 07:00 | 20:00 |
| Vrijdag | 07:00 | 20:00 |
| Zaterdag | 07:00 | 20:00 |
| Zondag | 08:00 | 20:00 |

Dit is de concrete planning die we voor de migratie aanhouden. De screenshot toont één dagelijks tijdvenster per weekdag. Er zijn in deze weergave geen aanvullende tijdvensters of datumuitzonderingen zichtbaar; eventuele elders ingestelde uitzonderingslogica is hiermee niet vastgesteld.

### 8.2 Gevolgen voor de Blockly-bouwsteen

De initiële configuratie wordt vier keer afzonderlijk aangemaakt, één keer per raamregel:
- Naam: **Boven ramen open**
- Maandag t/m zaterdag: **07:00–20:00**
- Zondag: **08:00–20:00**
- Uitgang: boolean actief/inactief op basis van de lokale datum en tijd.

De evaluator moet de tijdzone van de dashboardconfiguratie gebruiken en correct omgaan met zomer-/wintertijd. De vier raamregels krijgen elk hun eigen boolean-schema-voorwaarde. Alle vier starten met dezelfde overgenomen weekplanning, maar zijn daarna onafhankelijk aanpasbaar. Het schema stuurt geen Homey-apparaten of Flows aan.

De eerder voorgestelde Blockly-bouwsteen blijft aanpasbaar: de gebruiker moet later de tijden en dagen kunnen wijzigen zonder code aan te passen.
