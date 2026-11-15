# Centrale dashboardfoutzone

**Status:** gebruikersbesluit vastgelegd; centrale uitbreiding nog niet geïmplementeerd  
**Datum:** 15 november 2026  
**Doelbranch:** `phase_1_foundation`

## 1. Functioneel doel en scope

De rode zone direct boven de dashboardkaart **Meldingen** is aangewezen als de centrale presentatieplek voor fouten die ontstaan tijdens het gebruik van het dashboard.

De foutzone is bedoeld voor fouten die de werking van het dashboard of een door de gebruiker gestarte dashboardactie beïnvloeden. De bron kan de frontend, backend, netwerk/API-laag of Homey-integratie zijn.

Binnen scope vallen in ieder geval:
- fouten bij het ophalen, verwerken of presenteren van dashboardgegevens;
- fouten in communicatie met Homey die dashboardfunctionaliteit verstoren;
- fouten bij het uitvoeren van Quick Actions;
- Homey Web API- of driverfouten die terugkomen als gevolg van een dashboardactie of dashboardverzoek.

Buiten scope vallen:
- zelfstandige Homey-appmeldingen en Homey-tijdlijnberichten;
- Flow-fouten die buiten het dashboard ontstaan en niet door een dashboardactie of dashboardverzoek worden teruggegeven;
- reguliere inhoud van de Meldingen-kaart, waaronder Blockly-, API- en systeemmeldingen die als gebruikersmeldingen zijn bedoeld.

De foutzone is dus geen algemene Homey-notificatiefeed. Het criterium is de relatie met het gebruik en de werking van het dashboard.

## 2. Huidige implementatie

In `src/client/main.tsx` bestaat de rode foutpresentatie als `action-error-list`, boven `notifications-panel`. De items gebruiken de klasse `action-error`, `role="alert"` en een sluitactie.

De bestaande zone wordt momenteel alleen gevuld met tijdelijke fouten van Quick Action-uitvoeringen. De centrale foutzone zoals hierboven beschreven is nog niet volledig gerealiseerd.

Andere bestaande fout-/statuspresentaties:
- `loadError` en `homeyOnline` worden momenteel als `connection-warning` bij de klok getoond;
- fouten bij Quick Action-statuspolling worden opgevangen, waarbij de laatst bekende status behouden blijft;
- fouten bij het laden van de reguliere meldingen worden bij het meldingenpaneel afgehandeld en niet als Quick Action-fout getoond.

Verplaatsing en/of uitbreiding van deze foutpresentaties naar de centrale zone is nog werk voor een volgende implementatiestap.

## 3. Bestaande Quick Action-foutketen

De relevante backendroute is:

```http
POST /api/homey/quick-actions/:id/execute
```

De route in `src/server/index.ts` zoekt de opgeslagen Quick Action op en voert de actie uit. De uitvoering in `src/server/homey.ts` kan onder meer:
- een Standard Flow starten via `triggerFlow`;
- een Advanced Flow starten via `triggerAdvancedFlow`;
- een apparaat-capability instellen via `setCapabilityValue`.

De backend controleert onder andere:
- of Homey verbonden is;
- of de Quick Action-configuratie aanwezig is;
- of de geselecteerde Flow bestaat en ingeschakeld is;
- of het apparaat bestaat en beschikbaar is;
- of de capability bestaat en wijzigbaar is;
- of het waardetype en de waarde geldig zijn, inclusief numerieke grenzen en enum-opties.

Bij fouten retourneert de route een foutresponse met `{ error: string }`. Afhankelijk van het pad komen onder meer HTTP 404, 409 of 502 voor. De frontend leest de fouttekst en toont deze in de bestaande foutzone. Netwerkfouten of onleesbare responses kunnen eveneens een fouttekst opleveren.

De volledige inventaris van vaste en dynamische foutteksten staat in [homey-foutmeldingen.md](../03-dashboard/homey-foutmeldingen.md). Gebruik die inventaris als bron; dupliceer de lange catalogus niet in meerdere handleidingen.

## 4. Richtlijnen voor de toekomstige centrale afhandeling

1. Alle dashboardgerelateerde fouten moeten via één herkenbare frontend-presentatielaag in de zone boven de Meldingen-kaart terechtkomen.
2. Behoud het onderscheid tussen fouten, waarschuwingen en normale statussen. Een apparaatstatus of ontbrekende meetwaarde is niet automatisch een technische fout.
3. Neem Homey-/driverfouten alleen op wanneer ze voortkomen uit een dashboardactie of dashboardverzoek.
4. Behandel foutteksten uit Homey, drivers en netwerkresponses als onbetrouwbare tekst. Render deze als tekst en nooit als HTML.
5. Leg waar zinvol intern foutcategorie, bron, tijdstip en betrokken dashboardactie vast.
6. Log geen API-tokens, Authorization-headers of andere geheimen.
7. Laat de centrale foutzone losstaan van de reguliere meldingen-engine en de Notifications API.

## 5. Nog open ontwerpbesluiten

De volgende punten zijn nog niet door de gebruiker vastgesteld en mogen niet zonder afstemming als definitief gedrag worden geïmplementeerd:
- deduplicatie van identieke fouten;
- automatische timeout, handmatig sluiten of een combinatie daarvan;
- maximumaantal gelijktijdig zichtbare fouten;
- keuze tussen technische en gebruiksvriendelijke foutteksten;
- bewaren van fouten na refresh of containerherstart;
- classificatie van niet-fatale situaties, zoals tijdelijk ontbrekende meetwaarden.

## 6. Relevante code en documentatie

- `src/client/main.tsx` — foutpresentatie, tijdelijke meldingen en Quick Action-uitvoering.
- `src/server/index.ts` — `POST /api/homey/quick-actions/:id/execute`.
- `src/server/homey.ts` — Homey-verbinding, Flow-start, apparaat-/capabilityvalidatie en uitvoering.
- [Dashboardfoutmeldingen – inventarisatie en gebruikersbesluit](../03-dashboard/homey-foutmeldingen.md)
- [Besluitenlog](../01-project/besluitenlog.md)

## 7. Implementatiestatus

Dit document beschrijft zowel de vastgelegde doelstelling als de huidige situatie. De centrale foutzone is als gebruikersbesluit vastgelegd; de uitbreiding van de bestaande Quick Action-foutbalk naar alle relevante dashboardfouten is nog niet uitgevoerd. Werk dit hoofdstuk bij zodra de implementatie verandert.
