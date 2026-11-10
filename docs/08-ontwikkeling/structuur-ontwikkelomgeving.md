# Ontwikkelstructuur – Homey Dashboard

**Status:** voorgestelde basisstructuur, klaar voor technische implementatie  
**Datum:** 11 november 2026  
**Branch:** `phase_1_foundation`

## Doel en uitgangspunten

Deze structuur ondersteunt één zelfstandige applicatie met React/Vite, Node.js/Fastify en de officiële Homey Node.js-client. Frontend en backend blijven logisch gescheiden, maar worden als één productiecontainer geleverd.

De structuur is een startpunt. Bestanden en modules mogen tijdens implementatie worden toegevoegd wanneer dat nodig is; wijzigingen aan architectuur of projectscope worden eerst vastgelegd.

## Voorgestelde repository-indeling

```text
homey_dashboard/
├── docs/
├── src/
│   ├── client/                 # React-applicatie
│   │   ├── components/
│   │   ├── features/
│   │   ├── hooks/
│   │   ├── styles/
│   │   └── main.tsx
│   ├── server/                 # Fastify-applicatie
│   │   ├── routes/
│   │   ├── services/
│   │   ├── plugins/
│   │   └── index.ts
│   └── shared/                 # Gedeelde types en schema's
├── tests/
│   ├── unit/
│   ├── api/
│   └── fixtures/
├── config/
│   └── defaults/               # Niet-geheime standaardconfiguratie
├── Dockerfile
├── compose.yaml
├── compose.dev.yaml             # Ontwikkeloverrides, indien nodig
├── .dockerignore
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── tsconfig.json
└── vite.config.ts
```

De exacte submappen worden aangemaakt wanneer de bijbehorende code wordt gebouwd. Lege mappen hoeven niet vooraf in Git te worden opgenomen.

## Docker-werkwijze

### Ontwikkeling

- Docker Compose is de standaardmanier om de ontwikkelomgeving te starten.
- De ontwikkelconfiguratie moet frontend- en backendcode beschikbaar maken in de container en waar praktisch hot reload ondersteunen.
- Ontwikkelservices en eventuele debugpoorten worden alleen op localhost van de ontwikkelmachine gepubliceerd, tenzij daar bewust anders over wordt besloten.
- Fixtures/mockdata maken UI-ontwikkeling mogelijk zonder Homey-verbinding.
- Een expliciete ontwikkelmodus mag niet automatisch in productie worden ingeschakeld.

### Productie

- Eén uiteindelijke applicatiecontainer serveert de gebouwde frontend en de Fastify-backend.
- Multi-stage build: dependencies/buildtools blijven buiten de runtime-image.
- Runtime als niet-rootgebruiker.
- Persistente configuratie en status via een volume.
- Health endpoint en Docker health-check.
- Logs naar stdout/stderr.
- Geen ontwikkelserver, hot reload of debuginterface in de productie-image.

De definitieve poortbinding wordt pas gekozen nadat de server- en VLAN-situatie en eventuele bestaande reverse proxy zijn gecontroleerd.

## Omgevingsvariabelen

`.env.example` documenteert variabelenamen en veilige voorbeeldwaarden. Het bestand bevat nooit echte sleutels.

De eerste implementatie werkt minimaal de volgende configuratiegroepen uit:

| Groep | Doel | Geheim? |
|---|---|---|
| Applicatieomgeving | development/production en logniveau | Nee |
| HTTP-server | bind-adres en interne luisterpoort | Nee |
| Configuratiepad | locatie van persistente JSON-configuratie | Nee |
| Homey-verbinding | lokale Homey-adres-/verbindingsinstellingen | Afhankelijk van waarde |
| Homey API-key | authenticatie backend naar Homey | **Ja** |

Definitieve variabelenamen en standaardwaarden worden in code, schema-validatie en `.env.example` gezamenlijk vastgelegd. Er worden hier bewust geen poortnummers of Homey-URL's verzonnen.

Gevoelige waarden worden alleen door de backend gelezen. Ze mogen niet worden opgenomen in frontend-buildvariabelen, browserresponses, logs, fixtures of Git.

## Configuratie en persistente data

- Standaardwaarden en voorbeeldconfiguratie horen bij de repository en bevatten geen persoonlijke gegevens of secrets.
- Door de gebruiker gewijzigde instellingen worden buiten de container opgeslagen.
- Het configuratievolume blijft behouden bij het vervangen of opnieuw bouwen van de container.
- JSON-configuratie wordt bij opstart en bij wijzigingen gevalideerd tegen een versiebeheerd schema.
- Tijdelijke cache/laatst bekende Homey-waarden worden gescheiden gehouden van gebruikersinstellingen.
- Back-up en herstel worden vóór een productie-release beschreven en getest.

De exacte JSON-schema's worden opgesteld zodra de eerste dashboardinstellingen worden geïmplementeerd.

## Testopzet

Beoogde kwaliteitscontroles:

1. TypeScript typecontrole.
2. Lint- en formatcontrole (toolkeuze volgt bij package-inrichting).
3. Vitest unit- en componenttests.
4. Fastify API-tests zonder echte Homey.
5. Tests met fixtures voor apparaten, zones, capabilities en weerdata.
6. Configuratie- en schema-validatie.
7. Docker productie-build en health-check.
8. Afzonderlijke Homey-integratietests voor authenticatie, uitlezen, reconnect en toegestane acties.

Homey-integratietests mogen geen Flows starten of apparaten bedienen tenzij de test expliciet als actie-/acceptatietest is aangemerkt en de gebruiker daarvoor toestemming heeft gegeven.

## Eerste ontwikkelstappen

1. Maak package- en TypeScript-configuratie met lockfile.
2. Maak een minimale Fastify-server met health endpoint.
3. Maak een minimale React/Vite-pagina die via Fastify wordt geserveerd in productie.
4. Voeg Dockerfile en Compose-ontwikkelconfiguratie toe.
5. Voeg test- en typecheckscripts toe.
6. Bouw en start de container lokaal; controleer health endpoint en browserweergave.
7. Documenteer de eerste gemeten resource-/runtime-instellingen.
8. Start daarna pas de technische Homey-connectiviteitstest.

## Nog niet vastgelegd

- Definitieve poorten en hostbinding.
- Exacte Node.js-versie en packageversies.
- Lint/formatter-keuze.
- Namen en defaults van alle environment-variabelen.
- Definitieve Compose-profielen en hot-reload aanpak.
- Configuratieschema's en migratiebeleid.
- CI-provider en verplichte pipelinechecks.

Deze punten worden tijdens de eerste technische implementatie vastgesteld en bijgewerkt in deze documentatie.
