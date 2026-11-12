# Quick Actions – implementatie

Branch: `phase_1_foundation`

## Doel
De acht Quick Actions in het dashboard worden beheerd via Instellingen → Dashboard → Snelle acties. De ingestelde configuratie is leidend voor zowel de instellingen-preview als de knoppen op het dashboard.

## Frontend-koppeling
- Het dashboard leest de acties via `GET /api/dashboard/quick-actions`.
- De acht dashboardknoppen worden nu opgebouwd uit de opgehaalde `quickActions`-configuratie in plaats van een vaste lijst.
- Per knop worden het ingestelde pictogram en de aangepaste naam getoond. Als de naam leeg is, wordt de standaardvertaling gebruikt.
- Een klik voert de actie uit via `POST /api/homey/quick-actions/:id/execute`.
- Tijdens uitvoering worden knoppen tijdelijk uitgeschakeld; fouten worden in het dashboard getoond via de bestaande foutmelding.

## Flow-zoekfunctie
- Boven de Flow-keuzelijst staat een zoekveld.
- De zoekopdracht filtert op een deel van de Flow-naam (substring), zonder onderscheid tussen hoofdletters en kleine letters.
- De filter wordt direct toegepast terwijl de gebruiker typt.
- Een reeds geselecteerde Flow blijft in de keuzelijst beschikbaar, ook als die niet overeenkomt met de huidige zoekterm.
- Voorbeeld: zoeken op `zon` vindt onder meer `Zon onder`, `Zon op`, `Gezond eten`, `TV aan zondag 20:00` en `Water geven zonnebloemen`, mits deze Flows in de Homey-catalogus aanwezig zijn.
- De zoekinterface heeft Nederlandse en Engelse vertalingen.

## Backend en opslag
De bestaande backend blijft verantwoordelijk voor configuratievalidatie en opslag in `data/dashboard-actions.json`. De acht vaste actie-ID's blijven behouden. Flow- en apparaatbediening gebruiken de bestaande catalogus- en uitvoerfuncties.

## Betrokken bestanden
- `src/client/main.tsx`
- `src/client/style.css`
- `src/client/locales/nl.json`
- `src/client/locales/en.json`
- `src/server/quick-actions.ts` (bestaande opslag/validatie)
- `src/server/index.ts` (bestaande API-routes)
- `src/server/homey.ts` (bestaande Homey-catalogus en uitvoering)

## Teststatus en aandachtspunten
De wijzigingen zijn naar GitHub gepusht. Er is vanuit deze wijziging geen Docker-build of runtime-test op de Ubuntu-server uitgevoerd. Na het ophalen van de branch moet de container opnieuw gebouwd en gestart worden. Controleer daarna:
1. Dat alle acht ingestelde knoppen op het dashboard zichtbaar zijn.
2. Dat naam en pictogram overeenkomen met de configuratie.
3. Dat een Flow-actie en een apparaatactie daadwerkelijk uitgevoerd worden.
4. Dat zoeken op `zon` de genoemde gedeeltelijke matches teruggeeft.
5. Dat opslaan en herstarten de configuratie behouden.

De zoekfunctie kan alleen Flows tonen die door Homey in de bestaande catalogus worden teruggegeven.
