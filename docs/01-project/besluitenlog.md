

## Gebruikersbevestiging – Remeha-statuscapabilities (11 november 2026)

- De gebruiker heeft de actuele capabilitylijst van Homey-apparaat **Remeha ketel** gedeeld (ID `ed9e603f-0930-4a37-8282-86298c6ecf56`).
- `boiler_state` (boolean, Ketel toestand) wordt gebruikt voor de statusweergave verwarming/ketel actief-inactief.
- `DHW_state` (boolean, Tap water toestand) wordt gebruikt voor de statusweergave tapwater actief-inactief.
- Voor beide boolean-bronnen geldt `true` = actief en `false` = inactief. Onbekende of niet-beschikbare waarden worden afzonderlijk als onbekend behandeld.
- `DHW_mode` (enum, Tap water comfort modus) met screenshotwaarde `off` is aanvullende modusinformatie, niet de actuele tapwatervraag.
- De getoonde waarden zijn een momentopname. Het dashboard leest de capabilities uitsluitend read-only uit en wijzigt Homey niet.


## Gebruikersbevestiging – Remeha-weergave blijft volgens plan (11 november 2026)

De gebruiker bevestigt dat we bij het bestaande plan blijven: het dashboard toont uitsluitend verwarming/ketel actief-inactief (`boiler_state`) en tapwater actief-inactief (`DHW_state`). De aanvullende capability `DHW_mode` wordt niet als aparte dashboardinformatie weergegeven.


## Gebruikersbesluit – regenwaarschijnlijkheid uit Homey Open-Meteo (11 november 2026)

- Homey-apparaat **Raamsdonksveer**, ID `b2fa37bb-45e2-4fda-87b7-24dcecf64420`, driver `homey:app:com.spkes.openMeteo:weather`, is de gekozen bron.
- De capability `measure_precipitation_probability` (number) levert de regenwaarschijnlijkheid.
- De bestaande voorwaarde **groter dan 25%** blijft ongewijzigd. De screenshotwaarde 80 is uitsluitend een momentopname.

## Gebruikersbesluit – weerconditie pushen via toekomstige Homey-app (11 november 2026)

- De eerder besproken weer-icoonmatrix vervalt.
- De dashboardcontainer krijgt in de toekomstige architectuur een API-endpoint om de actuele weerconditie te ontvangen van de toekomstige Homey-app.
- De Homey-app krijgt een Flow-kaart **‘Zet huidige weerconditie naar’** met een dropdown van alle door het dashboard ondersteunde weercondities.
- De gebruiker kiest in Homey de actuele conditie die uit diens eigen weerprovider komt en laat die via de Flow-kaart naar de container sturen.
- De lijst met ondersteunde canonieke condities, API-contract, authenticatie, validatie en gedrag bij ontbrekende/verouderde updates worden later technisch uitgewerkt. Dit is een vastgelegde ontwerpkeuze; de app, kaart en endpoint zijn nog niet geïmplementeerd.



## Gebruikersakkoord – 16 canonieke weercondities (11 november 2026)

De gebruiker keurt de voorgestelde lijst van 16 weercondities goed voor het dashboard en de toekomstige Homey Flow-dropdown. De canonieke API-codes zijn: `sunny`, `mostly_sunny`, `partly_cloudy`, `cloudy`, `overcast`, `fog`, `drizzle`, `rain`, `heavy_rain`, `showers`, `thunderstorm`, `hail`, `snow`, `snow_showers`, `sleet`, `windy`. De Flow-kaart toont Nederlandse labels en verstuurt de Engelse code. Dag/nacht blijft een aparte dimensie; onbekende codes overschrijven de laatst bekende geldige conditie niet.

**Voorlopig API-advies, nog niet definitief besloten:** `POST /api/v1/weather/condition` met JSON `{"type":"cloudy"}`, Bearer-tokenauthenticatie, validatie tegen de vaste enum en servergegenereerde ontvangsttijd. Succes: HTTP 200; ongeldige body/code: 400; ontbrekende of ongeldige token: 401. De endpoint moet idempotent omgaan met herhaalde updates. Definitieve keuze en implementatie volgen na afstemming.



## Gebruikersbesluit – benoemde Bearer-tokens beheren in Settings (11 november 2026)

