import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const startTime = Date.now();

        const content = `# Jahreskalender & Fristen für Immobilienverwalter

**Generiert am:** ${new Date().toISOString().split('T')[0]}  
**Version:** 1.0  
**Gültig für:** Deutschland, Steuerjahr ${new Date().getFullYear()}

---

## 1. JAHRESKALENDER EINES VERWALTERS

### 📅 JANUAR

**Hauptthemen:** Jahreswechsel-Abschluss, Planung

**Typische Arbeiten:**
- ✅ Letzte Rechnungen des Vorjahres erfassen und kategorisieren
- ✅ Kontoauszüge Dezember prüfen und abgleichen
- ✅ Jahresübersicht Mieteinnahmen/-ausgaben erstellen
- ✅ Liquiditätsplanung für neues Jahr
- ✅ Versicherungen prüfen (Ablaufdaten, Prämienänderungen)
- ✅ Indexmieten prüfen und ggf. anpassen (bei Stichtag 01.01.)
- ✅ Steuervorauszahlungen ans Finanzamt überweisen (Fälligkeit 10.03. für Q4 Vorjahr)

**Kommunikation:**
- Neujahrsgrüße an Mieter (optional)
- Jahresabschluss-Email an Eigentümer (Übersicht Einnahmen/Ausgaben)

**Fristen:**
- ❗ 10.01.: Umsatzsteuer-Voranmeldung Dezember (wenn monatlich)
- ❗ 10.01.: Einkommensteuer-Vorauszahlung Q4 Vorjahr

**Typische Probleme:**
- Viele Rechnungen kommen verspätet (Dezember-Rechnungen erst im Januar)
- Mieter haben Zahlungsengpässe nach Weihnachten

---

### 📅 FEBRUAR

**Hauptthemen:** Grundsteuer, Steuer-Vorbereitung

**Typische Arbeiten:**
- ✅ Grundsteuer Q1 vorbereiten (Fällig 15.02.)
- ✅ Betriebskostenabrechnung Vorjahr vorbereiten (Daten sammeln)
- ✅ Zählerstände erfassen (Heizung, Wasser) für BK-Abrechnung
- ✅ Wartungsverträge erneuern (Heizung, Aufzug, Brandmelder)
- ✅ Steuerunterlagen für Steuerberater vorbereiten
- ✅ Anlage V Vorjahr-Daten zusammenstellen

**Kommunikation:**
- Mieter an Zahlung Grundsteuer-Anteil erinnern (falls umlagefähig)
- Eigentümer über Stand BK-Abrechnung informieren

**Fristen:**
- ❗ 10.02.: Umsatzsteuer-Voranmeldung Januar
- ❗ 15.02.: Grundsteuer Q1 Fälligkeitsdatum

**Saisonales:**
- Heizperiode läuft (Oktober-April)
- Kontrollgang: Frostschäden prüfen (Leitungen, Außenwasserhähne)

---

### 📅 MÄRZ

**Hauptthemen:** Steuervorauszahlungen, Frühjahrs-Check

**Typische Arbeiten:**
- ✅ Steuervorauszahlung Q1 überweisen (Fällig 10.03.)
- ✅ Betriebskostenabrechnung Vorjahr finalisieren
- ✅ Außenanlagen-Check (Garten, Spielplatz, Wege) nach Winter
- ✅ Dachrinnen prüfen und reinigen
- ✅ Fassade auf Schäden prüfen
- ✅ Versicherungsschäden aus Winter melden

**Kommunikation:**
- Handwerker für Frühjahrs-Arbeiten beauftragen
- Mieter über geplante Arbeiten informieren

**Fristen:**
- ❗ 10.03.: Umsatzsteuer-Voranmeldung Februar
- ❗ 10.03.: Einkommensteuer-Vorauszahlung Q1
- ❗ 31.03.: Viele Versicherungen haben Jahres-Stichtag

**Typische Probleme:**
- Frostschäden werden jetzt sichtbar (Risse, undichte Stellen)
- Heizkosten-Nachzahlungen aus BK-Abrechnung führen zu Beschwerden

---

### 📅 APRIL

**Hauptthemen:** Steuererklärung Vorjahr starten, Gartensaison

**Typische Arbeiten:**
- ✅ Steuererklärung Vorjahr beim Steuerberater einreichen (oder selbst vorbereiten)
- ✅ Anlage V(s) fertigstellen
- ✅ Gartenpflege beauftragen (Rasen mähen, Hecken schneiden)
- ✅ Außenreinigung (Fenster, Fassade wenn nötig)
- ✅ Spielplatz-TÜV beauftragen (meist jährlich im Frühjahr)

**Kommunikation:**
- BK-Abrechnung an Mieter versenden (spätestens 12 Monate nach Abrechnungsende!)
- Gärtner/Hausmeister beauftragen

**Fristen:**
- ❗ 10.04.: Umsatzsteuer-Voranmeldung März
- ❗ 30.04.: Viele Gewerbemietverträge haben Indexmiete mit Stichtag 01.05.

**Saisonales:**
- Heizperiode endet meist Mitte/Ende April
- Heizung auf Sommerbetrieb umstellen

---

### 📅 MAI

**Hauptthemen:** Grundsteuer Q2, Gartenpflege

**Typische Arbeiten:**
- ✅ Grundsteuer Q2 überweisen (Fällig 15.05.)
- ✅ Heizung warten lassen (optimaler Zeitpunkt: nach Heizperiode)
- ✅ Schornsteinfeger beauftragen (jährliche Prüfung)
- ✅ Lüftungsanlagen warten
- ✅ Mietverträge prüfen (auslaufende befristete Verträge?)

**Kommunikation:**
- Mieter über Heizungswartung informieren (Termin)
- Schornsteinfeger-Termine koordinieren

**Fristen:**
- ❗ 10.05.: Umsatzsteuer-Voranmeldung April
- ❗ 15.05.: Grundsteuer Q2 Fälligkeitsdatum

**Typische Probleme:**
- Heizungswartung: Handwerker sind ausgebucht (früh buchen!)

---

### 📅 JUNI

**Hauptthemen:** Halbjahres-Check, Steuervorauszahlung Q2

**Typische Arbeiten:**
- ✅ Steuervorauszahlung Q2 überweisen (Fällig 10.06.)
- ✅ Halbjahres-Finanzübersicht erstellen
- ✅ Liquidität prüfen (Rücklagen ausreichend?)
- ✅ Versicherungen: Halbjahres-Prüfung (Deckungssummen, Schäden)
- ✅ Mietverträge auslaufend? → Verlängerung oder Neubesetzung planen
- ✅ Ferienzeit: Urlaubs-Vertretung organisieren

**Kommunikation:**
- Eigentümer: Halbjahres-Report (Einnahmen, Ausgaben, besondere Vorkommnisse)

**Fristen:**
- ❗ 10.06.: Umsatzsteuer-Voranmeldung Mai
- ❗ 10.06.: Einkommensteuer-Vorauszahlung Q2

**Saisonales:**
- Balkon-Saison: Mehr Beschwerden über Nachbarn (Grillen, Lärm)

---

### 📅 JULI

**Hauptthemen:** Steuererklärung abgeben, Urlaubszeit

**Typische Arbeiten:**
- ✅ Steuererklärung Vorjahr abgeben (Frist 31.07. für Privatpersonen ohne Steuerberater)
- ✅ Urlaubszeit: Weniger Mieter erreichbar
- ✅ Gartenpflege: Rasen wässern bei Hitze
- ✅ Dachkontrolle (Gewitter-Saison)

**Kommunikation:**
- Abwesenheitsnotizen (eigene Urlaube)
- Vertretungsregelungen kommunizieren

**Fristen:**
- ❗ 10.07.: Umsatzsteuer-Voranmeldung Juni
- ❗ 31.07.: Steuererklärung Vorjahr (ohne Steuerberater)

**Saisonales:**
- Hochsommer: Hitze-Beschwerden, Klimaanlagen-Anfragen
- Gewitter: Blitzschäden, Überschwemmungen im Keller

---

### 📅 AUGUST

**Hauptthemen:** Grundsteuer Q3, Sommerruhe

**Typische Arbeiten:**
- ✅ Grundsteuer Q3 überweisen (Fällig 15.08.)
- ✅ Ruhige Zeit nutzen für: Archivierung, System-Updates, Prozess-Verbesserungen
- ✅ Herbst-Arbeiten planen (Laub, Winterdienst)
- ✅ Angebote einholen für größere Reparaturen

**Kommunikation:**
- Weniger dringend (Urlaubszeit)

**Fristen:**
- ❗ 10.08.: Umsatzsteuer-Voranmeldung Juli
- ❗ 15.08.: Grundsteuer Q3 Fälligkeitsdatum

**Typische Probleme:**
- Viele Handwerker im Urlaub
- Mieter schwer erreichbar bei Problemen

---

### 📅 SEPTEMBER

**Hauptthemen:** Herbst-Vorbereitung, Steuervorauszahlung Q3

**Typische Arbeiten:**
- ✅ Steuervorauszahlung Q3 überweisen (Fällig 10.09.)
- ✅ Heizung vorbereiten (Druck prüfen, entlüften)
- ✅ Herbst-Check: Dachrinnen, Fallrohre
- ✅ Winterdienst-Vertrag erneuern oder neu ausschreiben
- ✅ Laubbeseitigung planen
- ✅ Mietverträge mit Kündigungsfrist 3 Monate prüfen (für Jahresende)

**Kommunikation:**
- Mieter über bevorstehende Heizperiode informieren
- Winterdienst-Firma kontaktieren

**Fristen:**
- ❗ 10.09.: Umsatzsteuer-Voranmeldung August
- ❗ 10.09.: Einkommensteuer-Vorauszahlung Q3

**Saisonales:**
- Heizperiode startet meist Ende September / Anfang Oktober

---

### 📅 OKTOBER

**Hauptthemen:** Heizperiode Start, Betriebskosten neues Jahr vorbereiten

**Typische Arbeiten:**
- ✅ Heizung anstellen (Heizperiode 01.10. - 30.04. in vielen Regionen)
- ✅ Heizkörper entlüften
- ✅ BK-Vorauszahlungen für kommendes Jahr kalkulieren
- ✅ Versorger-Abschläge prüfen und ggf. anpassen
- ✅ Laub-Beseitigung starten
- ✅ Herbststurm-Check (lose Dachziegel, Äste)

**Kommunikation:**
- Mieter: "Heizung läuft wieder", Tipps zum Heizen und Lüften
- Eigentümer: BK-Vorauszahlungen ggf. anpassen?

**Fristen:**
- ❗ 10.10.: Umsatzsteuer-Voranmeldung September

**Typische Probleme:**
- Erste Heiz-Beschwerden (Heizkörper werden nicht warm)
- Herbststürme: Schäden an Dach, Fassade

---

### 📅 NOVEMBER

**Hauptthemen:** Grundsteuer Q4, Jahresplanung

**Typische Arbeiten:**
- ✅ Grundsteuer Q4 überweisen (Fällig 15.11.)
- ✅ Jahresplanung kommendes Jahr starten
- ✅ Budget für kommendes Jahr erstellen
- ✅ Größere Reparaturen/Sanierungen planen
- ✅ Winterdienst-Bereitschaft prüfen
- ✅ Weihnachtsbeleuchtung (falls vorhanden) installieren

**Kommunikation:**
- Eigentümer: Jahresplanung besprechen (Investitionen, Mieterhöhungen?)
- Handwerker für Winterdienst briefen

**Fristen:**
- ❗ 10.11.: Umsatzsteuer-Voranmeldung Oktober
- ❗ 15.11.: Grundsteuer Q4 Fälligkeitsdatum

**Saisonales:**
- Wintereinbruch möglich (erster Schnee)
- Laub-Beseitigung intensiv

---

### 📅 DEZEMBER

**Hauptthemen:** Jahresabschluss, Steuervorauszahlung Q4

**Typische Arbeiten:**
- ✅ Steuervorauszahlung Q4 überweisen (Fällig 10.12.)
- ✅ Jahresabschluss vorbereiten
- ✅ Alle offenen Rechnungen bezahlen (noch im alten Jahr)
- ✅ Kontoauszüge vollständig erfassen
- ✅ Zählerstände zum 31.12. erfassen (für BK-Abrechnung)
- ✅ Wartungsverträge für kommendes Jahr verlängern
- ✅ Versicherungen prüfen (Jahreswechsel-Stichtag)
- ✅ Weihnachtsgrüße an Mieter und Geschäftspartner

**Kommunikation:**
- Mieter: Frohes Fest, Hinweis auf Winterdienst-Pflichten
- Eigentümer: Jahresabschluss-Preview

**Fristen:**
- ❗ 10.12.: Umsatzsteuer-Voranmeldung November
- ❗ 10.12.: Einkommensteuer-Vorauszahlung Q4
- ❗ 31.12.: Jahresende - alle Belege erfassen!

**Typische Probleme:**
- Feiertage: Weniger Arbeitszeit, viele im Urlaub
- Schnee und Eis: Winterdienst-Beschwerden
- Rechnungen vom Jahresende kommen erst im Januar

---

## 2. KRITISCHE FRISTEN (ÜBERSICHT)

### ⏰ BETRIEBSKOSTENABRECHNUNG

**Frist:** 12 Monate nach Ende des Abrechnungszeitraums

**Beispiel:**
- Abrechnungszeitraum: 01.01.2023 - 31.12.2023
- Frist: 31.12.2024 (= 12 Monate nach 31.12.2023)

**Rechtsfolge bei Fristversäumnis:**
❗ **Ausschlussfrist!** Nachzahlungsforderungen verfallen vollständig.
- Vermieter kann keine Nachzahlung mehr verlangen
- Guthaben muss trotzdem ausgezahlt werden
- Ausnahme: Vermieter war an pünktlicher Abrechnung gehindert (sehr selten)

**Besonderheiten:**
- Frist gilt auch bei Mieterwechsel
- Brief muss rechtzeitig ABGESCHICKT werden (Zugangsvermutung: 3 Tage später)
- Sicherheit: Brief 2 Wochen vor Fristende versenden (Einschreiben empfohlen)

**Praxis-Tipps:**
- BK-Abrechnung spätestens im November fertigstellen
- Bei komplexen Objekten schon im Oktober starten
- Reminder-Task: 11 Monate nach Jahresende

---

### ⏰ STEUERERKLÄRUNG

**Fristen:**

**Ohne Steuerberater:**
- **31. Juli** des Folgejahres
- Beispiel: Steuerjahr 2024 → Abgabe bis 31.07.2025

**Mit Steuerberater:**
- **28. Februar** des übernächsten Jahres
- Beispiel: Steuerjahr 2024 → Abgabe bis 28.02.2026

**Fristverlängerung:**
- Auf Antrag möglich (bei Steuerberater meist automatisch)
- Ohne Steuerberater: schriftlicher Antrag mit Begründung

**Rechtsfolge bei Fristversäumnis:**
- Verspätungszuschlag (mind. 25€ pro Monat)
- Steuerschätzung durch Finanzamt (meist ungünstig)
- Bei Erstattung: Kein Zinsverlust mehr seit 2019

**Was muss abgegeben werden:**
- Anlage V (für jedes vermietete Objekt)
- Anlage Sonstiges (bei Einkünften aus anderen Quellen)
- Belege müssen aufbewahrt, aber nicht mitgeschickt werden (nur auf Anfrage)

---

### ⏰ UMSATZSTEUER-VORANMELDUNG

**Monatlich oder Quartalsweise** (je nach Umsatz)

**Frist:** 10. des Folgemonats

**Beispiel:**
- Monat Januar → Abgabe bis 10. Februar
- Q1 (Jan-März) → Abgabe bis 10. April

**Rechtsfolge bei Fristversäumnis:**
- Verspätungszuschlag
- Mahnungen
- Im Extremfall: Schätzung

**Besonderheiten:**
- Dauerfristverlängerung möglich (1 Monat länger Zeit)
- Elektronische Abgabe über ELSTER verpflichtend

---

### ⏰ EINKOMMENSTEUER-VORAUSZAHLUNGEN

**Quartalsweise:** 10.03., 10.06., 10.09., 10.12.

**Grundlage:** Steuerbescheid des Vorjahres

**Rechtsfolge bei Fristversäumnis:**
- Säumniszuschlag (1% pro Monat)
- Mahnungen

**Besonderheiten:**
- Vorauszahlung kann auf Antrag angepasst werden (bei Änderung der Einkünfte)
- Bei zu hoher Vorauszahlung: Herabsetzungsantrag stellen

---

### ⏰ GRUNDSTEUER

**Quartalsweise:** 15.02., 15.05., 15.08., 15.11.

**Rechtsfolge bei Fristversäumnis:**
- Säumniszuschlag (1% pro Monat)
- Vollstreckungsmaßnahmen durch Gemeinde möglich

**Besonderheiten:**
- SEPA-Lastschrift empfehlenswert
- Bei Verkauf: Käufer übernimmt ab Eigentümerwechsel

---

### ⏰ MIETERHÖHUNG (§558 BGB)

**Fristen:**

**Ankündigungsfrist:** 3 Monate zum Monatsende
- Beispiel: Mieterhöhung ab 01.07. → Brief muss bis 31.03. beim Mieter sein

**Zustimmungsfrist:** 2 Monate
- Mieter muss innerhalb 2 Monaten zustimmen oder widersprechen
- Stillschweigende Zustimmung nach 2 Monaten

**Mindestabstand:** 15 Monate seit letzter Mieterhöhung

**Kappungsgrenze:** Max. 20% in 3 Jahren (oder 15% in angespannten Wohnungsmärkten)

---

### ⏰ KÜNDIGUNG MIETVERTRAG

**Durch Mieter:**
- **Kündigungsfrist:** Gesetzlich 3 Monate zum Monatsende
- Kann vertraglich nicht verlängert werden (nur verkürzt)
- Schriftform erforderlich (§568 BGB)

**Durch Vermieter:**
- **Kündigungsfrist:** Gestaffelt nach Mietdauer:
  - Bis 5 Jahre: 3 Monate
  - 5-8 Jahre: 6 Monate
  - Über 8 Jahre: 9 Monate
- Kündigungsgrund erforderlich (Eigenbedarf, Pflichtverletzung, etc.)

---

### ⏰ SCHÖNHEITSREPARATUREN

**Fristen gibt es nicht**, aber Renovierungsintervalle:

**Übliche Fristenklauseln (oft unwirksam!):**
- Küche, Bad: 3 Jahre
- Wohnräume: 5 Jahre
- Nebenräume: 7 Jahre

**ABER:** Starre Fristenklauseln sind meist unwirksam!
- Renovierung nur bei tatsächlichem Bedarf
- Abnutzung muss erkennbar sein

---

## 3. TYPISCHER TAGESABLAUF

### 🌅 MORGENS (8:00 - 10:00 Uhr)

**Email-Check:**
- ✅ Neue Mieter-Anfragen (Reparaturen, Beschwerden)
- ✅ Handwerker-Rückmeldungen (Termine, Kostenvoranschläge)
- ✅ Zahlungseingänge prüfen (Bankkonten checken)
- ✅ Dringende Probleme identifizieren (z.B. Heizungsausfall)

**Prioritäten setzen:**
- 🔴 Notfälle (Wasserrohrbruch, Heizungsausfall im Winter)
- 🟠 Dringende Anfragen (kaputte Haustür, Aufzug defekt)
- 🟡 Normale Anfragen (Glühbirne kaputt, Kleinreparaturen)

**Tagesplanung:**
- Termine koordinieren (Handwerker, Besichtigungen)
- Tasks priorisieren

---

### 🏢 VORMITTAG (10:00 - 12:30 Uhr)

**Hauptarbeitszeit:**
- ✅ Rechnungen erfassen und kategorisieren
- ✅ Zahlungen freigeben / überweisen
- ✅ Handwerker beauftragen (Termine vereinbaren)
- ✅ Mieter-Anfragen beantworten
- ✅ Dokumente erstellen (Mahnungen, Mieterhöhungen, Kündigungsbestätigungen)
- ✅ Objektbesichtigungen (Leerstandswohnungen für Interessenten)

**Kommunikation:**
- Telefonate (Mieter, Handwerker, Eigentümer)
- Vor-Ort-Termine (bei größeren Problemen)

---

### 🍽️ MITTAG (12:30 - 13:30 Uhr)

**Pause** (wichtig für Produktivität!)

---

### 🏗️ NACHMITTAG (13:30 - 17:00 Uhr)

**Strategische Arbeiten:**
- ✅ Betriebskostenabrechnungen erstellen
- ✅ Finanzplanung und Budgetierung
- ✅ Verträge prüfen und verlängern
- ✅ Anlage V vorbereiten (quartalsweise oder zum Jahresende)
- ✅ Reports für Eigentümer erstellen
- ✅ Langfristige Projekte (Sanierungen, Modernisierungen planen)

**Administrative Arbeiten:**
- Ablage (digital)
- System-Updates
- Prozess-Optimierungen

---

### 🌙 FEIERABEND (17:00 Uhr)

**Abschluss:**
- ✅ Offene Tasks notieren (für morgen)
- ✅ Email-Check (nur dringende Anfragen beantworten)
- ✅ Notruf-Erreichbarkeit (bei Notfällen: Handy)

---

### 📞 NOTDIENST (außerhalb Arbeitszeiten)

**Erreichbar für Notfälle:**
- Wasserrohrbruch
- Heizungsausfall (im Winter)
- Einbruch / Vandalismus
- Brandschaden
- Sturm-/Unwetterschäden

**NICHT für:**
- Normale Reparaturen (können bis nächsten Tag warten)
- Nachbarschaftsstreitigkeiten

---

## 4. SAISONALE BESONDERHEITEN

### ❄️ HEIZPERIODE (01.10. - 30.04.)

**Typische Arbeiten:**
- ✅ Heizung täglich kontrollieren (Temperatur, Druck)
- ✅ Heizkörper entlüften (zu Beginn und bei Bedarf)
- ✅ Heizkosten-Zwischenstand prüfen (monatlich)
- ✅ Bei Kälteeinbruch: Frostschutz prüfen (Leitungen in unbenutzten Räumen)

**Typische Probleme:**
- "Heizkörper wird nicht warm" → Entlüften, Ventil prüfen
- "Zu hohe Heizkosten" → Thermostate prüfen, Dämmung prüfen
- "Schimmel in der Wohnung" → Lüftungsverhalten prüfen, ggf. Baumangel

**Rechtliches:**
- Vermieter MUSS heizen (Mindesttemperatur 20-22°C in Wohnräumen)
- Heizperiode: 01.10. - 30.04. (kann vertraglich geregelt werden)
- Bei Heizungsausfall: Mietminderung möglich (bis zu 100% bei komplettem Ausfall im Winter)

**Kostenplanung:**
- Heizkosten machen 30-50% der Betriebskosten aus
- Abschläge rechtzeitig anpassen (bei steigenden Energiepreisen)

---

### ☀️ NICHT-HEIZPERIODE (01.05. - 30.09.)

**Typische Arbeiten:**
- ✅ Heizung auf Sommerbetrieb umstellen
- ✅ Heizung warten lassen (optimaler Zeitpunkt: Mai/Juni)
- ✅ Heizkostenabrechnung erstellen (für Betriebskostenabrechnung)
- ✅ Außenanlagen pflegen (Garten, Rasen, Hecken)
- ✅ Fassaden-Arbeiten (nur bei trockenem Wetter)

**Typische Probleme:**
- "Zu heiß in der Wohnung" → Sonnenschutz prüfen, Lüftungsverhalten
- "Klimaanlage gewünscht" → Meist keine Pflicht des Vermieters
- Balkon-Streitigkeiten (Grillen, Rauchen, Lärm)

**Kostenplanung:**
- Niedrigere Energiekosten
- Höhere Kosten für Gartenpflege, Reinigung

---

### 📊 BETRIEBSKOSTEN-SEASON (November - März)

**Hochphase:** Dezember - Februar

**Typische Arbeiten:**
- ✅ Alle Rechnungen des Vorjahres erfassen
- ✅ Zählerstände erfassen (Heizung, Wasser, Strom)
- ✅ Verbrauchsdaten auswerten
- ✅ Umlageschlüssel berechnen (Fläche, Personen, Verbrauch)
- ✅ BK-Abrechnung pro Einheit erstellen
- ✅ Dokumente generieren (für jeden Mieter)
- ✅ Versenden (Frist 12 Monate nach Jahresende beachten!)

**Typische Probleme:**
- Fehlende Rechnungen (Versorger versendet verspätet)
- Fehlerhafte Zählerstände (Mieter haben nicht abgelesen)
- Hohe Nachzahlungen führen zu Beschwerden/Zahlungsschwierigkeiten

**Kommunikation:**
- Frühzeitig mit Mietern kommunizieren (Vorwarnung bei hohen Nachzahlungen)
- Ratenzahlungen anbieten (bei finanziellen Problemen)

**Stress-Level:** 🔥🔥🔥 (hoch)

---

### 📑 STEUER-SEASON (März - Juli)

**Hochphase:** April - Juni

**Typische Arbeiten:**
- ✅ Alle Belege des Vorjahres kategorisieren
- ✅ Anlage V(s) erstellen (für jeden Eigentümer / jedes Objekt)
- ✅ Einnahmen-Überschuss-Rechnung (EÜR) erstellen
- ✅ Gewerbesteuer-Erklärung (bei gewerblicher Vermietung)
- ✅ Umsatzsteuer-Erklärung (Jahreserklärung)
- ✅ Unterlagen an Steuerberater übermitteln (oder selbst abgeben)

**Typische Probleme:**
- Falsche Kategorisierung von Kosten
- Fehlende Belege
- Unklare steuerliche Behandlung (z.B. Erhaltung vs. Herstellung)

**Kommunikation:**
- Mit Steuerberater abstimmen (Unterlagen vollständig?)
- Eigentümer über steuerliche Auswirkungen informieren

**Stress-Level:** 🔥🔥 (mittel-hoch)

---

### 🍂 HERBST-CHECK (September - Oktober)

**Typische Arbeiten:**
- ✅ Heizung vorbereiten (entlüften, Druck prüfen)
- ✅ Dachrinnen reinigen (Laub entfernen)
- ✅ Winterdienst-Vertrag prüfen/erneuern
- ✅ Außenanlagen winterfest machen
- ✅ Frostschutz (Außenwasserhähne, ungenutzte Räume)

**Stress-Level:** 🔥 (niedrig)

---

### ❄️ WINTER-DIENST (November - März)

**Typische Arbeiten:**
- ✅ Schnee räumen (oder Dienstleister beauftragen)
- ✅ Streuen (Gehwege eisfrei halten)
- ✅ Verkehrssicherungspflicht (Rutschgefahr vermeiden)

**Rechtliches:**
- Vermieter ist für Winterdienst verantwortlich
- Kann auf Mieter übertragen werden (schriftlich im Mietvertrag)
- Bei Unfall wegen mangelndem Winterdienst: Haftung!

**Stress-Level:** 🔥🔥🔥 (hoch bei starkem Winter)

---

## 5. TYPISCHE AUFGABEN-VERTEILUNG

### 📊 NACH HÄUFIGKEIT

**Täglich:**
- Email-Check
- Dringende Anfragen bearbeiten
- Zahlungseingänge prüfen

**Wöchentlich:**
- Rechnungen erfassen
- Zahlungen freigeben
- Mieter-Anfragen beantworten
- Handwerker koordinieren

**Monatlich:**
- Kontenabstimmung
- Liquiditätsprüfung
- Umsatzsteuer-Voranmeldung (falls monatlich)
- Objektbegehungen

**Quartalsweise:**
- Grundsteuer überweisen
- Einkommensteuer-Vorauszahlung
- Eigentümer-Reports
- Umsatzsteuer-Voranmeldung (falls quartalsweise)

**Jährlich:**
- Betriebskostenabrechnung
- Steuererklärung (Anlage V)
- Versicherungen prüfen
- Wartungsverträge erneuern
- Heizungswartung
- Schornsteinfeger

---

## 6. ZEITAUFWAND-SCHÄTZUNG

**Pro Wohneinheit und Monat:** ca. 1-3 Stunden

**Kleine Verwaltung (5-10 Einheiten):**
- 10-20 Stunden/Monat
- Nebentätigkeit möglich

**Mittlere Verwaltung (20-50 Einheiten):**
- 40-100 Stunden/Monat
- Vollzeit-Tätigkeit

**Große Verwaltung (100+ Einheiten):**
- Team erforderlich
- Spezialisierung sinnvoll (Buchhaltung, Technik, Vermietung)

**Saisonale Schwankungen:**
- Q1 (Jan-März): Hoch (Jahresabschluss, Steuern)
- Q2 (Apr-Jun): Sehr hoch (BK-Abrechnung, Steuererklärung)
- Q3 (Jul-Sep): Niedrig (Sommerpause)
- Q4 (Okt-Dez): Mittel (Jahresplanung, Winterdienst)

---

## 7. CHECKLISTEN

### ✅ MONATSENDE-ROUTINE

- [ ] Alle Rechnungen des Monats erfasst?
- [ ] Alle Zahlungseingänge gebucht?
- [ ] Mahnungen verschickt (bei Zahlungsverzug)?
- [ ] Kontoauszüge vollständig?
- [ ] Umsatzsteuer-Voranmeldung vorbereitet (falls monatlich)?
- [ ] Nächster Monat geplant (Termine, Aufgaben)?

---

### ✅ QUARTALSENDE-ROUTINE

- [ ] Grundsteuer-Überweisung erledigt?
- [ ] Einkommensteuer-Vorauszahlung erledigt?
- [ ] Quartalsbericht für Eigentümer erstellt?
- [ ] Umsatzsteuer-Voranmeldung erledigt (falls quartalsweise)?
- [ ] Versicherungen: Prämien bezahlt?

---

### ✅ JAHRESENDE-ROUTINE

- [ ] Alle Belege des Jahres erfasst?
- [ ] Zählerstände zum 31.12. erfasst?
- [ ] Konten abgestimmt?
- [ ] Wartungsverträge für nächstes Jahr erneuert?
- [ ] Versicherungen geprüft?
- [ ] BK-Abrechnung Vorjahr vorbereitet?
- [ ] Anlage V Vorjahr vorbereitet?

---

**Ende der Dokumentation**

Diese Dokumentation dient als Orientierung. Individuelle Gegebenheiten (Verträge, lokale Besonderheiten, spezielle Vereinbarungen) können abweichen.
`;

        const duration = (Date.now() - startTime) / 1000;

        // Speichere Dokumentation
        const doc = await base44.entities.GeneratedDocumentation.create({
            documentation_type: 'timeline_calendar',
            title: 'Jahreskalender & Fristen für Immobilienverwalter',
            description: 'Monatlicher Ablauf, kritische Fristen, typischer Tagesablauf und saisonale Besonderheiten',
            content_markdown: content,
            content_json: {
                sections: [
                    'Jahreskalender (12 Monate)',
                    'Kritische Fristen',
                    'Typischer Tagesablauf',
                    'Saisonale Besonderheiten',
                    'Aufgaben-Verteilung',
                    'Zeitaufwand-Schätzung',
                    'Checklisten'
                ],
                critical_deadlines: [
                    'Betriebskostenabrechnung: 12 Monate',
                    'Steuererklärung: 31.07. (ohne Steuerberater)',
                    'Grundsteuer: 15.02., 15.05., 15.08., 15.11.',
                    'Steuervorauszahlungen: 10.03., 10.06., 10.09., 10.12.'
                ],
                seasonal_peaks: [
                    'BK-Abrechnung Season: Nov-März',
                    'Steuer Season: März-Juli',
                    'Heizperiode: Okt-April'
                ]
            },
            file_size_bytes: new Blob([content]).size,
            generation_duration_seconds: duration,
            last_generated_at: new Date().toISOString(),
            status: 'completed'
        });

        return Response.json({
            success: true,
            documentation_id: doc.id,
            file_size_bytes: doc.file_size_bytes,
            generation_duration_seconds: duration
        });

    } catch (error) {
        console.error('Generate timeline documentation error:', error);
        return Response.json({
            error: error.message
        }, { status: 500 });
    }
});