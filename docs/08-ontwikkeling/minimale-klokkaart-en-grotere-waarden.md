# Klokkaart minimaliseren en waarden vergroten – 11 november 2026

De gebruiker wil de klokkaart volledig vrijhouden van statische context- en statuslabels zolang de verbinding goed werkt. De kaart toont daarom uitsluitend de tijd. Datum, "HOMEY PRO 2023", "Verbonden", "Thuis" en "Dashboard actief" zijn verwijderd.

Alleen bij een verbindingsprobleem verschijnt een korte foutmelding in de klokkaart:
- Wanneer de dashboard-API/backend niet bereikbaar is: "Verbinding met de dashboardserver mislukt".
- Wanneer de backend bereikbaar is maar Homey niet online is: "Verbinding met Homey Pro mislukt".
- Tijdens de eerste laadfase, zolang de status nog onbekend is, verschijnt geen waarschuwing.

Daarnaast:
- De klok is verder vergroot en blijft gecentreerd.
- De temperatuurwaarden in het 2×2-raster zijn verder vergroot en blijven horizontaal en verticaal gecentreerd.
- Overige dashboardindeling en Homey-read-only gegevenskoppelingen zijn ongewijzigd.

Bestanden:
- `src/client/main.tsx`
- `src/client/style.css`

Commits op `phase_1_foundation`:
- `0bb1933`: klokkaart opschonen en alleen verbindingsfouten tonen.
- `712bf77`: klok en temperatuurwaarden verder vergroten.

Fysieke tabletcontrole blijft nodig om te bevestigen dat de grotere waarden niet worden afgekapt en op 4–5 meter prettig leesbaar zijn.