- Er komt een plek in de dashboardinstellingen om Bearer-tokens met een eigen naam te genereren en te beheren.
- De tijdelijke Homey Logic HTTP POST-kaart kan headers meesturen; de gebruiker stelt zelf de Authorization-header in en maakt de JSON-body handmatig.
- Voorbeeld: header `Authorization: Bearer <token>`, body `{"type":"cloudy"}`.
- Beveiligingsontwerp: tokenwaarde cryptografisch willekeurig genereren, volledig geheim alleen bij aanmaak tonen, alleen een veilige hash bewaren, intrekken/verwijderen mogelijk maken en geheimen nooit loggen. Ontwerp uitbreidbaar houden met scopes/rechten; de eerste token kan beperkt worden tot de weerconditie-API.
- De exacte UI, opslag, scopes en implementatie worden nog technisch uitgewerkt.


## Inventarisatie oorspronkelijke HA-YAML – vraag 1

De gebruiker bevestigt behoud van: drogerstatus/voortgang/resterende tijd; Truus werkstatus/ophaalverzoek; Remeha verwarming/warm tapwater; airco keuken en zolder met bedrijfsstatus/ingestelde temperatuur; neerslagkans boven 25%; muurtablet-batterij onder 25%; tuinhuislamp langer dan 5 minuten aan; CO₂ woonkamer boven 1200 ppm. Geen uitsluitingen bij deze vraag.

De droger wordt uitsluitend getoond wanneer hij actief is/draait. De YAML-bronvoorwaarde is `sensor.droger_dryer_machine_state == run`; de getoonde eindtijd komt uit `sensor.droger_dryer_completion_time`.


## Inventarisatie HA-YAML – Truus

De gebruiker bevestigt de bestaande YAML-zichtbaarheidslogica ongewijzigd: gewone Truus-status bij alle statussen behalve `Sleeping`, `Charging`, `Unavailable` en `Standby`; aparte melding **‘Truus wil opgehaald worden!’** bij `Standby`. Geen opmerkingen of uitzonderingen toegevoegd.


## Inventarisatie HA-YAML – airco's

De gebruiker besluit dat airco keuken en airco zolder uitsluitend zichtbaar zijn wanneer actief: status is niet `off` en niet `unavailable`. Beide tonen bedrijfsstatus en ingestelde temperatuur. Hiermee wordt het oorspronkelijke verschil in YAML-zichtbaarheidsvoorwaarden gelijkgetrokken.


## Inventarisatie HA-YAML – batterij muurtablet

Besluit: behoud de oorspronkelijke zichtbaarheid van de batterijkaart; alleen tonen wanneer het batterijniveau lager is dan 25%. Geen aanvullende opmerkingen.


## Inventarisatie HA-YAML – tuinhuislamp en Blockly

De melding voor de tuinhuislamp blijft conform de oorspronkelijke regel: lamp langer dan 5 minuten aan. Bij de technische uitwerking moet de duurvoorwaarde configureerbaar zijn in het gedeelde, versieerbare notificatiemodel, dat zowel JSON-configuratie als de toekomstige Blockly-editor gebruikt. Geen afzonderlijke Blockly-evaluator of afwijkende logica.


## Inventarisatie HA-YAML – CO₂ woonkamer

Besluit: behoud de oorspronkelijke melding wanneer de CO₂-waarde hoger is dan 1200 ppm. Geen aanvullende opmerkingen.


## Inventarisatie HA-YAML – regenmelding

Besluit: behoud de oorspronkelijke regenmelding wanneer de neerslagkans hoger is dan 25%. Geen aanvullende opmerkingen.


## Architectuurbesluit – volledige Blockly-bewerkbaarheid van meldingen

De gebruiker besluit dat alle meldingen later met Blockly bewerkt moeten kunnen worden. Alle grenswaarden en tijdsvoorwaarden moeten instelbaar zijn. Dit is een generieke architectuureis voor het volledige notificatieaanbod. Ontwerp één versieerbaar notificatiemodel met bewerkbare voorwaarden, operatoren, grenswaarden, duur- en tijdsvoorwaarden. De JSON-configuratie en toekomstige Blockly-editor gebruiken hetzelfde model en dezelfde backend-evaluator. De uit de oorspronkelijke Home Assistant YAML bevestigde waarden blijven de initiële instellingen/defaults om bestaand gedrag te behouden; ze mogen niet als hardgecodeerde, niet-bewerkbare waarden worden geïmplementeerd.


