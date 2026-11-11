# Visuele herziening hoofdscherm – 11 november 2026

## Status en uitgangspunt

De eerste live dashboardweergave op Ubuntu is beoordeeld aan de hand van de goedgekeurde mockups en ontwerpafspraken in `docs/07-ontwerp/README.md`. De eerste weergave was een technische POC: de Homey-data werd opgehaald, maar de compositie week af van het goedgekeurde ontwerp. Met name het grote lege thuisoverzicht onder de acties hoorde niet in het ontwerp.

De gebruiker heeft bevestigd dat de implementatie nu moet worden aangepast aan het eerder goedgekeurde ontwerp. Deze herziening wijzigt de dashboardpresentatie; zij wijzigt geen Homey-apparaten, Flows, Logic-variabelen of instellingen.

## Vastgelegde hoofdschermindeling

- Hoofdscherm met twee kolommen: links 40%, rechts 60%.
- Linkerkolom: grote klok-/datumkaart, weerkaart en vier temperatuurtegels.
- Temperatuurtegels staan exact in een 2×2-raster: Woonkamer, Keuken, Sem en Bram.
- Rechterkolom: acht Quick Actions bovenaan, in één horizontale rij en in de eerder afgesproken volgorde.
- Geen afzonderlijke kop of balk voor Snelle acties.
- Direct onder de acties staat het meldingenpaneel.
- Meldingen worden in twee kolommen gepresenteerd zodra de meldingsbron en -gegevens zijn aangesloten.
- Alleen het meldingenpaneel mag intern scrollen bij meer meldingen dan zichtbaar passen.
- Het grote lege thuisoverzicht met de decoratieve orb en de generieke statistiekrij is verwijderd.
- Geen mediaspelerkaarten.
- Buitenste tussenruimtes volgen één consistente spacingmaat; de meldingenpaneelmarges zijn links en rechts gelijk.
- Donkere, rustige vormgeving; neutrale actieknoppen en kleur alleen voor functionele statussen/meldingsniveaus.
- De tabletweergave in landscape is leidend. Kleinere schermen krijgen een bruikbare responsieve terugvalindeling.

## Implementatie in deze herziening

- `src/client/main.tsx`: dashboardstructuur aangepast aan de twee kolommen; het lege thuisoverzicht is vervangen door een meldingenpaneel. De Homey-status gebruikt de geretourneerde aantallen apparaten en ruimtes in plaats van hardgecodeerde aantallen.
- `src/client/style.css`: 40/60-layout, 2×2-temperatuurgrid, horizontale actierij, scrollbaar meldingenpaneel, subtiele lijnaccenten en responsieve schermterugval.
- De acht Quick Actions blijven bewust visuele placeholders. Er worden geen Flows gestart en geen apparaten bediend.
- Het meldingenpaneel is visueel voorbereid, maar de meldingenbron/conditionele logica is nog niet aangesloten. Er worden daarom geen voorbeeld- of fictieve meldingen getoond.
- Bestaande read-only Homey-uitlezing voor klok, weer en temperatuurtegels blijft behouden.

## Validatie en open punten

- De gebruiker heeft bevestigd dat `GET /api/homey/status` HTTP 200 retourneert met `state: online`, 128 apparaten en 22 ruimtes.
- De codewijzigingen zijn naar branch `phase_1_foundation` gepusht:
  - `632aef5`: hoofdschermstructuur.
  - `06c81c9`: styling en responsieve indeling.
- Docker-build en visuele controle op de tablet moeten na ophalen van deze commits nog worden uitgevoerd.
- De exacte verhoudingen, kaartgroottes en leesbaarheid moeten op de daadwerkelijke tabletresolutie worden gecontroleerd en zo nodig bijgesteld.
- De meldingsintegratie en Quick Action-functionaliteit blijven aparte vervolgstappen; Homey-automatiseringen blijven onder beheer van de gebruiker.

## Belangrijke statuscorrectie

De eerdere documentregel dat implementatie nog niet gestart mocht worden, is achterhaald door de latere expliciete goedkeuring om te bouwen. De actuele status is: technische POC werkt; de visuele herziening wordt nu afgestemd op de goedgekeurde mockups. Deze notitie is de actuele voortgangsregistratie en moet samen met de ontwerp-README worden gelezen.
