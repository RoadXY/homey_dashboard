# Fase 1B – Flowdetails: regen, ramen, stofzuiger en droger

Read-only inventarisatie van Homey Pro 2023. Vastgelegd op basis van de huidige Flow-definities; er zijn geen Homey-instellingen of Flows gewijzigd.

## Regen: ramen open, melding
- Flow-ID: `e5f60ec8-ee94-4d9d-ae30-598eefd825e9`
- Status bij uitlezen: ingeschakeld, niet defect.
- Start bij Buienradar-trigger `rain_start`.
- Controleert de boolean `regen_ramenOpenTimout`; bij false wordt deze op true gezet.
- Roept vervolgens de tel-flow voor grote open ramen aan.
- Na 10 seconden gebruikt de Flow het aantal open grote ramen (`ramen_AantalOpen`) om de tekst te bepalen:
  - meer dan 1: melding met het aantal grote ramen;
  - precies 1: melding met de reden/naam uit `ramen_telRamenOpenReden`;
  - 0: algemene melding dat het gaat regenen.
- De melding wordt via push en Google TTS verspreid. De algemene regenmelding wordt alleen naar aanwezige gebruikers gestuurd; de raam-open-meldingen worden volgens de Flow-opzet altijd verstuurd.
- Er staat een reset na 30 minuten die `regen_ramenOpenTimout` terugzet naar false.
- Aandachtspunt: de timeoutvariabele voorkomt herhaald starten binnen de ingestelde periode; controleer bij implementatie of het dashboard een status wil tonen of alleen een melding.

## Regen: achter- en voordeur open
- Flow-ID: `9c8446b8-5a30-4f74-b858-6bca601212e2`
- Status bij uitlezen: ingeschakeld, niet defect.
- Start bij regen, wacht 30 seconden en gebruikt `regen_deurOpenTimeout` als blokkering; reset na 30 minuten.
- Controleert combinaties van de contactstatussen van voordeur en achterdeur.
- Kan een tekst opbouwen voor beide deuren open, alleen voordeur open of alleen achterdeur open.
- Stuurt pushmeldingen en roept Google TTS Flows aan.
- De Flow bevat een notitie dat de wachttijd van 30 seconden dubbele gesproken regenmeldingen (ramen én deuren) moet voorkomen.
- Variabele `regen_deurOpenTimeout` ID: `d68b47f5-7f8e-4420-81f2-8298cce06e7b`.

## Ramen tellen – grote ramen
- Flow-ID: `2e74809c-c880-419e-8477-12c1d0618acc`
- Status bij uitlezen: ingeschakeld, niet defect; triggerbaar.
- Zet `ramen_AantalOpen` eerst op 0.
- Controleert vier contacten: dakraam Sem, groot raam ouderslaapkamer, groot raam Bram en groot raam Tess.
- Bij ieder open contact wordt de teller met 1 verhoogd en `ramen_telRamenOpenReden` op de betreffende raamnaam gezet.
- Let op: de redenvariabele bevat uiteindelijk de laatst verwerkte open raamnaam, niet een volledige lijst.

## Ramen tellen – alle ramen
- Flow-ID: `e5076e85-0498-47fb-842f-7751babdba67`
- Status bij uitlezen: ingeschakeld, niet defect; triggerbaar.
- Telt dakraam Sem, raam Sem, kleine/grote ramen ouderslaapkamer, kleine/grote ramen Bram en kleine/grote ramen Tess.
- Gebruikt dezelfde globale variabelen `ramen_AantalOpen` en `ramen_telRamenOpenReden`.
- Omdat beide tel-Flows dezelfde variabelen resetten en vullen, moet bij dashboardgebruik duidelijk zijn welke tel-flow op welk moment is aangeroepen. De regen-flow voor ramen roept expliciet de grote-ramen-tel-flow aan.