## Inventarisatie HA-YAML – vier raamwaarschuwingen

Besluit: de vier raamwaarschuwingen blijven afzonderlijke meldingen (raam Tess, raam Bram, raam ouders en dakraam Sem), elk volledig zelfstandig bewerkbaar via Blockly. De bestaande voorwaarden en tijdschema's blijven per melding gescheiden. Geen aanvullende opmerkingen.


## Inventarisatie HA-YAML – weergave en sortering raamwaarschuwingen

Besluit: de vier raamwaarschuwingen verschijnen als losse meldingen zonder gezamenlijke kop. De al bestaande dashboardregel uit `docs/03-dashboard/README.md` is leidend voor de volgorde: kritiek → waarschuwing → info; binnen hetzelfde niveau nieuwste activeringstijdstip/tijd van binnenkomst eerst. Er wordt niet aanvullend gegroepeerd op ruimte of onderwerp. De vier meldingen blijven afzonderlijke Blockly-bewerkbare regels.


## Inventarisatie HA-YAML – meldingsniveau directe contactmeldingen

Besluit: de zes directe contactmeldingen **Voordeur open**, **Deur tuinhuis open**, **Grote Bram**, **Grote Tess**, **Grote Ouders open** en **Raam Sem open** krijgen allemaal het niveau **waarschuwing**. Geen aanvullende opmerkingen. De oorspronkelijke voorwaarden en zelfstandige meldingen wijzigen hierdoor niet.


## Inventarisatie HA-YAML – meldingsniveau wateralarmen

Besluit: **Wateralarm wasmachines!** en **Wateralarm vaatwasser!** krijgen beide het meldingsniveau **kritiek**. De meldingen blijven afzonderlijk en behouden de bestaande voorwaarden. Geen aanvullende opmerkingen.


## Inventarisatie HA-YAML – meldingsniveau vriezermelding

Besluit: de melding **Vriezer keuken warm!** krijgt het niveau **kritiek**. De bestaande bronkoppeling en voorwaarde blijven ongewijzigd. Geen aanvullende opmerkingen.


## Inventarisatie HA-YAML – meldingsniveau CO₂ woonkamer

Besluit: **CO₂ woonkamer hoog!** krijgt het niveau **waarschuwing**. De bestaande drempel (>1200 ppm), bronkoppeling en voorwaarde blijven ongewijzigd. Geen aanvullende opmerkingen.


## Inventarisatie HA-YAML – meldingsniveau regenmelding

Besluit: **Kans op neerslag** (neerslagkans >25%) krijgt het niveau **info**. De bestaande Homey-bron en drempel blijven ongewijzigd. Geen aanvullende opmerkingen.


## Inventarisatie HA-YAML – meldingsniveau lage slaapkamer-temperaturen

Besluit: de vier meldingen **Slaapkamer Bram**, **Slaapkamer Tess**, **Ouderslaapkamer** en **Slaapkamer Sem** krijgen allemaal niveau **info**. De bestaande grens van <12 °C en bronkoppelingen blijven ongewijzigd. Geen aanvullende opmerkingen.


## Inventarisatie HA-YAML – meldingsniveau tuinhuislamp

Besluit: de melding voor de tuinhuislamp die langer dan vijf minuten aan staat krijgt niveau **info**. De bestaande duurvoorwaarde blijft ongewijzigd en configureerbaar in het gedeelde notificatiemodel. Geen aanvullende opmerkingen.


## Inventarisatie HA-YAML – meldingsniveau raam-niet-open-waarschuwingen

Besluit: de vier afzonderlijke meldingen **Raam Tess niet open**, **Raam Bram niet open**, **Raam ouders niet open** en **Dakraam Sem niet open** krijgen niveau **info**. Hun bestaande voorwaarden en tijdschema's blijven ongewijzigd. Geen aanvullende opmerkingen.


## Inventarisatie HA-YAML – meldingsniveau Achterdeur open

Besluit: **Achterdeur open** krijgt niveau **waarschuwing**. De oorspronkelijke gecombineerde voorwaarde (deur open én buitentemperatuur <18 °C of >24 °C) blijft ongewijzigd. Geen aanvullende opmerkingen.


