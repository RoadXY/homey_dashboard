# Fases en vrijgavecriteria

## Voorwaarde vóór implementatie
Er wordt niet gebouwd voordat mockups en functioneel ontwerp door de gebruiker zijn goedgekeurd.

## Fase 1 – foundation en eerste dashboard
- Project- en architectuurdocumentatie.
- Docker-webapp op Ubuntu.
- Lokale Homey-koppeling en apparaatontdekking.
- Configuratiepagina met pincode.
- Selectie van apparaten/capabilities.
- Quick buttons en statische JSON-meldingen.
- Bestaande Home Assistant-dashboardfunctionaliteit als nulmeting porten, met behoud van alle bestaande voorwaarden en combinaties.
- Media-informatie alleen tonen wanneer spelers actief zijn; in het nieuwe dashboard uitsluitend informatief.
- Offlinegedrag met laatst bekende waarden en rode ‘Homey Offline’-indicator.

## Fase 2 – beheer en uitbreidingen
- WYSIWYG-editor voor meldingen.
- Meldingenoverzicht en bewerken per melding.
- Door de gebruiker dynamisch samenstellen van meldingsteksten, apparaatwaarden en combinaties.
- Complexe AND/OR-condities beheren.
- Homey Flow pushmeldingen.
- Uitbreidingen op configuratie en presentatie.

## Fase 3 – nader te bepalen
Prioriteitsverfijning, verdere optimalisatie en eventuele aanvullende functies worden later vastgesteld.

## Huidige status
Inventarisatierondes 1 t/m 22 zijn afgerond en gedocumenteerd. De eerste analyse van de aangeleverde Home Assistant-YAML (983 regels, 55 kaarten) is vastgelegd. De volledige mapping van YAML-entiteiten/voorwaarden naar Homey-apparaten en capabilities moet nog gebeuren. Mockups en functioneel ontwerp zijn nog niet goedgekeurd. Er is nog geen applicatiecode gestart.

### Fase 3 – Voorgeprogrammeerde thema's
In fase 3 wordt een selectie vooraf ontworpen dashboardthema's toegevoegd. In fase 1/2 worden pictogrammen en overige visuele eigenschappen automatisch door het actieve thema bepaald; per actieknop kan de gebruiker alleen het MDI-pictogram kiezen. De concrete themavarianten worden in de ontwerpfase voor fase 3 vastgesteld.

### Fase 3 – Meertaligheid en vertalingen
Fase 3 omvat ondersteuning voor meerdere dashboardtalen. Vertalingen van dashboardteksten en relevante zoektermen worden in JSON-bestanden beheerd. Ook wordt de MDI-zoekfunctie uitgebreid met Nederlandse en Engelse termen en synoniemen. In de huidige fase gebruikt de zoekfunctie alleen de namen die door de MDI-website worden aangeleverd.
