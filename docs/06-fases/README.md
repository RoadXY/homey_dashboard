# Projectfasering en actuele voortgang

**Peildatum:** 16 november 2026  
**Actieve fase:** **Fase 1 – Foundation en eerste dashboard**  
**Actieve branch:** `phase_1_foundation`  
**Statusoverzicht:** dit document is de enige centrale bron voor de actuele fase-indeling, de voortgang per fase en de vraag wat wel/niet is gerealiseerd.

> **Belangrijk:** de actieve projectfase blijft fase 1. Dat er inmiddels onderdelen uit latere fases zijn gebouwd, betekent niet automatisch dat fase 1 is afgerond of dat het project formeel naar een volgende fase is gegaan. De fase waarin een functionaliteit oorspronkelijk was gepland en de huidige implementatiestatus zijn twee verschillende zaken.

## 1. Samenvatting

Het project is aanzienlijk verder dan de oudere fasendocumentatie beschrijft. De applicatie is niet langer alleen een ontwerp of lege Docker-basis: er staat een werkende TypeScript/React/Fastify-applicatie met Homey-integratie, dashboardweergave, instellingen, Quick Actions, meetwaardetegels, weerinstellingen, meldingenverwerking, Blockly-functionaliteit en een eerste externe meldingen-API.

De actuele fase blijft fase 1 omdat de basisoplevering en de functionele nulmeting nog niet aantoonbaar volledig zijn afgerond. Met name de volledige en gecontroleerde mapping van de oorspronkelijke Home Assistant-dashboardlogica naar Homey, en de integrale praktijktest van alle onderdelen op de Ubuntu-server en tablet, zijn nog niet als afgerond aangetoond.

Tegelijkertijd zijn verschillende fase-2-onderdelen en een afgebakend onderdeel uit fase 4 al gerealiseerd. Die voortijdige realisatie wordt hieronder expliciet vermeld, zodat deze functionaliteit niet opnieuw als toekomstig werk wordt ingepland.

### Faseoverzicht

| Fase | Oorspronkelijk afgesproken scope | Huidige realisatie | Status |
|---|---|---|---|
| **1 – Foundation en eerste dashboard** | Docker-webapp, Homey-koppeling, basisdashboard, configuratie, Quick Actions, meetwaarden/weer, functionele port van de bestaande dashboardlogica en offlinegedrag | Applicatie en het merendeel van de basisfunctionaliteit zijn aanwezig. Volledige Home Assistant-naar-Homey-mapping en integrale acceptatie-/tabletvalidatie zijn nog niet afgerond. | **Actief – gedeeltelijk gerealiseerd** |
| **2 – Beheer en uitbreidingen** | Meldingenbeheer, visuele editor, dynamische voorwaarden en AND/OR-combinaties, uitbreidingen op configuratie/presentatie | Een groot deel is al gebouwd: beveiligde instellingen, meldingeneditor, Blockly-blokken, condition-model en opslag. Niet elk oorspronkelijk genoemd onderdeel is aantoonbaar afgerond. | **Grotendeels voortijdig gerealiseerd; resterende punten open** |
| **3 – Thema's en meertaligheid** | Vooraf ontworpen thema's en verdere taalondersteuning | i18n-infrastructuur en Nederlandse/Engelse vertaalbestanden zijn aanwezig. Semantische thematokens zijn voorbereid; themawisselaar en meerdere complete thema's ontbreken nog. | **Gedeeltelijk voorbereid/gerealiseerd** |
| **4 – Externe integratie en events** | Externe API voor dashboardmeldingen en aanvullende presentatie-/geluidsacties vanuit externe systemen | De externe Notifications API v1 is in code aanwezig, inclusief opslag, validatie, Bearer-authenticatie, endpoints, tests en OpenAPI-documentatie. Geluid-/presentatieopdrachten en overige event-ingangen zijn niet aangetoond. | **Gedeeltelijk gerealiseerd** |
| **5 – Camera en deurbel** | Live camerastreams en deurbel-popup via Homey | Onderzoek en architectuurdocumentatie zijn aanwezig. Er is geen fase-5-implementatie of Homey-configuratiewijziging vastgelegd. | **Niet gestart – onderzoek/documentatie aanwezig** |

## 2. Status en resterend werk van fase 1

Fase 1 is de huidige projectfase. De eerdere onderverdeling in fase 1A (basisdashboard) en fase 1B (inventarisatie en voorbereiding van meldingen) blijft nuttig om de oorspronkelijke oplevervolgorde te begrijpen, maar vormt geen aparte actuele projectfase.

### 2.1 Fase 1A – Werkend basisdashboard

