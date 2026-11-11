# Tijdelijke Docker-buildfout – 11 november 2026

## Waarneming

De gebruiker heeft de updateprocedure meerdere keren uitgevoerd. De updates tot en met commit `c6258db` zijn succesvol gebouwd en gestart. Daarbij rapporteerde de updateprocedure:
- container actief;
- API healthcheck HTTP 200;
- Homey online.

Bij de volgende update is commit `0f1c613` succesvol opgehaald en fast-forward toegepast. De Git-werkkopie was schoon. Tijdens het daaropvolgende Docker-buildproces trad direct deze fout op:

```
NotFound: forwarding Ping: no such job j9fan0u2qyf3zwxjeeh9wmybt
```

De updateprocedure eindigde met exitcode 17 tijdens "Docker image bouwen en container starten".

## Beoordeling

De fout trad op bij de communicatie met de Docker-daemon / Docker-buildinfrastructuur, voordat de buildstappen zichtbaar waren gestart. De aangeleverde uitvoer toont geen compileerfout in de dashboardcode. De daaropvolgende containerlogs bevatten normale HTTP 200-responses van de API en Homey-endpoints.

De update naar commit `0f1c613` is dus wel lokaal opgehaald, maar een nieuwe image/container op basis van die commit is met deze poging niet bevestigd. De bestaande container kan nog de eerder gebouwde versie draaien.

## Vervolg

- Controleer of Docker weer normaal reageert met `docker info`.
- Voer daarna de bestaande updateprocedure opnieuw uit: `~/bin/homey-dashboard-update.sh`.
- Controleer dat de build succesvol eindigt, de container draait en de API healthcheck HTTP 200 geeft.
- Controleer vervolgens de Homey-status via `curl -s http://localhost:5173/api/homey/status | jq`.

Geen wijzigingen aan Homey-apparaten, variabelen of Flows zijn nodig of uitgevoerd voor dit incident.
