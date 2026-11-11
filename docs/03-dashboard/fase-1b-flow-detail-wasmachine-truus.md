# Fase 1B – Flowdetails: wasmachine en Truus

Read-only inventarisatie van Homey Pro 2023. Er zijn geen Flows, apparaten of instellingen gewijzigd.

## Wasmachine: start en klaar
- Flow-ID: `0687d0fa-b2c4-4cb9-968c-e099d29f74e7`
- Status bij uitlezen: ingeschakeld, niet defect.
- Starttrigger: apparaat `c82ed90a-e165-450e-84f1-a8acc0098861`, vermogen boven 120 W.
- Als `wasmachine_draait` nog false is:
  - zet `wasmachine_draait` op true;
  - verstuur pushbericht “De wasmachine gaat aan”;
  - schrijf een logregel in groep Witgoed;
  - zet `wasmachine_timer` op 310;
  - start de looptijdmeting `Wasmachine_looptijd`.
- De countdown-trigger controleert vervolgens het actuele vermogen. Bij vermogen lager dan 2 W:
  - beëindigt de Flow de looptijdmeting;
  - zet `wasmachine_draait` op false;
  - verstuurt pushmeldingen met de gemeten looptijd;
  - schrijft een logregel en roept een Google TTS-melding aan.
- Bij vermogen van 2 W of hoger wordt de countdown opnieuw op 310 gezet.
- De Logic-variabele `wasmachine_draait` heeft ID `c21929a1-2693-416b-9240-74b4ca5d96b9`.
- De countdownvariabele heet `wasmachine_timer`.
- Belangrijke interpretatie: de dashboardstatus is een door deze Flow bijgehouden boolean, niet een directe machine-state-capability. De start- en stopdrempels zijn respectievelijk >120 W en <2 W.

## Truus – ochtendmelding
- Flow-ID: `2c2caee5-95b2-46e0-a9d7-64aaa9d467a1`
- Status bij uitlezen: ingeschakeld, niet defect.
- Start om 07:55.
- Controleert aanwezigheid en meerdere apparaatcondities, waaronder of bepaalde apparaten uit staan.
- De Flow bevat dagcontroles voor dinsdag en donderdag en roept daarna een Google TTS-bericht aan dat Truus gaat stofzuigen.
- Dit is een geplande aankondiging, geen bewijs dat Truus daadwerkelijk gestart of aan het schoonmaken is.

## Truus – accu voldoende
- Flow-ID: `6c210b7b-fe34-4b61-a0d9-133902a638b2`
- Status bij uitlezen: ingeschakeld, niet defect.
- Trigger wanneer de accucapaciteit boven 75% komt.
- Stuurt alleen op donderdag, tussen 09:00 en 16:00, als de betreffende gebruiker thuis is en de genoemde apparaatcondities kloppen.
- Stuurt dan een melding dat Truus genoeg accu heeft om de bovenverdieping te stofzuigen.
- Dit is een gereedheidsmelding, niet de actuele schoonmaakstatus.



## Gebruikersbesluit – dashboardbron wasmachine (11 november 2026)
De gebruiker heeft gekozen voor de Logic-variabele `wasmachine_draait` als bron voor de dashboardstatus. De variabele-ID is `c21929a1-2693-416b-9240-74b4ca5d96b9`. De dashboardapp leest deze waarde uitsluitend read-only. De Flow blijft volledig in beheer van de gebruiker en wordt niet aangepast. De eerdere mogelijkheid om vermogen als primaire bron te gebruiken is niet gekozen.

## Dashboardconsequenties
- Wasmachine: `wasmachine_draait` is een directe kandidaat voor een eenvoudige draaiend/niet-draaiend indicatie. Houd rekening met de Flow-drempels en het feit dat de boolean afhankelijk is van de Flow.
- Wasmachine: `measure_power` kan als aanvullende actuele meetwaarde worden getoond, maar vervangt de Flow-status niet zonder expliciete ontwerpkeuze.
- Truus: gebruik de actuele apparaatstatus/capabilities voor de live tegel. De ochtend- en accu-Flows zijn alleen contextuele meldingen.
- Truus apparaat-ID uit de eerder geïnventariseerde stofzuigerstatus-Flow: `1f76bd9a-b6f6-4f78-8734-742b9d054cfc`.

## Nog open
- De standaard Flow “Wasmachines: water alarm” is nog niet inhoudelijk onderzocht.
- De Standard Flow “Truus: accu weer boven de 50%” is nog niet inhoudelijk onderzocht.
- De exacte betekenis van de overige apparaatcondities in de ochtend- en accu-Flows vraagt om device-naamresolutie; daarom worden ze hier niet verder geïnterpreteerd.
