# Dashboardfoutmeldingen boven de meldingenkaart

**Status:** gebruikersbesluit en inventarisatie bestaande implementatie  
**Datum:** 15 november 2026  
**Branch:** `phase_1_foundation`

## 1. Doel en gebruikersbesluit

De rode zone direct boven de dashboardkaart **Meldingen** wordt de centrale plek waar fouten worden getoond die optreden tijdens het gebruik van het dashboard. De gebruiker heeft expliciet bevestigd dat deze plek niet bedoeld is als algemene Homey-notificatiefeed, maar als herkenbare foutzone voor de werking van onze eigen dashboardapplicatie.

Daaronder vallen in ieder geval fouten uit de dashboardfrontend en -backend, fouten bij het ophalen of verwerken van dashboardgegevens, fouten in communicatie met Homey die dashboardfunctionaliteit verstoren en fouten bij het uitvoeren van Quick Actions. Een fout die door Homey of een apparaatdriver wordt teruggegeven valt eronder wanneer die optreedt als gevolg van een dashboardactie of dashboardverzoek.

Niet bedoeld zijn zelfstandige Homey-appmeldingen, Homey-tijdlijnberichten of Flow-fouten die buiten het dashboard ontstaan en geen verband hebben met een dashboardactie of dashboardverzoek.

**Huidige situatie versus doel:** de bestaande rode foutbalk (`action-error-list`) toont momenteel alleen tijdelijke Quick Action-uitvoeringsfouten. Algemene dashboard/serverfouten en de Homey-verbindingswaarschuwing worden momenteel op een andere plek (bij de klok) getoond. Het gebruikersbesluit is om de foutzone als centrale plek voor dashboardgerelateerde fouten te hanteren; de benodigde uitbreiding en eventuele verplaatsing zijn nog niet geïmplementeerd.

Quick Actions zijn:
- een Standard Flow starten;
- een Advanced Flow starten;
- een apparaat-capability direct instellen (boolean, number, enum of string).

De backend retourneert bij een mislukte uitvoering een fouttekst in `{ error: string }` met HTTP-status 502 (na de lokale configuratiecontroles kan ook 404 of 409 optreden). De frontend leest `error` en toont die tekst letterlijk in een rode melding. Een netwerkfout of onleesbare response kan ook rechtstreeks als browserfouttekst in dezelfde balk terechtkomen.

## 2. Volledige inventaris van expliciete dashboardfouten

Onderstaande teksten zijn letterlijk overgenomen uit de huidige implementatie in `src/server/homey.ts` en `src/server/index.ts`.

### 2.1 Algemene verbinding en configuratie

| Fouttekst | Wanneer |
|---|---|
| `Homey is niet verbonden.` | De backend kan geen actieve Homey Web API-sessie gebruiken, ook niet na een verbindingspoging. |
| `Flow-configuratie ontbreekt.` | De Quick Action is van type Flow, maar heeft geen Flow-ID of een ongeldig Flow-type. |
| `Apparaatconfiguratie ontbreekt.` | De Quick Action bevat geen geldig apparaat-ID of capability-ID. |
| `Deze Quick Action is nog niet ingesteld.` | De opgeslagen Quick Action mist verplichte instellingen. |

### 2.2 Standard Flow en Advanced Flow

| Fouttekst | Wanneer |
|---|---|
| `De geselecteerde Flow bestaat niet of is uitgeschakeld.` | De opgeslagen Standard Flow-ID komt niet meer voor in Homey of de Flow is uitgeschakeld. |
| `De geselecteerde Advanced Flow bestaat niet of is uitgeschakeld.` | De opgeslagen Advanced Flow-ID komt niet meer voor in Homey of de Advanced Flow is uitgeschakeld. |

Een fout die Homey zelf teruggeeft tijdens `triggerFlow` of `triggerAdvancedFlow` wordt eveneens doorgegeven als fouttekst. De exacte inhoud daarvan is niet door het dashboard vastgelegd en kan per Homey/API-situatie verschillen.

**Belangrijke grens:** het succesvol afronden van de API-aanroep betekent dat Homey het startverzoek heeft geaccepteerd. Het dashboard ontvangt hiermee geen gegarandeerd eindresultaat van alle latere acties binnen de Flow. Een apparaatfout die pas tijdens de verdere Flow-uitvoering optreedt, verschijnt daarom niet automatisch als rode Quick Action-foutmelding.

### 2.3 Apparaat en capability

