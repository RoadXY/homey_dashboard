# Fase 1B – meldingeninventarisatie en migratie-aanpak

## Startpunt
De bestaande broninventarisatie staat in:
- `docs/03-dashboard/ha-baseline-analyse.md`
- `docs/03-dashboard/README.md`

De bron is de door de gebruiker aangeleverde `tablet_home_assistant.yml` (983 regels). De analyse registreert 55 kaarten, waarvan 43 kaarten een visibility-voorwaarde hebben: 2 mediaspelers en 41 overige conditionele kaarten.

Dit document bouwt voort op die inventarisatie; het vervangt de bronanalyse niet.

## Vastgestelde scope
Binnen fase 1B worden alle conditionele kaarten voorbereid, met behoud van de oorspronkelijke voorwaarden. De expliciete scope-uitzonderingen blijven:
- telefoonbatterijkaarten: uitgesloten;
- plantkaarten: uitgesloten;
- twee conditionele mediaspelers: uitgesloten;
- muurtablet-batterijmelding: blijft behouden.

De overige conditionele statuskaarten worden meegenomen, niet alleen meldingen die direct om aandacht vragen.

## Bronvoorwaarden die het migratiemodel moet ondersteunen
De bronanalyse bevat de volgende soorten voorwaarden:
- exacte state-vergelijkingen (aan/uit en tekstuele statussen);
- state-not / uitsluitingen en arrays van uitgesloten statussen;
- numerieke grenzen (groter dan, kleiner dan);
- samengestelde AND- en OR-groepen, inclusief geneste groepen;
- combinaties van meerdere sensoren en schema-/tijdstatussen;
- duurvoorwaarden, waaronder een status die vijf minuten actief moet zijn;
- templates, waaronder de droger-completion-time.

Parser/import en het JSON-regelmodel moeten de oorspronkelijke boomstructuur en operatoren behouden. Een voorwaarde mag niet worden afgevlakt of semantisch aangepast tijdens migratie.

## Bekende brongevallen die expliciete validatie vereisen
- Raam Tess niet open: raamcontact, schema, uitsluitingen van airco-modi en een geneste combinatie van buitentemperatuur boven 18 met zonstatus uit.
- Achterdeur open: deur open én (buitentemperatuur lager dan 18 óf hoger dan 24).
- Dakraam Sem niet open: raamcontact, schema, uitsluitingen van weerstatussen, airco-modi en neerslag onder 0,1.
- Tuinhuislamp: aan gedurende vijf minuten.
- Batterijmeldingen: verschillende drempels en OR-condities; alleen de muurtablet blijft in scope.
- CO2 woonkamer hoog: bronanalyse noemt drempel boven 1200 en een verschil tussen trigger-entiteit en getoonde entiteit.
- Vriezer keuken warm: de Home Assistant-entiteit bevat 'koelkast'; Homey-equivalent en betekenis moeten worden bevestigd.
- Bak voorraam voeding: trigger-entiteit verschilt van de getoonde entiteit; niet corrigeren zonder bevestiging.
- Droger klaar: template voor de eindtijd; geen simpele sensorvoorwaarde.

## Homey-mappingstatus
De bestaande documentatie bevat kandidaat-koppelingen, maar geen volledige één-op-één-bevestiging voor alle voorwaarden. Iedere gebruikte Homey-bron krijgt daarom één status:
- bevestigd: apparaat, capability en betekenis zijn gecontroleerd;
- kandidaat: naam/capability lijkt passend, maar semantiek is niet bevestigd;
- ontbreekt: geen Homey-equivalent gevonden;
- semantisch verschil: er is een bron, maar betekenis of gedrag wijkt af;
- bespreekpunt: gebruiker moet een keuze bevestigen.

