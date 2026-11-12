# Mockup- en ontwerpgoedkeuringsstatus

| Scherm/onderdeel | Status | Wat is goedgekeurd | Wat staat nog open |
|---|---|---|---|
| Hoofddashboard | Visueel goedgekeurd | Donkere stijl, hoofdindeling, 40/60, klok/weer/temperaturen, Quick Actions en verdere verfijningen | Implementatie en technische toetsing |
| Meldingskaarten | Visueel goedgekeurd | Vaste kaartvormgeving en niveau-uitstraling | Wordt niet getoond in fase 1A; later toevoegen |
| Instellingen – algemene layout | Basislayout goedgekeurd | Donkere stijl, linker navigatie, tweekolomsindeling, compacte kaarten | Volledige scherminhoud/functionele details apart controleren |
| Instellingen – Dashboard | Ontwerpafspraken vastgelegd | Temperatuurpreview, sensorpicker, weeronderdelen en Quick Action-configuratie | Geen geverifieerd compleet mockupbestand; verdere visuele review waar nodig |
| Instellingen – Meldingen | Niet volledig uitgewerkt | Eerdere afspraken over lijst en beheer | Volledige schermontwerpen en editor volgen later |
| Instellingen – Apparaten | Niet volledig uitgewerkt | Categorie bestaat in navigatie | Scherminhoud en gedrag vaststellen |
| Instellingen – Homey | Niet volledig uitgewerkt | Categorie bestaat in navigatie | Scherminhoud en gedrag vaststellen |
| Instellingen – Systeem | Niet volledig uitgewerkt | Categorie bestaat in navigatie | Scherminhoud en gedrag vaststellen |
| Blockly-editor | Fase 2 | Blockly als voorkeursrichting en JSON-model als centrale basis | Blokkenbibliotheek, layout en editorinteractie |
| Variant met zichtbare instellingenknop op hoofdscherm | Afgekeurd | Niets | Niet opnieuw gebruiken als ontwerpbron |

## Belangrijke statusregel
Een goedgekeurd functioneel besluit betekent niet automatisch dat een mockupafbeelding beschikbaar of gearchiveerd is. Afbeeldingsbestanden worden pas als aanwezig gemarkeerd nadat ze op GitHub zijn gecontroleerd.


## Update 12 november 2026 – instellingenpagina Algemeen

| Scherm/onderdeel | Status | Wat is goedgekeurd | Wat staat nog open |
|---|---|---|---|
| Instellingen – Algemeen | <strong>Visuele referentie expliciet aangewezen</strong> | De door de gebruiker aangeleverde screenshot 65819.png is de leidende visuele referentie: header, linker navigatie, Language- en Date and time-kaarten, brede System status-kaart en acties Restore defaults / Save | Technische databronnen voor statusvelden; definitieve keuze over verschil in navigatiecategorieën t.o.v. oudere zes-categorie-afspraak |


### Implementatiestatus – Instellingen General (12 november 2026)

De eerste frontendversie van General, de persistente instellingen-API, systeemstatus-API en server-side PIN-verificatie staan op `phase_1_foundation`. De vormgeving volgt de door de gebruiker aangewezen screenshot. <badge color="warning">Build nog niet gevalideerd</badge> De lokale `.env` moet `SETTINGS_PIN` bevatten; daarna volgt Docker-build en visuele praktijktest.


## Update 12 november 2026 – Instellingen Dashboard / Quick Actions

| Scherm/onderdeel | Status | Wat is goedgekeurd | Wat staat nog open |
|---|---|---|---|
| Instellingen – Dashboard – Quick Actions | **Functioneel en visueel referentiebeeld bevestigd** | Twee editorvarianten (Flow en apparaat), naam/pictogram, apparaatgebonden acties dynamisch tonen, acht knoppen, preview, expliciet Opslaan; geen Restore defaults | Implementatie, capability-mapping, Homey-uitvoering, foutafhandeling en praktijktest |

De twee door de gebruiker aangeleverde afbeeldingen op 12 november 2026 zijn de leidende referentie voor de Quick Actions-editor. De tweede afbeelding toont Flow-selectie; de eerste toont apparaatselectie met een actie die bij het apparaat hoort. De bestaande acht projectknoppen en hun volgorde blijven behouden; mockupteksten zijn alleen voorbeelden.
