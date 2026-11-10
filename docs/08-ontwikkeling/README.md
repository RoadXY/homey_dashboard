# Ontwikkelomgeving – Homey Dashboard

**Status:** eerste versie van de ontwikkelrichtlijnen  
**Datum:** 11 november 2026  
**Branch:** `phase_1_foundation`

## Doel

Dit document beschrijft wat nodig is om aan Homey Dashboard te ontwikkelen en hoe de ontwikkelomgeving wordt ingericht. Het is geen installatiehandleiding voor Docker of Docker Compose.

De applicatie wordt primair ontwikkeld en getest met Docker. Daardoor hoeven Node.js en npm niet standaard rechtstreeks op de Ubuntu-host geïnstalleerd te worden; de exacte ontwikkelworkflow en benodigde containerdiensten worden bij de applicatiebasis vastgelegd.

## Benodigdheden

### Verplicht op de ontwikkelmachine

- **Git** om de repository en branches te beheren.
- **Docker Engine** om de applicatie- en ontwikkelcontainers te bouwen en uit te voeren.
- **Docker Compose** (Compose-plugin / `docker compose`) om de ontwikkelservices gezamenlijk te starten.
- Een editor/IDE voor TypeScript, React en Node.js, bijvoorbeeld Visual Studio Code.
- Een moderne browser voor controle van de dashboardinterface en browserontwikkeltools.
- Toegang tot de GitHub-repository `RoadXY/homey_dashboard` en de branch waarop wordt ontwikkeld.

Docker Engine en Docker Compose zijn dus ontwikkelvereisten. De installatie daarvan valt buiten dit document.

### Benodigd voor Homey-integratie

- Een bereikbare **Homey Pro 2023**.
- Netwerktoegang vanaf de Docker-host naar Homey via de door Homey ondersteunde lokale communicatie. De server en Homey bevinden zich in verschillende VLAN's; de benodigde gerichte netwerktoegang moet beschikbaar zijn.
- Een afzonderlijk aangemaakte Homey API-key met uitsluitend de noodzakelijke permissies.
- De API-key wordt lokaal als secret/environment-configuratie beschikbaar gemaakt aan de backend. Plaats deze nooit in Git, documentatie, frontendcode of screenshots.

De Homey-verbinding moet tijdens de eerste technische validatie worden getest. De exacte URL, poorten, API-permissies en verbindingsinstellingen worden pas vastgelegd nadat ze op het daadwerkelijke netwerk zijn geverifieerd.

## Aanbevolen ontwikkelwerkwijze

1. Clone de repository en werk op een feature branch vanaf de afgesproken projectbranch.
2. Gebruik Docker Compose om de ontwikkelomgeving te starten zodra de Compose-configuratie is toegevoegd.
3. Bewaar lokale instellingen en secrets in een niet-gecommitte lokaal bestand of een geschikte secretvoorziening.
4. Gebruik uitsluitend voorbeeldwaarden in `.env.example`; echte API-sleutels horen daar niet in.
5. Ontwikkel en test frontend en backend in kleine, afzonderlijke stappen.
6. Voer relevante tests en een Docker-build uit voordat wijzigingen worden gecommit.
7. Leg functionele besluiten, architectuurwijzigingen, testresultaten en afwijkingen vast in de projectdocumentatie op dezelfde branch.

## Omgevingsvariabelen en lokale configuratie

De applicatie krijgt een voorbeeldbestand met de benodigde variabelenamen, bijvoorbeeld `.env.example`. Dit bestand bevat geen echte secrets.

Een lokaal `.env`-bestand:
- wordt niet naar Git gecommit;
- bevat alleen ontwikkelinstellingen en lokale secrets;
- wordt waar mogelijk buiten de repository of met beperkte bestandsrechten bewaard;
- wordt door de backend gebruikt; secrets worden nooit naar de browser doorgestuurd.

De concrete variabelen, standaardwaarden en configuratievalidatie worden vastgelegd wanneer de eerste applicatiecode wordt toegevoegd.

## Ontwikkelen zonder Homey

De ontwikkelomgeving moet waar mogelijk ook zonder actieve Homey-verbinding kunnen draaien. Voor frontendontwikkeling en geautomatiseerde tests gebruiken we gesimuleerde of fixture-data. Dit voorkomt dat iedere UI-aanpassing afhankelijk is van de beschikbaarheid van Homey.

Een mock-/testmodus mag nooit ongemerkt in de productieomgeving actief zijn. De precieze implementatie en zichtbare status daarvan worden tijdens de bouw vastgelegd.

## Test- en kwaliteitscontroles

De exacte scripts worden in `package.json` vastgelegd zodra de applicatiebasis bestaat. De beoogde controles zijn:

- TypeScript typecontrole.
- Unit- en componenttests (Vitest).
- Backend/API-tests.
- Validatie van configuratie en ontbrekende/verkeerde environment-variabelen.
- Docker-image build.
- Container health-check.
- Integratietest met Homey, inclusief wegvallen en herstellen van de verbinding.
- Controle dat de Homey API-key niet in frontendbundels, logs of Git terechtkomt.

## Nog vast te leggen bij de applicatiebasis

- Exacte Node.js- en npm-versies voor gebruik in containers.
- Compose-profielen en services voor development en productie.
- Hot reload / live reload voor frontend en backend.
- Definitieve poortbinding voor de lokale ontwikkelwebsite.
- Bestandslocaties voor configuratie, fixtures en persistente status.
- Linting- en formatteringskeuze.
- CI-workflow en verplichte checks bij pull requests.

Deze punten worden technisch gekozen en gedocumenteerd voordat ze als vaste projectstandaard gelden.

## Afbakening

Dit document beschrijft de ontwikkelvereisten en werkwijze. Het bevat bewust geen installatie-instructies voor Docker Engine of Docker Compose. De productie-installatie en het beheer van de uiteindelijke container worden afzonderlijk gedocumenteerd.