## Inventarisatie HA-YAML – meldingsniveau slaapkamerlampen

Besluit: **Lamp Sem staat aan** en **Lamp Bram staat aan** krijgen beide niveau **info**. De bestaande voorwaarden (lamp aan én het bijbehorende slaaptijdschema actief) blijven ongewijzigd. Geen aanvullende opmerkingen.


## Inventarisatie HA-YAML – meldingsniveau batterij muurtablet

Besluit: de melding bij een batterijniveau van de muurtablet lager dan 25% krijgt niveau **waarschuwing**. De oorspronkelijke grenswaarde (<25%) blijft ongewijzigd. Geen aanvullende opmerkingen.


## Inventarisatie HA-YAML – meldingsniveau Truus wil opgehaald worden!

Besluit: **Truus wil opgehaald worden!** krijgt niveau **waarschuwing**. De bestaande voorwaarde blijft ongewijzigd: de werkstatus van Truus is exact `Standby`. Geen aanvullende opmerkingen.


## Inventarisatie HA-YAML – meldingsniveau Zolder koud

Besluit: **Zolder koud** krijgt niveau **info**, overeenkomstig de vier slaapkamer-temperatuurmeldingen. De oorspronkelijke HA-bronvoorwaarde (`binary_sensor.temperatuur_zolder_laag`) en kaartverwijzing (`climate.airco_zolder_thermostaat`) blijven geregistreerd; de exacte Homey-vertaling moet nog worden vastgesteld. Geen aanvullende opmerkingen.

## Gebruikersbesluit – grenswaarde Vriezer keuken warm! (12 november 2026)

Voor de kritieke melding **Vriezer keuken warm!** geldt in de dashboardmigratie: activeer bij een Homey-temperatuur van **meer dan 10 °C** en deactiveer bij **10 °C of lager**. De gekozen bron is Homey-apparaat **Koelkast keuken temperatuur** (ID `64fc846e-01b0-438a-9114-4498ea8005e7`), capability `measure_temperature`. De oorspronkelijke HA-dashboard-YAML bevatte een binaire zichtbaarheidstrigger (`binary_sensor.vriezer_keuken_temperatuur_hoog`) maar geen numerieke grens; 10 °C is een nieuw gebruikersbesluit. De Logic-variabele `Vriezer_tempAlarm` wordt niet als bron gebruikt.

## Gebruikersbevestiging – CO₂ woonkamer hoog! (12 november 2026)

Voor **CO₂ woonkamer hoog!** wordt Homey-apparaat **Multisensor woonkamer** met capability `measure_co2` gebruikt. De oorspronkelijke YAML-activeringsgrens blijft **hoger dan 1200 ppm**. De melding is actief bij >1200 ppm en inactief bij ≤1200 ppm. Het eerder vastgestelde meldingsniveau blijft **waarschuwing**.

## Gebruikersbevestiging – Kans op neerslag (12 november 2026)

Voor de melding **Kans op neerslag** gebruikt het dashboard Homey-apparaat **Raamsdonksveer** (ID `b2fa37bb-45e2-4fda-87b7-24dcecf64420`), capability `measure_precipitation_probability`. De oorspronkelijke grens **meer dan 25%** blijft behouden. De melding is actief bij >25% en inactief bij ≤25%. Het eerder vastgestelde meldingsniveau blijft **info**.

## Gebruikersbevestiging – buitentemperatuurbron Achterdeur open (12 november 2026)

Voor **Achterdeur open** wordt Homey-apparaat **Weer** met capability `measure_temperature` gebruikt als buitentemperatuurbron. De oorspronkelijke YAML-voorwaarde blijft ongewijzigd: achterdeurcontact open én (buitentemperatuur <18 °C óf >24 °C). De temperatuurgrenzen vormen een OR-groep; deze wordt via AND gecombineerd met het open deurcontact. Het meldingsniveau blijft **waarschuwing**.

## Gebruikersbevestiging – Zolder koud (12 november 2026)

Voor **Zolder koud** gebruikt het dashboard Homey-apparaat **Temperatuur Sem** (ID `ba9336e2-f4ed-417c-bba6-3fafb735e61a`), capability `measure_temperature`. De melding is actief bij een temperatuur **lager dan 12 °C**. De oorspronkelijke kaartverwijzing naar de ingestelde temperatuur van `climate.airco_zolder_thermostaat` blijft behouden voor de weergave. Het eerder vastgestelde meldingsniveau blijft **info**.