Oorspronkelijk afgesproken:
- klok en datum;
- weerkaart;
- vier initiële temperatuurtegels;
- Homey- en dashboardserverstatus;
- acht functionele Quick Actions;
- een bruikbare Docker-webapp op de Ubuntu-server.

**Aantoonbaar gerealiseerd in de repository:**
- TypeScript-applicatie met React/Vite-client en Fastify-backend;
- productie-Dockerfile met gescheiden build- en runtime-image, non-root runtime en healthcheck;
- Docker Compose-configuratie en persistente gegevensopslag via `DATA_DIR`;
- Homey Pro-koppeling via de `homey-api`-client;
- dashboard met klok/datum, weerinformatie, meetwaardetegels, Quick Actions en meldingenpresentatie;
- Homey- en serverstatus-API's en realtime updates via Homey-events en SSE;
- Quick Actions met ondersteuning voor Homey Flows en directe apparaatacties;
- configuratie en server-side uitvoering van Quick Actions;
- meetwaardetegels met instelbaar aantal (2, 4 of 6), apparaat-/capability- en Logic-bronnen;
- configuratie van weerbronnen en weergaveopties.

**Nog niet als volledig afgerond aangetoond:**
- alle acht Quick Actions zijn in de live Homey-omgeving gecontroleerd op de definitief bedoelde Flow/apparaatactie en werking;
- de volledige oorspronkelijke Home Assistant-dashboardconfiguratie is één-op-één gemapt naar Homey, inclusief alle afwijkende bronentiteiten en samengestelde voorwaarden;
- alle offline-, herverbindings- en laatst bekende waarde-scenario's zijn integraal op de live installatie getest;
- de oorspronkelijke Home Assistant-mediakaarten zijn in het nieuwe dashboard bewust vervallen op basis van het latere ontwerpbesluit; dit is dus geen openstaande porttaak;
- de definitieve tablet-/Fully Kiosk-praktijktest en acceptatie van alle schermformaten zijn afgerond.

De codebasis bevat dus een vergaand basisdashboard, maar fase 1A wordt pas als volledig afgerond beschouwd wanneer de openstaande functionele controles zijn uitgevoerd en geaccepteerd.

### 2.2 Fase 1B – Meldingen inventariseren en voorbereiden

Oorspronkelijk afgesproken:
- alle conditionele Home Assistant-kaarten inventariseren;
- oorspronkelijke YAML en voorwaarden behouden als functionele nulmeting;
- Homey-bronnen en capabilities mappen;
- een versiebeheerd JSON-voorwaardenmodel opzetten;
- de meldingenlogica voorbereiden zonder de volledige visuele editor als voorwaarde voor fase 1A te maken.

**Gerealiseerd:**
- inventarisatie- en mappingdocumenten voor Home Assistant-entiteiten, meldingen en Homey-bronnen;
- JSON-configuraties voor meldingen in `config/notifications`;
- canoniek notification-v1-conditiemodel met vergelijkingen, AND/OR, NOT, weekdagen, tijdschema's en duurvoorwaarden;
- backendvalidatie en evaluatie van deze voorwaarden;
- afhandeling van actieve, inactieve en onbekende bronstatussen;
- Homey-broncatalogus voor apparaten, capabilities en Logic-variabelen;
- dashboardpresentatie en sortering van meldingen;
- tests voor de meldingenengine en conditionele bouwstenen.

**Nog open:**
- de volledige mapping en controle van alle relevante oorspronkelijke YAML-kaarten/voorwaarden naar concrete Homey-bronnen is niet als afgerond gedocumenteerd;
- resterende semantische verschillen of niet één-op-één te vertalen voorwaarden moeten expliciet worden afgehandeld;
- integrale praktijktest van alle overgenomen meldingsregels op de echte Homey Pro is nog niet als afgerond aangetoond.

## 3. Onderdelen uit latere fases die al zijn gerealiseerd

Deze onderdelen hoeven niet opnieuw als volledig toekomstig werk te worden behandeld. Hun oorspronkelijke fase blijft hieronder vermeld voor historische traceerbaarheid.

### 3.1 Oorspronkelijk fase 2 – Instellingen en meldingenbeheer

**Gerealiseerd of functioneel aanwezig:**
- PIN-beveiligde toegang tot instellingen;
- instellingenpagina's Algemeen, Snelle acties, Meldingen, Meetwaardetegels en Weer;
- opslaan van instellingen op de server in de persistente gegevensmap;
- meldingen selecteren, aanmaken, bewerken, in-/uitschakelen en verwijderen via de instellingeninterface;
- Blockly-editor die werkt op het canonieke notification-v1-model;
- bron-, vergelijkings-, AND-, OR-, NOT-, tijdschema- en duurblokken;
- dynamische bronselectie op basis van Homey-apparaten/capabilities en Logic-variabelen;
- server-side validatie en opslag van meldingenconfiguraties;
- waarschuwingen/badges voor uitgeschakelde meldingen en onbeschikbare Homey-bronnen;
- bescherming tegen navigeren met niet-opgeslagen editorwijzigingen;
- optionele zichtbaarheidstijd voor Blockly-meldingen en tijdelijke systeemfoutmeldingen;
- onderscheid tussen Blockly-, API- en systeemmeldingen in de interne gegevenslaag.