## Stofzuiger: statusmeldingen
- Flow-ID: `ddb4e277-743e-40ae-8ff2-945573070d5b`
- Status bij uitlezen: ingeschakeld, niet defect.
- Truus (stofzuiger) start een looptijdmeting bij status `cleaning` en beëindigt deze bij `docked`.
- Bij voltooiing wordt een pushbericht verstuurd met de gemeten looptijd en resterend accupercentage.
- De push wordt alleen verstuurd als de betreffende gebruiker niet thuis is (de Flow gebruikt een omgekeerde aanwezigheidstest).
- Voor een live dashboardstatus is de apparaatstatus zelf een directere bron dan de voltooiingsmelding.

## Droger: looptijd en energie
- Flow-ID: `d022918b-357d-4e84-a96c-f3518e6ef648`
- Status bij uitlezen: ingeschakeld, niet defect.
- Gebruikt apparaat-ID `134d7e99-5067-4891-bb1e-222d1e970222` voor aan/uit en de machine-state-trigger.
- Start `Wasdroger_looptijd` wanneer de droger aangaat en beëindigt de meting wanneer hij uitgaat.
- Bij voltooiing wordt een pushbericht verstuurd met looptijd en de dagkosten via capability `meter_money_this_day` van apparaat `5a37be84-678e-4830-aee2-581dc3a88cfc`.
- De Flow stuurt daarnaast een gesproken melding via de Google TTS Flows.
- Er is ook een pushmelding bij wijziging van `localthings_machine_state`, met de nieuwe machine-status.
- De Flow-details geven geen eenduidige mapping van de machine-state-waarden naar gebruikersvriendelijke statusteksten.



## Gebruikersbesluit – dashboardweergave droger (11 november 2026)
De gebruiker wil voor de droger de actuele **status**, **voortgang** en **resterende tijd** op het dashboard zien. Een aparte energie-/kostentegel is niet gevraagd. De kandidaten zijn `localthings_machine_state`, `localthings_cycle_active`, `localthings_progress` en `localthings_remaining_minutes`. De ruwe machine-state-waarden moeten nog worden gevalideerd voordat ze aan gebruiksvriendelijke labels worden gekoppeld.

## Nog te onderzoeken
- De wasmachine-Flow en eventuele bron van `wasmachine_draait`.
- De precieze apparaatnamen achter de contact-ID's in de raam-tel-Flows, om de mapping met de HA-bronnamen definitief te maken.
- Truus: actuele capability-/statuswaarden en mogelijke aanvullende Flows.
- Betekenis en actuele bron van de droger-machine-state.

## Dashboardconsequentie
De variabelen `ramen_AantalOpen` en `ramen_telRamenOpenReden` zijn bruikbare dashboardkandidaten, maar de redenvariabele is slechts één raamnaam. Voor een betrouwbare lijst met afzonderlijke open ramen is het beter de actuele contactstatussen rechtstreeks uit Homey te lezen. Regenmeldingen zijn gebeurtenis-/timeoutlogica; ze moeten niet zonder meer als blijvende actieve alarmstatus worden geïnterpreteerd.

## Technische statuscontrole droger – 11 november 2026

Read-only momentopname van Homey-apparaat **Samsung wasdroger** (134d7e99-5067-4891-bb1e-222d1e970222):

| Capability | Waarde bij uitlezen |
|---|---:|
| onoff | false |
| localthings_machine_state | Ready |
| localthings_cycle_active | false |
| localthings_progress | 0 |
| localthings_remaining_minutes | 220 |
| measure_power | null |
| meter_power | 349.9 |

Dit is één momentopname en geen volledige statusmapping. Ready samen met cycle_active=false, progress=0 en remaining_minutes=220 is nog niet voldoende om de resterende tijd als een actieve droogcyclus te presenteren. De implementatie moet resterende tijd alleen tonen wanneer de cyclus daadwerkelijk actief is en de waarde plausibel is. De exacte betekenis van Ready en de resterende-minutenwaarde moet nog worden bevestigd met een tweede momentopname tijdens een draaiend programma.