## Herbruikbare Blockly-bouwsteen voor bovenramenschema (12 november 2026)

Het oorspronkelijke Home Assistant-schema `schedule.boven_ramen_open` wordt in Homey gereproduceerd als herbruikbare Blockly-bouwsteen met instelbare dagen en tijden. Dashboardcondities blijven strikt gebaseerd op de oorspronkelijke YAML; Homey Flows zijn geen bron voor deze logica.

## Wateralarm wasmachine – bronkeuze (12 november 2026)

Voor **Wateralarm wasmachines!** is de afzonderlijke Homey-**Water sensor wasmachine** met capability `alarm_water` bevestigd als bron. De wasmachine zelf wordt niet als wateralarmbron gebruikt. De oorspronkelijke YAML-voorwaarde blijft leidend en het meldingsniveau blijft **kritiek**. Exact apparaat-ID en actuele waarde moeten nog in de Homey-inventarisatie worden geverifieerd.


## Verduidelijking – weerconditie via gedocumenteerde API (12 november 2026)

De gebruiker bevestigt de gewenste werkwijze voor het weerconditieveld:

- De dashboardcontainer biedt een versieerbaar endpoint `POST /api/v1/weather/condition` waarmee een gebruiker of toekomstige Homey-app de actuele conditie instelt.
- Het endpoint wordt beschreven met een OpenAPI 3.x-specificatie. Swagger UI wordt beschikbaar gemaakt als interactieve API-documentatie/testinterface. OpenAPI is het machineleesbare contract; Swagger UI is de gebruikersinterface voor dat contract.
- De gebruiker kiest een waarde uit de vaste lijst van 16 reeds goedgekeurde canonieke codes: `sunny`, `mostly_sunny`, `partly_cloudy`, `cloudy`, `overcast`, `fog`, `drizzle`, `rain`, `heavy_rain`, `showers`, `thunderstorm`, `hail`, `snow`, `snow_showers`, `sleet`, `windy`.
- API-clients sturen uitsluitend de canonieke code; de dashboardinterface vertaalt de zichtbare labels via de bestaande i18n-catalogi. De conditie zelf is dus een gestandaardiseerde waarde en geen vrije Homey-tekst.
- De toekomstige Homey-app biedt dezelfde vaste lijst als Flow-dropdown en stuurt de gekozen code naar het endpoint. De gebruiker kan het endpoint eerder ook rechtstreeks vanuit een Homey Logic HTTP POST-kaart of Swagger UI testen.
- Dag/nacht blijft een afzonderlijke dimensie en maakt geen deel uit van de conditie-enum.
- De eerder vastgelegde beveiligingsrichting blijft gelden: benoemde Bearer-tokens, alleen de hash opslaan, geheim alleen bij aanmaak tonen, intrekken mogelijk maken en de eerste token beperken tot de weerconditie-API.
- Het endpoint, OpenAPI-document, Swagger UI, tokenbeheer en de toekomstige Homey-app zijn nog niet geïmplementeerd. HTTP-statuscodes, request-schema, token-scopes, opslag en stale-updatebeleid moeten bij de technische uitwerking worden vastgelegd.

De huidige Homey-capabilitymapping in `src/server/weather.ts` is bestaande functionaliteit en wordt niet stilzwijgend als het nieuwe push-contract beschouwd. Bij implementatie moet expliciet worden bepaald hoe de API-ingestelde conditie de dashboardweergave overneemt en hoe fallback/bronuitval werkt.


## Gebruikersbesluit – actualiteit weerconditie is verantwoordelijkheid Homey Flow (12 november 2026)

- Het dashboard past geen eigen timeout, TTL of automatische verversingslogica toe op de via `POST /api/v1/weather/condition` ingestelde conditie.
- De gebruiker is verantwoordelijk voor een correct ingerichte Homey Flow die bij relevante veranderingen en/of volgens de gewenste frequentie een nieuwe conditie verstuurt.
- Het dashboard bewaart en toont de laatst geldig ontvangen conditie totdat een volgende geldige update binnenkomt of de gebruiker deze expliciet vervangt.
- De ontvangsttijd mag als technische metadata worden geregistreerd/getoond, maar wordt niet gebruikt om de conditie automatisch ongeldig te verklaren.