**Niet automatisch als voltooid aanmerken:**
- de volledige functionele acceptatie van iedere Blockly-combinatie en ieder randgeval;
- de afgesproken Homey Flow-aanlevering van meldingen is niet als volledig gerealiseerd aangetoond. De externe Notifications API is aanwezig, maar de daadwerkelijke Homey Flow-/clientintegratie moet nog worden gevalideerd;
- toekomstige Homey-aanlevering van meldingen. De externe API is een afzonderlijke implementatieroute en vervangt de nog te beoordelen integratie-/gebruikersscenario's niet;
- verdere uitbreidingen die alleen als ontwerp of wens zijn vastgelegd.

### 3.2 Oorspronkelijk fase 3 – i18n en themafundament

**Gerealiseerd:**
- vertaalinfrastructuur in de client;
- Nederlandse en Engelse vertaalbestanden;
- zichtbare interface-teksten grotendeels via vertaalresources;
- taalinstelling en taalkeuze-informatie in de applicatie;
- semantische CSS-tokens voor de instellingeninterface en status-/severity-kleuren;
- documentatie voor uitbreiding met aanvullende thema's.

**Nog niet gerealiseerd:**
- een complete themawisselaar met opgeslagen gebruikersvoorkeur;
- meerdere volledig uitgewerkte en geteste thema's, waaronder het afgesproken Homey-stijlthema;
- volledige meertalige acceptatie van alle interface-, fout- en randgevallen.

De aanwezigheid van i18n en thematokens betekent dus dat de technische basis deels klaar is, niet dat fase 3 als geheel is afgerond. In de oudere fasenotities staan bovendien tegenstrijdige taalafspraken: op sommige plekken is Engels de standaard bij installatie, op andere plekken wordt automatisch de Homey-taal gekozen. De huidige code-default is `automatic`; de definitieve gebruikersregel moet bij verdere fase-3-validatie eenduidig worden vastgelegd en met code en handleiding overeenkomen.

### 3.3 Oorspronkelijk fase 4 – Externe Notifications API

**Gerealiseerd in de codebasis:**
- versiepad `/api/v1/notifications`;
- GET, POST, PATCH en DELETE voor API-beheerde meldingen;
- Bearer-tokenauthenticatie via de bestaande tokencontrole;
- validatie van titel, bericht, severity en optionele vervaltijd;
- afzonderlijke persistente opslag in `DATA_DIR/api-notifications.json`;
- interne herkomstmarkering `source: "api"` en scheiding van API-, Blockly- en systeemmeldingen;
- samenvoegen van actieve API-meldingen met de bestaande dashboardpresentatie;
- expiratieverwerking en SSE-update-event;
- tests voor opslag, validatie, mutaties en expiratie;
- bijgewerkte OpenAPI-specificatie.

**Nog niet gerealiseerd/aangetoond:**
- alle overige externe event-domeinen uit het bredere ontwerp, zoals geluidsopdrachten en visuele presentatieacties;
- praktijktest met een daadwerkelijke externe client of Homey Flow/app;
- eventuele aanvullende event-ingangen die niet tot de Notifications API v1 behoren.

Daarom is alleen het Notifications API-deel van fase 4 als gerealiseerd aangemerkt, niet de volledige fase.

## 4. Toekomstige fases

### Fase 3 – Thema's en verdere meertaligheid

Resterende scope:
- vooraf ontworpen thema's, waaronder het afgesproken Homey-stijlthema;
- thema selecteren en de voorkeur persistent opslaan;
- alle thema's toetsen op contrast, statuskleuren, instellingen, Blockly en tabletweergave;
- volledige taalkeuze, automatische Homey-taaldetectie en fallbackgedrag valideren;
- vertaaldekking en Nederlandse/Engelse zoektermen/synoniemen afronden.

De bestaande i18n- en tokenimplementatie is een voorsprong, maar geen reden om de resterende fase-3-werkzaamheden over te slaan.

### Fase 4 – Externe integratie en presentatie-events

Resterende scope:
- overige afgesproken externe event-functies ontwerpen en implementeren;
- eventuele geluid-/presentatieopdrachten veilig en gecontroleerd afhandelen;
- API-authenticatie, autorisatie, validatie, foutcodes en OpenAPI-contract per domein controleren;
- integratie met externe clients en Homey-automatiseringen praktijktesten.

