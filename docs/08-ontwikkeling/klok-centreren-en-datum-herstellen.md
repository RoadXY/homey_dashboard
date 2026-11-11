# Klok centreren en datum herstellen – 11 november 2026

De gebruiker signaleerde dat na het minimaliseren van de klokkaart de tijd niet meer verticaal gecentreerd stond en de datum was verdwenen.

Oorzaak:
- De CSS-regel voor `.clock` bevatte `margin: auto 0 7px`, waardoor de tijd naar beneden werd geduwd.
- De datum was in de JSX verwijderd tijdens het opschonen van de statuslabels.

Correctie:
- De datum is teruggezet onder de tijd, met Nederlandse dag-/datum-/maand-/jaarnotatie.
- Tijd en datum zijn samengebracht in één `.clock-content`-groep.
- Deze groep wordt als geheel horizontaal en verticaal gecentreerd in de kaart.
- De tijd behoudt de grote typografie.
- De overige statuslabels blijven verwijderd; alleen verbindingsproblemen tonen een waarschuwing.

Commits op `phase_1_foundation`:
- `ed2f6d7`: datum teruggezet en klokinhoud gegroepeerd.
- `7f22f1d`: tijd/datum-groep verticaal gecentreerd.

De gebruiker moet de nieuwe versie nog ophalen en visueel controleren.