## Architectuurbesluit – OpenAPI als contract voor alle HTTP API-routes (12 november 2026)

- Alle HTTP API-routes van de dashboardbackend worden opgenomen in één OpenAPI 3.x-specificatie, niet alleen de externe integratie-endpoints.
- Dit omvat ook routes die uitsluitend door de eigen frontend worden gebruikt. Deze worden in OpenAPI duidelijk gegroepeerd als interne dashboard-API en zijn niet automatisch een ondersteund extern integratiecontract.
- De API-specificatie wordt versiebeheerd in de GitHub-repository en is de source of truth voor request-/response-schema's, statuscodes, authenticatie en voorbeelden.
- De toekomstige Homey-app/integratie-endpoints worden afzonderlijk als externe integratie-API gegroepeerd en krijgen expliciete compatibiliteits-/versieafspraken.
- Swagger UI is de interactieve documentatie-interface. GitHub Pages mag de statische documentatie en OpenAPI-specificatie hosten. De Try it out-functie op GitHub Pages wordt niet als gegarandeerd beschouwd voor een API op het lokale LAN; browser-origin, HTTPS, CORS en Private Network Access kunnen dit blokkeren. De lokale Swagger UI of API-client blijft de testoptie.
- Server-Sent Events `GET /api/events` worden ook gedocumenteerd, inclusief eventnamen en payloadschema's; OpenAPI beschrijft de HTTP-route, met aanvullende documentatie voor de event-stream.


## Implementatiebesluit – OpenAPI en weercondities API (12 november 2026)

De eerste implementatie is toegevoegd op phase_1_foundation:

- OpenAPI 3.1-specificatie: docs/api/openapi.yaml.
- Swagger UI statische frontend: docs/api/index.html, bedoeld voor doorzoeken/inzicht.
- GitHub Pages publicatieworkflow: .github/workflows/pages.yml, inclusief OpenAPI-lintstap.
- Weercondities endpoint: GET en POST /api/v1/weather/conditions.
- POST gebruikt Bearer-authenticatie via de lokale omgevingsvariabele WEATHER_API_TOKEN; deze eerste versie gebruikt één serverconfiguratietoken. Beheer van meerdere benoemde tokens via Settings blijft toekomstig werk.
- Condities worden persistent opgeslagen in DATA_DIR/weather/condition.json; geen automatische TTL. Homey Flow is verantwoordelijk voor updatefrequentie.
- API-conditie heeft voorrang op de bestaande Homey-weermapping; zonder API-conditie blijft de Homey-bron actief.

De code en documentatie zijn gecommit, maar Docker-build/runtimegedrag en GitHub Pages-publicatie moeten nog door de gebruiker/CI worden gevalideerd. Zie de technische documentatie voor teststappen.


## Besluit – Weather API-tokenbeheer via Instellingen (12 november 2026)

Weather API Bearer-tokens worden beheerd via de PIN-beveiligde Instellingenpagina. De server genereert per token een willekeurig geheim; alleen de hash wordt persistent opgeslagen. Het geheim wordt één keer getoond. Tokens kunnen afzonderlijk worden ingetrokken en zijn uitsluitend geldig voor de write-endpoint voor weercondities. De bestaande WEATHER_API_TOKEN-variabele blijft tijdelijk ondersteund om bestaande integraties niet abrupt te breken. Zie docs/08-ontwikkeling/eerste-applicatiebasis.md voor de technische uitwerking en validatiestatus.


## UI-correctie – Weather API-tokenformulier (12 november 2026)

Op basis van de tablet-screenshot is het tokennaamveld teruggebracht tot een normale invoerhoogte (48 px). Het label staat boven het veld; de knop staat ernaast op dezelfde rij en blijft binnen de tokenkaart. Op smalle schermen stapelt de knop onder het veld en vult deze de beschikbare breedte. De tokenkaart krijgt een vaste inhoudshoogte in plaats van mee te krimpen met de systeemstatuskaart.

## GitHub Pages – diagnose workflowfout (12 november 2026)