De reeds gebouwde Notifications API v1 blijft onderdeel van deze fase en moet bij verdere uitbreiding worden onderhouden; deze hoeft niet opnieuw vanaf nul te worden gebouwd.

### Fase 5 – Camera en deurbel

Voorlopige scope:
- via Homey ontsloten camerastreams onderzoeken en integreren;
- deurbel-popup met livevideo;
- eventuele deuropenactie uitsluitend na expliciete gebruikersactie;
- beveiliging, streamlevensduur, netwerkgedrag en tabletweergave testen.

De technische haalbaarheid en de officiële Homey-route voor consumptie van een camerastream door de eigen dashboardwebsite moeten eerst worden bevestigd. Tot die tijd blijft dit onderzoek, geen implementatiebelofte.

## 5. Statusdefinities

Gebruik in dit document consequent de volgende termen:

- **Gerealiseerd:** de functionaliteit is in de huidige code aanwezig. Dit zegt op zichzelf nog niet dat alle live-/acceptatietests zijn afgerond.
- **Gedeeltelijk gerealiseerd:** een afgebakend deel werkt of is gebouwd, maar onderdelen uit de afgesproken scope ontbreken nog.
- **Voorbereid:** architectuur, documentatie, ontwerp of technische basis is aanwezig, maar de bedoelde gebruikersfunctionaliteit is nog niet volledig gebouwd.
- **Niet gestart:** er is geen implementatie aangetoond. Eventuele analyse of ontwerpdocumentatie wordt afzonderlijk vermeld.
- **Actief:** dit is de fase waaraan het project op dit moment werkt. Een fase blijft actief totdat de resterende scope is gecontroleerd en expliciet als afgerond is vastgesteld.

## 6. Werkwijze voor het bijhouden van fases

1. Dit document is de enige centrale plek voor de actuele projectfase en de fasevoortgang.
2. Bij iedere relevante implementatie wordt de status hier bijgewerkt zodra de code en documentatie zijn gecontroleerd.
3. Andere documenten mogen de oorspronkelijke fase noemen als historische/planningscontext. Die verwijzing bepaalt niet de actuele projectstatus.
4. Een ontwerpbesluit, mockup, code-implementatie, groene CI-run en live praktijktest zijn verschillende bewijsvormen. Verwar deze niet met elkaar.
5. Een fase wordt pas afgesloten wanneer de afgesproken scope is gerealiseerd, relevante tests zijn uitgevoerd en openstaande uitzonderingen expliciet zijn geaccepteerd of verplaatst.
6. Werk dat al uit een latere fase is gerealiseerd, blijft als gerealiseerd gemarkeerd en wordt niet opnieuw als toekomstig werk ingepland.
7. De actieve ontwikkel- en documentatiebranch blijft `phase_1_foundation`. Wijzigingen voor dit project worden rechtstreeks op deze branch gecommit, overeenkomstig de server-updateprocedure.

## 7. Belangrijkste referenties

De volgende documenten bevatten detailinformatie en onderbouwing. Ze vervangen dit centrale statusoverzicht niet.

- [Projectoverzicht](../01-project/README.md)
- [Besluitenlog](../01-project/besluitenlog.md)
- [Architectuur](../02-architectuur/README.md)
- [Dashboardontwerp en functionele nulmeting](../03-dashboard/README.md)
- [Meldingenengine – implementatie](../03-dashboard/meldingen-engine-implementatie.md)
- [Blockly – databronnen en vergelijkingen](../03-dashboard/blockly-bouwsteen-databron-en-vergelijking.md)
- [Blockly – tijdschema's](../03-dashboard/blockly-bouwsteen-tijdschema.md)
- [Meldingen-API](../02-architectuur/meldingen-api.md)
- [Externe API en OpenAPI](../02-architectuur/externe-api-openapi.md)
- [Instellingen en configuratie](../04-configuratie/README.md)
- [Tablet en kiosk](../05-tablet/README.md)
- [Ontwerpgoedkeuring](../07-ontwerp/README.md)
- [Developer Guide](../10-ontwikkelaarshandleiding/README.md)

---

**Actuele conclusie (16 november 2026):** we werken nog in **fase 1**. De technische basis en een groot deel van het dashboard zijn gerealiseerd. Fase 1 is nog niet formeel afgerond door de resterende Home Assistant-naar-Homey-mapping en integrale praktijktests. Tegelijkertijd zijn grote delen van fase 2, de i18n-/themafundering uit fase 3 en de Notifications API uit fase 4 al voortijdig gerealiseerd.