De eerste read-only kandidaten zijn onder meer:
- Weer: Homey-apparaat `Weer`;
- CO2: `Multisensor woonkamer`, capability `measure_co2`;
- droger: `Samsung wasdroger`, machine-state en cycle-informatie;
- stofzuiger: `Truus`, work status;
- tuinhuislamp: `Tuinhuis lamp`, onoff;
- diverse deur-/raamcontacten met `alarm_contact`;
- Remeha ketel: boiler/DHW-statusvelden.

Deze lijst is geen definitieve mapping. Vooral schema's, zonstatus, afgeleide binary sensors, vriezer, planten (buiten scope) en enkele samengestelde voorwaarden vereisen afzonderlijke verificatie.

## Gewenste uitkomst van fase 1B
Voor iedere binnen-scope kaart wordt een mappingtabel bijgehouden met:
1. bronkaartnaam;
2. originele YAML-voorwaarde (ongewijzigd herleidbaar);
3. bronentiteiten en operators;
4. Homey-apparaat/capability/Logic- of andere read-only bron;
5. mappingstatus en bewijs;
6. voorgesteld meldingstype (kritiek/waarschuwing/info), alleen als dit uit bestaande besluiten of expliciete gebruikerskeuze volgt;
7. open vragen en testgevallen.

Daarna wordt een versiebeheerd JSON-voorwaardenmodel ontworpen dat de originele condition tree kan representeren. Het model wordt eerst statisch gevalideerd; runtime-evaluatie en weergave volgen pas na akkoord op de mapping.

## Runtime- en weergavebesluiten die al vastliggen
- Homey is de runtime-gegevensbron; Home Assistant wordt niet gekoppeld.
- Meldingen verdwijnen direct zodra hun voorwaarde niet meer actief is; geen geschiedenis van beëindigde meldingen.
- Sortering: kritiek, waarschuwing, info; binnen ieder niveau nieuwste activering eerst.
- Elke melding heeft precies één niveau.
- Standaardmelding bevat herkenbaar icoon, titel en actuele waarde.
- Fase 1: vaste geprogrammeerde definities; alleen actief/inactief, naam en niveau eenvoudig configureerbaar. Voorwaarden worden niet via de UI bewerkt.
- Fase 2: algemene voorwaardeneditor/Blockly en verdere beheerfunctionaliteit.
- Het meldingenpaneel krijgt twee kolommen, vaste kaartafmetingen en eigen scrollgedrag; de rest van het dashboard scrolt niet.

## Veiligheids- en wijzigingsgrens
De inventarisatie en mapping zijn read-only. Er worden geen Homey-apparaten, Logic-variabelen, Flows, Moods of instellingen aangepast of gestart. Homey-logica blijft onder beheer van de gebruiker.

## Volgende concrete werkzaamheden
1. De Homey-inventarisatie opnieuw read-only ophalen waar nodig.
2. De binnen-scope bronkaarten één voor één aan Homey-bronnen koppelen.
3. Onbevestigde semantiek en ontbrekende bronnen als bespreekpunten voorleggen.
4. Na mapping het JSON-voorwaardenmodel en testgevallen vastleggen.


## Gebruikersbevestiging – wateralarmen en deur-/raamcontacten (11 november 2026)

De gebruiker heeft de volgende apparaatnaam/capability-koppelingen bevestigd:
- Water Sensor wasmachines — `alarm_water`.
- Water sensor vaatwasser — `alarm_water`.
- Deur tuinhuis — `alarm_contact`.
- Voordeur — `alarm_contact`.
- Achterdeur — `alarm_contact`.
- Onder raam Bram — `alarm_contact`.
- Onder raam Tess — `alarm_contact`.
- Ouderslaapkamer onderraam — `alarm_contact`.
- Raam Sem — `alarm_contact`.

Er zijn geen opmerkingen of correcties meegegeven. De exacte apparaat-ID's zijn met deze bevestiging niet vastgelegd. De bevestiging geldt voor de Homey-bronmapping; de oorspronkelijke HA-condities en eventuele samengestelde voorwaarden moeten afzonderlijk behouden en gevalideerd worden. De inventarisatie blijft read-only.