De GitHub Actions-log van run 43250294307 (job 131293937025) bevestigt dat de fout optreedt in **Configure GitHub Pages**, vóór OpenAPI-lint, artifact-upload en deployment. GitHub retourneert eerst 404 bij het ophalen van de Pages-site en daarna **Resource not accessible by integration** bij het aanmaken ervan. De workflowtoken heeft wel Pages: write, maar mag de Pages-site niet via deze API aanmaken. Daarom probeert de workflow Pages niet langer automatisch in te schakelen. Een repository-eigenaar moet de Pages-site eenmalig handmatig activeren via Settings → Pages en de bron op GitHub Actions zetten. Daarna kan de workflow opnieuw worden uitgevoerd. Dit is een repository-instelling/rechtenprobleem, geen fout in de OpenAPI-specificatie.


## Definitief besluit – Weather API is enige bron voor de weerconditie (12 november 2026)

De gebruiker kiest ervoor om uitsluitend de Weather API te gebruiken voor het bepalen en tonen van de weerconditie.

- Alleen `POST /api/v1/weather/conditions` kan de actieve canonieke conditie instellen; de bestaande Bearer-tokenvalidatie, enum-validatie en persistente opslag blijven van kracht.
- `GET /api/weather` leest uitsluitend de laatst geldig via de API opgeslagen conditie.
- Als nog geen geldige API-update is ontvangen, toont het dashboard de vertaalde status `unknown`; er is geen terugval naar Homey-waarden.
- De Homey-capabilities `conditioncode_text` en `description` worden niet meer gebruikt voor conditietekst, conditieclassificatie of het weericoon. Homey blijft wel de bron voor aanvullende meetwaarden zoals buitentemperatuur, gevoelstemperatuur en wind.
- De JSON-configuratie `config/weather/weather-mapping.json` en de bijbehorende backendmapping zijn verwijderd.
- De laatst ontvangen geldige API-conditie blijft actief tot een volgende geldige update; geen TTL of automatische vervaltijd. Homey Flow/integratie is verantwoordelijk voor de updatefrequentie.
- De legacy i18n-sleutels `weather.condition.clear` en `weather.condition.wind` zijn niet meer nodig, omdat ze geen canonieke API-condities zijn. Ze worden ook uit bestaande persistente locale-bestanden verwijderd bij de eerstvolgende containerstart; alle overige eigen vertalingen blijven behouden.

Dit besluit vervangt de eerdere implementatiekeuze waarbij de Homey-capabilitymapping als fallback actief bleef.


## 2026-11-13 – Inklapbaar instellingenmenu
- Het Homey Dashboard-logo en de merknaam in de instellingen-topbalk fungeren als schakelaar voor het linkermenu.
- Op desktop klapt het menu in tot een smalle rail met uitsluitend de navigatie-iconen; opnieuw klikken herstelt de volledige labels en breedte.
- Op smalle schermen blijft de bestaande horizontale navigatie intact; de schakelaar verandert daar niets.
- Navigatie-iconen zijn verduidelijkt. Voor Meldingen gebruiken we het bel-icoon (mdi-bell-outline), passend bij meldingen/waarschuwingen.
- De actieve pagina blijft visueel gemarkeerd. Dit is een presentatiewijziging; routes en instellingenlogica blijven ongewijzigd.


## Navigatieherziening instellingen (13 november 2026)

De instellingen navigeren voortaan rechtstreeks per functie, in deze vaste volgorde:
1. Algemeen — `/settings/general`
2. Snelle acties — `/settings/quick-actions`
3. Meldingen — `/settings/notifications`
4. Temperatuurtegels — `/settings/measurement-tiles`
5. Weer — `/settings/weather`

Het verzamelmenu-item **Dashboard** vervalt; de twee nog relevante onderdelen (Snelle acties en Temperatuurtegels) zijn zelfstandige menu-items. De menu-items Apparaten, Homey en Systeem vervallen eveneens. Informatie over Homey- en dashboardstatus blijft op de pagina Algemeen staan waar die al onderdeel is van het overzicht; er is geen bestaande statusfunctionaliteit verwijderd.

De pagina Weer is als placeholder toegevoegd. De toekomstige instellingen zijn alvast benoemd: buitentemperatuur, gevoelstemperatuur, weericoon/-omschrijving, wind, luchtvochtigheid, neerslag, luchtdruk en zonsopkomst/-ondergang. De placeholder doet nog geen instellingenwijzigingen.

