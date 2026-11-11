# Visuele verfijning dashboard – 11 november 2026

Na de eerste controle in een desktopbrowser zijn de volgende kleine vormgevingsaanpassingen afgesproken en doorgevoerd:

- Temperatuurwaarden worden verticaal in het midden van hun eigen tegel geplaatst; de ruimtenaam blijft bovenaan staan.
- De symbolen op de acht Quick Action-kaarten zijn vergroot voor betere herkenbaarheid op afstand.
- De klok is groter gemaakt en horizontaal gecentreerd in de tijdkaart. De datum is eveneens gecentreerd.
- De losse statusregels onderaan de volledige pagina (`Laatste update` en `Automatisch bijgewerkt`) zijn verwijderd. De update-tijd en verversingsfrequentie staan nu compact in de bestaande footer van het meldingenpaneel, naast het aantal apparaten en ruimtes. Hierdoor blijft er geen aparte strook schermhoogte onder de kolommen nodig.

De wijzigingen zijn vastgelegd in:
- `src/client/main.tsx`
- `src/client/style.css`

Commits op `phase_1_foundation`:
- `f40631c`: klok/statusweergave en plaatsing update-informatie.
- `420b3d3`: centrering temperatuurwaarden en grotere actie-iconen.

De gebruiker heeft de nieuwe versie nog niet op de fysieke tablet getest. De huidige screenshots zijn afkomstig uit desktopbrowsers in zowel portrait-achtige als landscape vensterverhoudingen. Na ophalen van deze commits volgt controle op de Samsung Galaxy Tab A SM-T515 in landscape; waar nodig worden de responsive afmetingen daarop afgestemd.
