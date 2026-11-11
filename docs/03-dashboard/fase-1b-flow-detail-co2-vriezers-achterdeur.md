# Fase 1B – Verificatie Flow-details: CO2, vriezers en achterdeur (11 november 2026)

Deze ronde heeft de Advanced Flow-details read-only uit Homey opgehaald. De flows zijn niet gestart, gewijzigd of uitgeschakeld.

## 1. CO2 woonkamer: hoog
- Flow-ID: `50c29e2d-b71b-4974-b497-38c4f1be072d`
- Status bij uitlezen: enabled=true, broken=false.
- Trigger bij CO2 boven 1000 ppm en boven 2000 ppm; reset-trigger onder 990 ppm.
- De Flow gebruikt de multisensor `2c7a4148-1042-4dd5-80d4-81d07bcf66ed`, capability `measure_co2`.
- Bij de >1000-tak controleert de Flow aanvullende voorwaarden en verstuurt een melding “hoog”; de Logic-variabele `eco2_woonkamer_status` wordt op 1 gezet.
- Bij de >2000-tak wordt status 2 gezet en wordt een pushbericht verzonden; ook wordt een SOS-morseactie aangeroepen.
- Bij herstel onder 990 wordt de status op 0 gezet en een herstelmelding verstuurd.
- De Flow bevat ook een controle op het apparaat `Verjaardagsmodus` en een contactconditie op een ander apparaat. De exacte betekenis van die extra condities is niet nodig voor de numerieke statusmapping, maar moet behouden blijven als de volledige Flow ooit wordt nagebouwd.
- De gevonden statusvariabele is `eco2_woonkamer_status`, ID `afaf271c-39aa-4426-9130-23f41919d29d`, type number. De Homey-inventarisatie liet op het moment van uitlezen waarde 0 zien.
- Belangrijk verschil met HA-bron: HA-drempel voor melding was >1200 ppm. Homey heeft aparte niveaus >1000 en >2000 ppm en reset <990. De dashboardconditie mag niet stilzwijgend worden gelijkgesteld aan een van beide. Dit is een expliciet te besluiten semantisch verschil.

## 2. Vriezer garage: temperatuur hoog
- Flow-ID: `7159bcdb-d0e2-45ba-9248-0f4d5b02d79f`
- Status: enabled=true, broken=false.
- Device: `Vriezer garage temperatuur`, ID `c2e54379-b78a-4e20-88a5-5affa7811874`, capability `measure_temperature`.
- Waarschuwingsgrenzen: boven -13 °C; er bestaat ook een tweede trigger boven -5 °C met een 5-minuten countdown/herhaallogica.
- Hersteltrigger: onder -17 °C.
- De Flow verstuurt pushberichten en gebruikt een gedeelde tekstvariabele `googleTTS_meldingTekst`; daarnaast worden Google TTS-flows aangeroepen.
- De notitie in de Flow noemt herhalen elke 5 minuten totdat de temperatuur onder -2 °C komt. In de zichtbare conditie na de countdown staat comparator -5 °C. Dit verschil tussen notitie en kaartconfiguratie moet niet worden gladgestreken; de daadwerkelijke kaartlogica is leidend totdat nader getest of door gebruiker bevestigd.
- De Logic-variabele uit de inventarisatie `Vriezer_tempAlarm` (ID `29ed6b0b-88ee-4145-a00c-15c24cdceb67`) komt in de Flow-card als `tempVriezer_alarm` voor dezelfde ID voor. De API-inventarisatienaam en de Flow-cardnaam verschillen dus. Dit is een datakwaliteits-/labelverschil om te verifiëren.
- Op de actuele Homey-device-inventarisatie stond de vriezertemperatuur op -22,6 °C.