### Compatibiliteit oude URL's
Bestaande bookmarks blijven bruikbaar via client-side canonicalisatie:
- `/settings/dashboard` en `/settings/dashboard/quick-actions` → `/settings/quick-actions`
- `/settings/dashboard/measurement-tiles` → `/settings/measurement-tiles`
- oude routes `/settings/devices`, `/settings/homey` en `/settings/system` → `/settings/general`

De browseradresbalk wordt met `history.replaceState` bijgewerkt; de pagina blijft binnen de bestaande beveiligde instellingen-sessie.

### i18n-opruiming
De ongebruikte sleutels `settings.dashboard`, `settings.devices`, `settings.homey` en `settings.weatherTab` zijn uit zowel de Nederlandse als Engelse vertaling verwijderd. Er zijn nieuwe gelokaliseerde labels en beschrijvingen voor de Weer-placeholder toegevoegd. `settings.system` blijft behouden omdat deze nog in de statusweergave op Algemeen wordt gebruikt.


## Herstel inklapbaar instellingenmenu (13 november 2026)
Bij controle bleek dat de merknaam in de instellingen-header nog een gewone `div` was en dat de bestaande `sidebarCollapsed`-state niet aan de hoofdcontainer was gekoppeld. Daardoor leek de merknaam klikbaar via de cursorstijl, maar kon de klik de layout niet wijzigen; op touchapparaten kon de tekst worden geselecteerd. Dit is hersteld door de merknaam een echte knop te maken, de state aan de shell-class te koppelen en de sidebar via `aria-controls` te koppelen. Tekstselectie en de standaard touch-highlight zijn uitgeschakeld. De actie werkt op schermen waarop de navigatie links staat (vanaf 701 px); bij de horizontale mobiele navigatie is deze knop bewust niet actief.


## Instellingenpagina's: titeluitlijning en responsive werkruimte (13 november 2026)
- Op de functionele instellingenpagina's is de dubbele paginakop (decoratief icoon + grote titel) verwijderd; de toelichtende regel blijft staan en lijnt links uit met de kaart eronder. Dit is centraal via `.quick-settings-page` gestyled en geldt voor Snelle acties, Temperatuurtegels en de Weer-placeholder.
- De instellingencontent is een CSS-container geworden. De twee-koloms werkruimtes schakelen op basis van de werkelijk beschikbare contentbreedte (dus ná aftrek van het linkermenu) over naar één kolom. Daardoor kunnen de lijst-/bewerkkaart en Voorbeeld-kaart niet meer naast of over elkaar heen worden gedrukt wanneer het venster smaller wordt.
- In de smalle layout krijgen de kaarten een automatische hoogte en staat de Voorbeeld-kaart onder de lijst/editor; geen vaste minimale hoogte die onnodige overlap of lege ruimte veroorzaakt.


## Herstel lege instellingenpagina na sidebar-aanpassing (13 november 2026)
- Oorzaak: de klikbare `.settings-brand`-knop met `sidebarCollapsed`-state was per ongeluk in `SettingsPinGate` terechtgekomen. Die component heeft deze state niet; hierdoor ontstond bij renderen `ReferenceError: sidebarCollapsed is not defined` en bleef de pagina leeg.
- Herstel: de PIN-gate gebruikt weer een statische merkweergave. De klikbare merkknop staat nu in `GeneralSettingsPage`, waar `sidebarCollapsed` en `setSidebarCollapsed` daadwerkelijk bestaan.
- De sidebar-toggle blijft alleen actief op desktopbreedtes (vanaf 701 px), met toegankelijke `aria-expanded`- en `aria-controls`-attributen.


## Algemeen-instellingen – responsive uitlijning (13 november 2026)
De Algemeen-pagina gebruikt container queries op `.settings-content` zodat de layout rekening houdt met de beschikbare breedte ná aftrek van de zijbalk. Bij een contentbreedte tot 900 px stapelen Taal en Datum en tijd, worden de formulierrijen flexibel en loopt de Systeemstatus over naar drie kolommen met detail op een tweede regel. Onder 520 px komen labels boven hun invoervelden en worden de kaartpadding en statusrij compacter. Hiermee voorkomen we dat vaste minimumkolommen keuzelijsten buiten hun kaart drukken wanneer de browserbreedte of het DevTools-paneel de inhoud beperkt.
