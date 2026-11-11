# Leesbaarheid op afstand – 11 november 2026

De gebruiker heeft de dashboardweergave getest met Chrome DevTools ingesteld op Samsung Galaxy Tab A 10.1 (1920 × 1200, landscape). Omdat het scherm vanaf circa 4–5 meter leesbaar moet zijn, zijn de typografische maten in de hoofdinterface vergroot.

## Aanpassingen

- Klok: grotere maximale en responsieve lettergrootte.
- Temperatuurwaarden: grotere cijfers in de vier tegels.
- Temperatuurlabels: ruimtenamen groter.
- Weerkaart: grotere buitentemperatuur, omschrijving, gevoelstemperatuur en windwaarde.
- Actiekaarten: grotere iconen én beter leesbare actielabels; kaarten iets hoger gemaakt om de tekst ruimte te geven.
- Datum, verbindingsstatus, paneelkop, lege-meldingenstatus en footerinformatie zijn eveneens vergroot.
- De bestaande 40/60-indeling, volgorde van kaarten en gegevenskoppelingen zijn behouden.

## Implementatie

- Bestand: `src/client/style.css`
- Commit: `37cda0c` op `phase_1_foundation`.

## Validatie

De gebruiker heeft de wijzigingen nog niet op de fysieke tablet getest. De huidige controle is via Chrome DevTools device emulation. Na ophalen van de commit moet de weergave op de echte Samsung Galaxy Tab A SM-T515 in landscape worden beoordeeld, bij voorkeur vanaf de normale kijkafstand van 4–5 meter. Indien de tekst in de praktijk te groot wordt of de actielabels te veel afbreken, worden de responsive groottes gericht bijgesteld.