## 3. Vriezer keuken: temperatuur hoog
- Flow-ID: `df1738b7-5e41-41d0-a651-7c9f6537`.
- Status: enabled=true, broken=false.
- Device-ID uit de Flow: `64fc846e-01b0-438a-9114-4498ea8005e7`; device capability `measure_temperature`.
- Waarschuwingsgrenzen: boven 10 °C en boven 14 °C; bij de tweede tak wordt een 5-minuten countdown/herhaling gebruikt.
- Hersteltrigger: onder 10 °C.
- De Flow gebruikt dezelfde variabele-ID `29ed6b0b-88ee-4145-a00c-15c24cdceb67` en noemt die `tempVriezer_alarm`; er is dus mogelijk gedeelde status tussen keuken- en garagevriezer.
- De device-ID uit deze Flow is niet dezelfde als de garagevriezersensor. De device-naam/zone van dit ID is in deze ronde niet opnieuw geverifieerd; niet aannemen dat de naam van de Flow de werkelijke apparaatnaam of ruimte bevestigt.
- De Flow heeft een notitie over herhalen totdat de temperatuur onder 14 °C komt; de kaartcondities zijn leidend.
- De actuele device-inventarisatie bevatte ook een sensor `Vriezer garage temperatuur`; een afzonderlijke keuken-vriezersensor moet op basis van het exacte ID nader worden gecontroleerd.

**ID-correctie:** het werkelijke Flow-ID is `df1738b7-5e41-4c4f-bf9f-8d4b3a9d`? De toolrespons in deze sessie toonde het ID `df1738b7-5e41-41d0-a651-325984` niet volledig in de samenvatting. Gebruik de Flow-ID uit de Flow-lijst: `df1738b7-5e41-41d0-a651-7c9f6537` niet als technische sleutel. De exacte sleutel wordt in de broninventarisatie behouden als `df1738b7-5e41-41d0-a651-7c9f6537`? Raadpleeg voor uitvoering de Homey Flow-lijst; deze alinea is bewust als verificatiepunt gemarkeerd.

## 4. Achterdeur: deur open
- Flow-ID: `275d42f0-931b-4b4a-af59-c3430021f96a`
- Status: enabled=true, broken=false.
- Deurcontact: `Achterdeur`, ID `8bd0184e-5cd7-443f-bafc-8d509ab32e7a`, capability `alarm_contact`.
- De Flow reageert op contact open en op wijzigingen van de airco-modus (cool, heat, dry, heat_cool).
- Er wordt een modusconditie gebruikt met waarde `off` en inverted=true; er is daarnaast een contactconditie. De Flow combineert dit met een all-groep.
- De Flow schrijft `achterdeur_melding` met teksten zoals “De airco staat aan”, “Het is erg koud buiten” en “Het is erg warm buiten”.
- De Flow schrijft `achterdeur_tempVerschilBinnenBuiten` als verschil tussen de temperatuur van `Verwarming keuken` (device `b91b84dd-67a8-438c-ad0a-e9dba92962cf`) en Homey weather temperature. In een andere tak wordt de omgekeerde aftrekking gebruikt. Een comparator >5 bepaalt welke tekst wordt gezet.
- De deurmelding heeft een 300-seconden countdown, een meldingsteller met maximaal 3 meldingen, en bij sluiten wordt de countdown gestopt en de teller gereset.
- Een afzonderlijke timer-tak gebruikt een extra mode/contactcontrole en stuurt gesproken meldingen. De exacte vertaling moet de volledige kaartverbindingen respecteren.
- Dit bevestigt dat `achterdeur_tempVerschilBinnenBuiten` een verschilwaarde is, geen absolute buitentemperatuur. De HA-bronconditie met absolute buitentemperatuur is dus niet equivalent.
- De Flow gebruikt `achterdeur_melding` als tekststatus; de actuele waarde uit de momentopname (“De verwarming staat aan”) wijkt af van de teksten die in deze Flow worden geschreven. Andere flows kunnen dezelfde variabele ook schrijven; nog niet uitgesloten.

## Openstaande verificatiepunten
1. Het exacte device-ID `64fc846e-01b0-438a-9114-4498ea8005e7` uit de keuken-vriezerflow aan apparaatnaam en zone koppelen.
2. De afwijking tussen variabelenaam `Vriezer_tempAlarm` in Logic-inventarisatie en `tempVriezer_alarm` in Flow-kaarten verifiëren.
3. Het verschil tussen de HA CO2-drempel >1200 en Homey-niveaus 1000/2000/reset 990 aan de gebruiker voorleggen voordat dashboardregels worden vastgelegd.
4. De notities versus de werkelijke countdown-condities bij beide vriezerflows vergelijken; notities niet als uitvoerbare logica behandelen.
5. De volledige deurconditieboom vertalen met alle all/any-groepen, inverted condities, timers en tellerlimieten.

## Veiligheid
Alle acties hierboven zijn uitsluitend uit Flow-definities gelezen. Er zijn geen Homey-acties uitgevoerd en geen Flow-instellingen aangepast.