| Fouttekst | Wanneer |
|---|---|
| `Het geselecteerde apparaat bestaat niet meer.` | Het ingestelde apparaat-ID staat niet meer in de actuele Homey-inventaris. |
| `Het geselecteerde apparaat is niet beschikbaar.` | Homey rapporteert `available === false` voor het apparaat. |
| `De geselecteerde capability wordt niet meer ondersteund.` | De capability staat niet meer in de capabilitylijst van het apparaat. |
| `Deze capability is niet wijzigbaar.` | De capability ontbreekt in de metadata of Homey rapporteert niet expliciet `setable === true`. |
| `De actuele aan/uit-status van Homey is onbekend; Toggle is niet uitgevoerd.` | Bij een Toggle-opdracht kan de actuele capabilitywaarde niet als boolean worden gelezen. |
| `Dit type apparaatbediening wordt niet ondersteund.` | De capability heeft een datatype buiten boolean, number, enum en string. |

### 2.4 Ongeldige of niet-toegestane waarden

| Fouttekst | Wanneer |
|---|---|
| `Ongeldige numerieke waarde.` | Een numerieke opdracht bevat geen eindig getal. |
| `Waarde ligt onder het toegestane minimum.` | De numerieke waarde is lager dan de door Homey opgegeven capability-minimumwaarde. |
| `Waarde ligt boven het toegestane maximum.` | De numerieke waarde is hoger dan de door Homey opgegeven capability-maximumwaarde. |
| `Ongeldige keuze voor deze capability.` | Een enum-waarde komt niet voor in de toegestane enum-opties. |
| `Deze actie verwacht tekst.` | Een string-capability ontvangt geen stringwaarde. |
| `Deze actie verwacht een aan/uit-waarde.` | Een boolean-capability ontvangt geen geldige boolean en er is geen geldige on/off/toggle-modus. |
| `De aan/uit-opdracht bevat geen geldige boolean-waarde.` | De uiteindelijke booleanwaarde is ongeldig. |

### 2.5 Overige uitvoeringsfouten

| Fouttekst / bron | Wanneer |
|---|---|
| `Quick Action niet gevonden.` | Het action-ID uit de uitvoer-URL bestaat niet in de opgeslagen Quick Actions. |
| `Homey-actie uitvoeren mislukt.` | Fallback wanneer een exception geen bruikbare `Error.message` heeft. |
| Fouttekst uit Homey Web API / driver | Bijvoorbeeld een door Homey, de driver of de gekoppelde app afgewezen capability-opdracht. De dashboardbackend geeft `Error.message` door. |
| Browser-/netwerkfouttekst | Wanneer de browser de backend niet kan bereiken of de response niet als JSON kan verwerken. |

De foutteksten uit Homey Web API, apparaatdrivers en browser/netwerk zijn **niet als vaste lijst te enumereren**. De onderliggende componenten kunnen eigen foutmeldingen teruggeven; het dashboard bewaart of vertaalt die op dit moment niet naar een gesloten foutcatalogus.

## 3. Wat verschijnt niet in deze rode foutbalk?

De volgende situaties kunnen elders in het dashboard zichtbaar zijn of technisch relevant zijn, maar vullen de rode Quick Action-foutbalk niet automatisch:

- Een apparaat dat offline of unavailable raakt zonder dat op dat moment een Quick Action wordt uitgevoerd.
- Een capability die een alarmstatus aangeeft, bijvoorbeeld een `alarm_*`-capability.
- Een Homey Flow die zelfstandig faalt nadat deze via een trigger is gestart.
- Een fout in een willekeurige Homey-app die geen fout teruggeeft aan de Quick Action-aanroep.
- Een fout bij het ophalen van meldingen uit `/api/notifications`: die wordt als melding in het meldingenpaneel weergegeven met de bestaande laadfoutpresentatie, niet als Quick Action-foutbalk.
- Een fout bij het ophalen van Quick Action-statussen: de polling houdt de laatst bekende status vast en toont geen rode foutmelding.
- Een Homey-tijdlijnmelding of notificatie van Homey zelf. De huidige implementatie haalt deze gegevens niet op.

## 4. Technische foutketen

1. De gebruiker klikt op een ingestelde Quick Action.
2. De frontend voert `POST /api/homey/quick-actions/:id/execute` uit.
3. De backend zoekt de opgeslagen Quick Action op en controleert of de configuratie aanwezig is.
4. `executeQuickAction()` controleert de Homey-verbinding, Flow of apparaat, capability, wijzigbaarheid en waarde.
5. De backend voert `triggerFlow`, `triggerAdvancedFlow` of `setCapabilityValue` uit.
6. Bij een exception stuurt de route een foutresponse terug. De frontend toont de ontvangen fouttekst in `action-error` met `role="alert"`.
7. De gebruiker kan de melding handmatig sluiten. De bestaande instelling voor tijdelijke dashboardmeldingen bepaalt daarnaast of de melding automatisch verloopt.

De foutbalk kan meerdere actieve foutmeldingen tegelijk tonen. De frontend bewaart maximaal de laatste 50 tijdelijke meldingen.

## 5. Betekenis van de Homey API

De officiële Homey Web API documentatie beschrijft de API als interface om onder meer apparaten te bedienen en Flows te starten. De voorbeeldcode voert een capability-opdracht uit met `device.setCapabilityValue(...)`. De Homey Apps SDK documentatie laat daarnaast expliciet zien dat een apparaatdriver bij een mislukte capability-opdracht een exception kan gooien. Daardoor kan de fouttekst afhankelijk zijn van de specifieke driver of integratie.

Dit ondersteunt twee verschillende foutgroepen:
- **Dashboard- en validatiefouten:** vaste teksten die wij zelf in de backend produceren.
- **Homey-/driverfouten:** dynamische teksten die vanuit de API, Homey of een apparaatdriver terugkomen.

## 6. Functionele uitgangspunten voor de centrale dashboardfoutzone

1. De foutzone is bedoeld voor fouten die het gebruik of de werking van het dashboard beïnvloeden. De bron kan frontend, backend, netwerk/API of Homey-integratie zijn.
2. Quick Action-fouten blijven onderdeel van deze zone.
3. Een fout uit Homey of een driver wordt opgenomen wanneer deze terugkomt op een dashboardactie of dashboardverzoek. Zelfstandige Homey-meldingen buiten het dashboard vallen buiten scope.
4. De foutzone blijft gescheiden van de reguliere meldingenkaart: Blockly-, externe Notifications API- en gebruikersmeldingen zijn geen technische dashboardfouten.
5. Foutteksten van Homey/driver zijn dynamische, onbetrouwbare invoer: toon ze als tekst, niet als HTML.
6. Registreer waar zinvol intern de foutcategorie, bron, tijdstip en betrokken dashboardactie. Log nooit API-sleutels of Authorization-headers.
7. Voeg geen fouttypen toe aan een vaste catalogus zonder bewijs uit een concrete API-response, log of codepad.

### Nog niet besloten / nader uit te werken

- Of meerdere identieke fouten worden samengevoegd of afzonderlijk getoond.
- Of fouten automatisch verdwijnen, alleen handmatig sluitbaar zijn of beide mogelijkheden ondersteunen.
- Of de foutzone een maximumaantal zichtbare fouten krijgt.
- Welke fouten als technisch detail worden getoond en welke een gebruiksvriendelijke tekst krijgen.
- Of fouten worden bewaard na een pagina-refresh of containerherstart.
- Welke niet-fatale situaties (bijvoorbeeld tijdelijk ontbrekende meetwaarde) als fout gelden in plaats van als status/onbekend.

Deze punten worden niet stilzwijgend ingevuld; ze vragen zo nodig om een afzonderlijk gebruikersbesluit.

## 7. Bronnen

### Eigen implementatie
- `src/client/main.tsx` — Quick Action-uitvoering, tijdelijke foutstatus en rode foutbalk.
- `src/server/index.ts` — route `POST /api/homey/quick-actions/:id/execute`.
- `src/server/homey.ts` — verbinding, Flow-start, apparaat-/capabilityvalidatie en capability-uitvoering.
- `docs/02-architectuur/meldingen-api.md` — onderscheid tussen `blockly`, `api` en `system` als interne meldingsherkomst.

### Officiële Homey-documentatie
- [Homey Web API – documentatie en voorbeeld voor apparaatbediening](https://api.developer.homey.app/).
- [Homey Apps SDK – Drivers & Devices](https://apps.developer.homey.app/the-basics/devices) — beschrijft capability-listeners en het door de driver teruggeven van een fout door een exception.
- [Homey Apps SDK – Capabilities](https://apps.developer.homey.app/the-basics/devices/capabilities) — beschrijft capability-typen en de betekenis van capabilities.

---

**Samenvatting:** de gebruiker heeft de zone boven de meldingenkaart aangewezen als centrale plek voor fouten tijdens het gebruik van het dashboard. De huidige implementatie toont daar alleen Quick Action-fouten; algemene dashboard-/serverfouten en verbindingswaarschuwingen staan nog elders. De inventaris van vaste Quick Action-foutteksten blijft nuttig als technische onderbouwing, maar de toekomstige scope is breder: dashboardgerelateerde fouten uit frontend, backend, netwerk en Homey-integratie.
