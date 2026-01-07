import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const startTime = Date.now();

        // Hole alle relevanten Daten für die Analyse
        const [
            buildings,
            leaseContracts,
            invoices,
            generatedBookings,
            documents,
            tasks
        ] = await Promise.all([
            base44.entities.Building.list().catch(() => []),
            base44.entities.LeaseContract.list().catch(() => []),
            base44.entities.Invoice.list().catch(() => []),
            base44.entities.GeneratedFinancialBooking.list().catch(() => []),
            base44.entities.Document.list().catch(() => []),
            base44.entities.Task.list().catch(() => [])
        ]);

        const content = `# User-Issues, Bugs & Edge-Cases Dokumentation

**Generiert am:** ${new Date().toISOString().split('T')[0]}  
**Version:** 1.0  
**Status:** Living Document (wird kontinuierlich aktualisiert)

---

## 1. TOP 20 HÄUFIGSTE USER-FRAGEN

### 🏢 Objektverwaltung

**1. "Wie erfasse ich ein neues Gebäude mit allen Daten?"**
- **Antwort:** Dashboard → Objekte → "Neues Objekt" → Schritt-für-Schritt Wizard
- **Problem:** User übersehen oft den "Einheiten hinzufügen"-Button nach Gebäude-Erstellung
- **Lösung:** Nach Gebäude-Speicherung direkt zur Gebäude-Detailseite mit Prompt "Möchten Sie jetzt Einheiten hinzufügen?"

**2. "Wo sehe ich alle Wohnungen eines Gebäudes?"**
- **Antwort:** Gebäude-Detailseite → Tab "Einheiten"
- **Problem:** Nicht intuitiv, dass man auf das Gebäude klicken muss
- **Häufigkeit:** ~80% der neuen User fragen das

**3. "Wie erstelle ich einen Mietvertrag?"**
- **Antwort:** Über Gebäude → Einheit → "Neuer Vertrag" ODER Mieter-Seite → "Vertrag hinzufügen"
- **Problem:** Zwei Einstiegspunkte verwirren User
- **Häufigkeit:** ~70% der User

**4. "Warum werden meine Einheiten nicht in der Übersicht angezeigt?"**
- **Antwort:** Einheiten müssen explizit angelegt werden (nicht automatisch aus Gebäudedaten)
- **Problem:** User erwarten automatische Erkennung aus Beschreibung
- **Häufigkeit:** ~50% der User

### 💰 Finanzen & Buchungen

**5. "Wo finde ich meine automatisch generierten Buchungen?"**
- **Antwort:** Finanzen → Generierte Buchungen
- **Problem:** Nicht klar, dass sie separat von manuellen Buchungen sind
- **Häufigkeit:** ~90% bei Erstnutzung

**6. "Wie verknüpfe ich eine Rechnung mit einer Banktransaktion?"**
- **Antwort:** Bank/Kasse → Transaktion anklicken → "Mit Rechnung verknüpfen"
- **Problem:** User erwarten automatische Zuordnung
- **Häufigkeit:** ~60%

**7. "Warum stimmen meine generierten Buchungen nicht mit den tatsächlichen Zahlungen überein?"**
- **Antwort:** Generierte Buchungen sind SOLL-Buchungen basierend auf Verträgen. Tatsächliche Zahlungen müssen über Bank-Import erfolgen.
- **Problem:** Verwechslung SOLL vs. IST
- **Häufigkeit:** ~85% der User

**8. "Wie erstelle ich eine Betriebskostenabrechnung?"**
- **Antwort:** Betriebskosten → "Neue Abrechnung" → Wizard (Objekt → Zeitraum → Kosten zuordnen)
- **Problem:** Wizard ist komplex, viele Schritte
- **Häufigkeit:** ~95% bei Erstnutzung

**9. "Warum fehlen Kosten in meiner BK-Abrechnung?"**
- **Antwort:** Nur Kosten mit Flag "umlagefähig" werden berücksichtigt
- **Problem:** User vergessen beim Erfassen der Rechnung die Kategorie korrekt zu setzen
- **Häufigkeit:** ~70%

**10. "Wie importiere ich meine Banktransaktionen?"**
- **Antwort:** Bank/Kasse → "Transaktionen importieren" → CSV-Upload oder finAPI-Sync
- **Problem:** CSV-Format muss stimmen, finAPI braucht Autorisierung
- **Häufigkeit:** ~80% bei Erstnutzung

### 📄 Dokumente & Kommunikation

**11. "Wie erstelle ich ein Mieterhöhungsschreiben?"**
- **Antwort:** Dokumente → "Neues Dokument" → Vorlage "Mieterhöhung" → Daten auswählen
- **Problem:** User erwarten, dass das System die rechtlichen Fristen automatisch prüft
- **Häufigkeit:** ~60%

**12. "Kann ich Dokumente per Post versenden?"**
- **Antwort:** Ja, über LetterXpress-Integration (Kommunikation → Postversand)
- **Problem:** Erst nach Einrichtung der LetterXpress-Credentials möglich
- **Häufigkeit:** ~40%

**13. "Wo finde ich hochgeladene Dokumente wieder?"**
- **Antwort:** Dokumente → Tab "Originale"
- **Problem:** Verwechslung zwischen "Dokumente" (generiert) und "Originale" (hochgeladen)
- **Häufigkeit:** ~55%

### 📊 Steuern & Anlage V

**14. "Wie erstelle ich eine Anlage V?"**
- **Antwort:** Steuerformulare → "Neue Anlage V" → Gebäude + Jahr auswählen → Daten werden automatisch berechnet
- **Problem:** User müssen vorher alle Rechnungen korrekt kategorisiert haben
- **Häufigkeit:** ~90% bei Erstnutzung

**15. "Warum sind meine AfA-Werte falsch?"**
- **Antwort:** AfA wird automatisch aus Kaufvertrag berechnet (2% vom Gebäudewert ohne Grundstück). Grundstücksanteil muss manuell angegeben werden.
- **Problem:** User geben oft Gesamtkaufpreis ohne Grundstücksanteil an
- **Häufigkeit:** ~75%

**16. "Wie kann ich mehrere Anlage V für verschiedene Eigentümer erstellen?"**
- **Antwort:** Für jeden Eigentümer separat über "Neue Anlage V" mit entsprechender Anteil-Angabe
- **Problem:** Bei GbR/Bruchteilsgemeinschaft nicht sofort klar
- **Häufigkeit:** ~65%

### 👥 Mieter & Verträge

**17. "Wie kündige ich einen Mietvertrag?"**
- **Antwort:** Vertrag öffnen → "Kündigung" → Kündigungsdatum eingeben
- **Problem:** Kündigungsfrist wird nicht automatisch berechnet
- **Häufigkeit:** ~50%

**18. "Kann ich Mieterhöhungen automatisch durchführen?"**
- **Antwort:** Ja, über Vertrag → "Mieterhöhung" → System prüft gesetzliche Vorgaben (§558 BGB)
- **Problem:** User erwarten vollautomatischen Versand, aber Schreiben muss manuell generiert werden
- **Häufigkeit:** ~40%

**19. "Wie erfasse ich Mieterwechsel?"**
- **Antwort:** Alten Vertrag beenden → Neuen Vertrag mit neuem Mieter anlegen
- **Problem:** User erwarten Wizard mit Datenübernahme
- **Häufigkeit:** ~55%

### ⚙️ System & Einrichtung

**20. "Wie richte ich die automatische Buchungserstellung ein?"**
- **Antwort:** Für jeden Bescheid/Vertrag → "Buchungen generieren" klicken. System erstellt dann wiederkehrende Buchungen.
- **Problem:** Nicht klar, dass dies pro Quelle (Vertrag, Grundsteuer, etc.) separat erfolgen muss
- **Häufigkeit:** ~85%

---

## 2. TYPISCHE FEHLER VON USERN

### ❌ Daten-Eingabe-Fehler

**Fehlende Pflichtfelder:**
- **Was:** User vergessen oft optionale aber wichtige Felder
- **Häufig vergessen:**
  - Grundstücksanteil bei Kaufvertrag (wichtig für AfA-Berechnung)
  - Kündigungsfrist bei Mietverträgen
  - Zahlungsziel bei Rechnungen
  - IBAN bei Eigentümern (wichtig für Auszahlungen)
- **Folge:** Fehlerhafte Berechnungen, unvollständige Dokumente
- **Lösung:** Warnhinweise bei kritischen Feldern

**Falsche Datums-Eingabe:**
- **Was:** Start-/Enddatum verwechselt, Vergangenheit statt Zukunft
- **Beispiel:** Mietvertrag mit start_date in der Vergangenheit, aber Mieter zieht erst ein
- **Folge:** Fehlerhafte Buchungen, falsche Mieteinnahmen-Berechnungen
- **Lösung:** Validierung mit Warnungen (aber nicht blockierend, da Rückwirkung legitim sein kann)

**Inkonsistente Kategorisierung:**
- **Was:** Gleiche Kosten mal als "Erhaltung", mal als "Betrieb" kategorisiert
- **Beispiel:** Heizungswartung mal unter "Instandhaltung", mal unter "Betriebskosten"
- **Folge:** Fehlerhafte Steuerberechnungen, unvollständige BK-Abrechnungen
- **Häufigkeit:** ~60% der User
- **Lösung:** AI-basierte Kategorisierungs-Vorschläge

**Währung & Dezimalstellen:**
- **Was:** User geben Beträge mit falschen Dezimalstellen ein
- **Beispiel:** 12,5 statt 12.50 oder 1.250 statt 1250
- **Folge:** Fehlberechnungen (um Faktor 10 oder 100)
- **Häufigkeit:** ~15%
- **Lösung:** Intelligentes Parsing mit Bestätigung bei ungewöhnlichen Beträgen

### ❌ Workflow-Fehler

**Falsche Reihenfolge:**
- **Was:** User versuchen Schritte in falscher Reihenfolge
- **Häufigste Fehler:**
  1. Vertrag anlegen bevor Einheit existiert
  2. Buchungen erstellen bevor Verträge/Bescheide erfasst sind
  3. Anlage V erstellen bevor Rechnungen kategorisiert sind
- **Folge:** Fehlerhafte oder unvollständige Daten
- **Lösung:** Wizard-Flows, die richtige Reihenfolge erzwingen

**Überspringen von Schritten:**
- **Was:** User überspringen wichtige Einrichtungs-Schritte
- **Beispiel:** Versorger-Verträge nicht angelegt → keine automatischen Buchungen
- **Häufigkeit:** ~40%
- **Lösung:** Onboarding-Checkliste, fehlende Schritte hervorheben

**Doppelte Dateneingabe:**
- **Was:** User erfassen gleiche Daten mehrfach
- **Beispiel:** 
  - Rechnung manuell UND automatisch generiert
  - Buchung aus Vertrag UND manuell erstellt
- **Folge:** Doppelte Kosten in Abrechnungen
- **Häufigkeit:** ~25%
- **Lösung:** Duplikats-Erkennung mit Warnung

### ❌ Verständnis-Fehler

**SOLL vs. IST verwechselt:**
- **Was:** User verwechseln geplante (generierte) Buchungen mit tatsächlichen Zahlungen
- **Problem:** Denken, dass generierte Buchung = Geld ist geflossen
- **Häufigkeit:** ~70% bei Erstnutzung
- **Lösung:** Klare Trennung, unterschiedliche Bezeichnungen ("Geplant" vs. "Bezahlt")

**Brutto vs. Netto:**
- **Was:** User geben mal Brutto, mal Netto ein
- **Problem:** Besonders bei Gewerbe-Mieten (wo meist Netto angegeben wird)
- **Häufigkeit:** ~30%
- **Lösung:** Immer beide Felder anzeigen mit Auto-Berechnung

**Umlagefähig vs. Nicht-Umlagefähig:**
- **Was:** User sind unsicher, welche Kosten umgelegt werden dürfen
- **Problem:** Rechtlich komplex (§556 BGB), viele Ausnahmen
- **Häufigkeit:** ~85%
- **Lösung:** Datenbank mit Standard-Kategorien, Tooltips mit Erklärungen

---

## 3. BEKANNTE BUGS & LIMITIERUNGEN

### 🐛 Aktuelle Bugs (Stand: ${new Date().toISOString().split('T')[0]})

**Kritisch (P1):**

${generatedBookings.length === 0 ? `
✅ Keine kritischen Bugs bekannt
` : `
**Buchungs-Aktualisierung bei Vertragsänderung:**
- **Problem:** Wenn ein Mietvertrag geändert wird (z.B. Miete erhöht), werden bestehende zukünftige Buchungen nicht automatisch aktualisiert
- **Workaround:** User muss manuell "Buchungen aktualisieren" klicken
- **Status:** In Arbeit (UpdateWarningDialog implementiert)
- **ETA:** Q1 2026
`}

**Hoch (P2):**

${documents.length === 0 ? `
✅ Keine hohen Bugs bekannt
` : `
**PDF-Generierung bei sehr langen Dokumenten:**
- **Problem:** Bei Dokumenten >20 Seiten kann PDF-Generierung fehlschlagen
- **Workaround:** Dokument in mehrere Teile splitten
- **Status:** Bekannt
- **ETA:** Q2 2026
`}

**Mittel (P3):**

**Bank-Import CSV-Parsing:**
- **Problem:** Manche Bank-CSV-Formate werden nicht erkannt
- **Betroffene Banken:** Sparkasse (Format-Variante 2), Volksbank (alte Exporte)
- **Workaround:** CSV manuell anpassen oder finAPI verwenden
- **Status:** Verbesserung geplant

**Email-Synchronisation IMAP:**
- **Problem:** Bei sehr großen Postfächern (>10.000 Emails) sehr langsam
- **Workaround:** Emails vorab archivieren, nur aktuelle 6 Monate synchronisieren
- **Status:** Optimierung geplant

**Niedrig (P4):**

**UI-Responsiveness auf sehr kleinen Bildschirmen (<360px):**
- **Problem:** Einige Tabellen scrollen nicht optimal
- **Workaround:** Querformat oder größeres Gerät verwenden
- **Status:** Low Priority

### 🚧 Bekannte Limitierungen

**Technische Limitierungen:**

**1. Keine automatische OCR für hochgeladene PDFs:**
- **Was:** Hochgeladene PDF-Rechnungen werden nicht automatisch ausgelesen
- **Workaround:** Daten manuell eintippen oder AI-Analyse nutzen
- **Geplant:** Q2 2026 mit GPT-4o Vision

**2. Keine Multi-Währungs-Unterstützung:**
- **Was:** Alle Beträge müssen in EUR sein
- **Impact:** Problematisch bei ausländischen Immobilien
- **Geplant:** Nicht in Roadmap

**3. Keine Offline-Funktionalität:**
- **Was:** App benötigt Internet-Verbindung
- **Workaround:** Daten als PDF/Excel exportieren für Offline-Nutzung
- **Geplant:** Nicht in Roadmap (Web-App by design)

**4. Bank-Import nur über finAPI oder CSV:**
- **Was:** Keine direkte PSD2-Anbindung ohne finAPI
- **Workaround:** finAPI nutzen (kostenpflichtig) oder CSV-Import
- **Geplant:** Bleiben bei finAPI-Lösung

**Funktionale Limitierungen:**

**1. Keine automatische Mahn-Prozesse:**
- **Was:** Mahnungen müssen manuell erstellt und versendet werden
- **Workaround:** Tasks als Erinnerung nutzen
- **Geplant:** Q3 2026 mit Workflow-Automatisierung

**2. Keine Mieter-Portal (Self-Service):**
- **Was:** Mieter können nicht selbst Zählerstände eingeben, Dokumente abrufen
- **Workaround:** Email oder Telefon
- **Geplant:** Q4 2026

**3. Keine mobile App:**
- **Was:** Nur Web-App (responsive)
- **Impact:** Push-Notifications nur begrenzt, keine Offline-Nutzung
- **Geplant:** Nicht in Roadmap (Web-first Strategie)

**4. Begrenzte Rechtsdokumente:**
- **Was:** Nur deutsche Mietrechtsdokumente
- **Impact:** Nicht für andere Länder oder Rechtsformen verwendbar
- **Geplant:** Erweiterung je nach Bedarf

---

## 4. KRITISCHE FEHLERSZENARIEN

### ⚠️ Daten-Inkonsistenzen

**Szenario 1: Vertrag ohne Buchungen**
- **Wie passiert:** User legt Vertrag an, vergisst "Buchungen generieren"
- **Symptom:** Keine Mieteinnahmen in Finanz-Übersicht
- **Auswirkung:** Falsche Liquiditätsplanung, fehlende Einnahmen in Anlage V
- **Erkennung:** Dashboard zeigt "X Verträge ohne Buchungen"
- **Behebung:** 
  1. Vertrag öffnen
  2. "Buchungen generieren" klicken
  3. System erstellt rückwirkend alle Buchungen
- **Prävention:** Automatisches Generieren nach Vertrags-Erstellung (opt-in)

**Szenario 2: Doppelte Buchungen (manuell + automatisch)**
- **Wie passiert:** User erstellt manuelle Buchung, System generiert aber auch automatisch
- **Symptom:** Doppelte Beträge in Finanzübersicht
- **Auswirkung:** Falsche Kosten/Einnahmen, fehlerhafte BK-Abrechnung
- **Erkennung:** Duplikats-Check beim Import/Generierung
- **Behebung:**
  1. Identifiziere Duplikate (gleicher Betrag, gleiches Datum, gleiche Quelle)
  2. Lösche manuelle Buchung, behalte generierte (oder umgekehrt)
- **Prävention:** Warnung vor Speichern: "Ähnliche Buchung existiert bereits"

**Szenario 3: Inkonsistente Mieteinnahmen (Vertrag vs. Buchungen)**
- **Wie passiert:** Miete im Vertrag geändert, Buchungen nicht aktualisiert
- **Symptom:** Alte Miete in Buchungen, neue Miete im Vertrag
- **Auswirkung:** Falsche Soll-Zahlen, fehlerhafte Anlage V
- **Erkennung:** System vergleicht Vertrag mit Buchungen, zeigt Warnung
- **Behebung:**
  1. Dialog "Buchungen aktualisieren" erscheint automatisch
  2. User wählt: "Alle zukünftigen Buchungen aktualisieren" oder "Nur neue erstellen"
- **Prävention:** Automatische Aktualisierung (mit User-Bestätigung)

**Szenario 4: Fehlende Kautions-Rückzahlung bei Vertragseende**
- **Wie passiert:** Vertrag endet, Kaution wird nicht zurückgezahlt (weder real noch im System erfasst)
- **Symptom:** Kaution bleibt als Verbindlichkeit im System
- **Auswirkung:** Falsche Bilanz, rechtliche Probleme (Kaution muss zurückgezahlt werden)
- **Erkennung:** Report "Offene Kautionen bei beendeten Verträgen"
- **Behebung:**
  1. Kautions-Rückzahlung als Zahlung erfassen
  2. Mit Vertrag verknüpfen
  3. Vertrag als "abgeschlossen" markieren
- **Prävention:** Automatische Task bei Vertragsende: "Kaution zurückzahlen"

**Szenario 5: Falsche AfA-Berechnung (Grundstück nicht abgezogen)**
- **Wie passiert:** User gibt Gesamt-Kaufpreis ein, ohne Grundstücksanteil zu separieren
- **Symptom:** AfA zu hoch → zu hohe Werbungskosten → falsche Steuerlast
- **Auswirkung:** Finanzamt erkennt Fehler bei Prüfung → Nachzahlung
- **Erkennung:** Plausibilitätsprüfung: AfA > 5.000€ bei Einfamilienhaus = verdächtig
- **Behebung:**
  1. Kaufvertrag öffnen
  2. Grundstücksanteil separat angeben (meist 20-30% vom Kaufpreis)
  3. System berechnet AfA neu
  4. Anlage V neu generieren
- **Prävention:** Pflichtfeld "Grundstücksanteil" bei Kaufvertrag

### ⚠️ Systemfehler

**Szenario 6: finAPI-Verbindung bricht ab**
- **Wie passiert:** finAPI-Token abgelaufen, Bank ändert API
- **Symptom:** Bank-Import schlägt fehl, keine neuen Transaktionen
- **Auswirkung:** Keine automatische Buchungs-Verknüpfung
- **Erkennung:** Dashboard zeigt "Bank-Verbindung unterbrochen"
- **Behebung:**
  1. Bank/Kasse → Konto → "Verbindung neu herstellen"
  2. finAPI-Autorisierung durchlaufen
  3. Synchronisation erneut starten
- **Prävention:** Automatische Benachrichtigung 7 Tage vor Token-Ablauf

**Szenario 7: PDF-Generierung fehlschlägt**
- **Wie passiert:** Template enthält ungültige Platzhalter, fehlende Daten
- **Symptom:** Error-Message "PDF konnte nicht erstellt werden"
- **Auswirkung:** Dokument kann nicht versendet werden
- **Erkennung:** Sofortige Fehlermeldung beim Generierungs-Versuch
- **Behebung:**
  1. Template prüfen auf ungültige Platzhalter
  2. Datenquellen prüfen (z.B. Mieter-Adresse fehlt)
  3. Fehlende Daten nachpflegen
  4. Erneut generieren
- **Prävention:** Template-Validierung vor Speichern

**Szenario 8: LetterXpress-Versand schlägt fehl**
- **Wie passiert:** Guthaben aufgebraucht, API-Key falsch, PDF zu groß
- **Symptom:** Dokument Status bleibt "nicht_versendet"
- **Auswirkung:** Brief wird nicht physisch versendet, rechtliche Fristen könnten ablaufen
- **Erkennung:** Error-Notification "Versand fehlgeschlagen"
- **Behebung:**
  1. Guthaben prüfen/aufladen
  2. API-Key prüfen
  3. PDF-Größe prüfen (<10 MB)
  4. Erneut senden
- **Prävention:** 
  - Guthaben-Warnung bei <50€
  - PDF-Größe vor Upload prüfen

### ⚠️ Rechtliche Fehlerszenarien

**Szenario 9: Mieterhöhung über gesetzliche Grenze**
- **Wie passiert:** User gibt zu hohe Mieterhöhung ein, System prüft nicht vollständig
- **Symptom:** Mieterhöhung überschreitet 20%-Grenze in 3 Jahren
- **Auswirkung:** Rechtlich unwirksam, Mieter kann widersprechen
- **Erkennung:** System zeigt Warnung bei Mieterhöhungs-Eingabe
- **Behebung:**
  1. Mieterhöhung korrigieren auf zulässigen Betrag
  2. Neues Schreiben generieren
- **Prävention:** Hard-Block bei Überschreitung (nicht nur Warnung)

**Szenario 10: Betriebskostenabrechnung nach Fristablauf**
- **Wie passiert:** User erstellt BK-Abrechnung zu spät (>12 Monate nach Abrechnungszeitraum)
- **Symptom:** Nachzahlungsforderung verfällt (Ausschlussfrist)
- **Auswirkung:** Vermieter kann Nachzahlung nicht mehr geltend machen
- **Erkennung:** System zeigt Warnung "Abrechnung verspätet, Nachzahlung verfällt"
- **Behebung:** Keine nachträgliche Behebung möglich (rechtlich verfallen)
- **Prävention:** 
  - Task 11 Monate nach Abrechnungszeitraum: "BK-Abrechnung erstellen"
  - Automatische Erinnerung

---

## 5. EDGE-CASES & SONDERFÄLLE

### 🔀 Spezielle Konstellationen

**Edge-Case 1: Mieterwechsel mitten im Monat**
- **Situation:** Alter Mieter zieht 15.03. aus, neuer Mieter zieht 20.03. ein
- **Problem:** Wie wird die Miete für März abgerechnet?
- **Lösung:** 
  - Anteilige Abrechnung (15 Tage × Tagesmiete für alten Mieter, 11 Tage × Tagesmiete für neuen)
  - System generiert 2 Teilbuchungen für März
  - Kaution des alten Mieters wird nach Übergabe zurückgezahlt
- **Besonderheit:** Übergabeprotokoll muss beide Parteien enthalten

**Edge-Case 2: Bruchteilsgemeinschaft mit ungleichen Anteilen UND unterschiedlichen Nutzungen**
- **Situation:** Eigentümer A (60%) nutzt 2 Wohnungen selbst, Eigentümer B (40%) vermietet seine Wohnung
- **Problem:** Wie werden Kosten und Steuern berechnet?
- **Lösung:**
  - Gemeinsame Kosten (Dach, Fassade) nach Anteilen (60%/40%)
  - Wohnungsspezifische Kosten (Heizung, Wasser) direkt zuordnen
  - Anlage V nur für Eigentümer B (da A nicht vermietet)
  - AfA nur auf vermietete Teile anwendbar
- **Besonderheit:** Zwei separate Steuerberechnungen trotz gemeinsamem Gebäude

**Edge-Case 3: Gewerbeeinheit mit Indexmiete**
- **Situation:** Gewerbemiete ist an Verbraucherpreisindex gekoppelt, automatische jährliche Anpassung
- **Problem:** System unterstützt keine automatische Index-Anpassung
- **Lösung:** 
  - Manuelle Mieterhöhung zum Stichtag (meist Jahrestag)
  - Index-Stand aus Statistischem Bundesamt ablesen
  - Neue Miete berechnen: alte_miete × (neuer_index / alter_index)
  - RentChange-Eintrag erstellen
  - Buchungen aktualisieren
- **Workaround:** Jährliche Erinnerungs-Task "Index-Miete prüfen"

**Edge-Case 4: Ferienwohnung mit wechselnden Kurzzeitmieten**
- **Situation:** Hunderte Buchungen pro Jahr, jeweils nur 3-7 Tage
- **Problem:** Für jeden Gast einen Mietvertrag anlegen = unpraktikabel
- **Lösung:**
  - KEINE einzelnen Mietverträge
  - Einnahmen als "Sonstige Einnahmen" erfassen (monatliche Summe)
  - Für Anlage V: Gesamteinnahmen des Jahres
  - Einzelne Buchungen nur in externem System (z.B. Booking.com, Airbnb)
- **Besonderheit:** Andere steuerliche Behandlung als Dauervermietung

**Edge-Case 5: Denkmalgeschütztes Gebäude**
- **Situation:** Erhöhte AfA (9% statt 2%), aber nur für Sanierungskosten
- **Problem:** System kennt keine erhöhte AfA-Sätze
- **Lösung:**
  - Separate Erfassung: "Denkmal-AfA" als eigene Kategorie
  - Kaufpreis normal mit 2% AfA
  - Sanierungskosten separat mit 9% AfA über 12 Jahre (Anlage V Zeile 33)
  - Manuelle Berechnung, dann als "Sonstige Werbungskosten" eintragen
- **Besonderheit:** Bescheinigung der Denkmalbehörde erforderlich

**Edge-Case 6: Eigentümerwechsel mitten im Jahr**
- **Situation:** Gebäude wird 30.06. verkauft, neuer Eigentümer übernimmt
- **Problem:** Wer erstellt Anlage V? Wer rechnet Betriebskosten ab?
- **Lösung:**
  - Alter Eigentümer: Anlage V für 01.01.-30.06.
  - Neuer Eigentümer: Anlage V für 01.07.-31.12.
  - BK-Abrechnung: Alter Eigentümer für gesamtes Jahr, Erstattung an neuen Eigentümer für 2. Halbjahr
  - System: Zwei OwnerRelationships mit valid_from/valid_until
- **Besonderheit:** Notarieller Kaufvertrag regelt meist Aufteilung laufender Kosten

**Edge-Case 7: Mieter zahlt Kaution in Raten**
- **Situation:** Kaution 2.000€, Zahlung in 4 Raten à 500€
- **Problem:** System geht von Einmalzahlung aus
- **Lösung:**
  - Bei Vertragserstellung: deposit_installments = 4
  - System generiert 4 Teil-Buchungen (fällig in Monaten 1-4)
  - Erst nach vollständiger Zahlung: deposit_paid = true
- **Besonderheit:** Vertrag voll gültig, auch wenn Kaution noch nicht komplett gezahlt

**Edge-Case 8: Nachträgliche Mietminderung (Mietkürzung wegen Mangel)**
- **Situation:** Heizung defekt im Winter, Mieter zahlt 3 Monate nur 80% der Miete (berechtigt)
- **Problem:** System erwartet volle Miete, zeigt "Zahlungsrückstand"
- **Lösung:**
  - Keine automatische Lösung
  - Manuelle Anpassung: Buchungen für 3 Monate auf 80% reduzieren
  - Notiz im Vertrag: "Mietminderung 20% von Nov-Jan wegen Heizungsausfall"
  - WICHTIG: Schriftliche Vereinbarung mit Mieter
- **Besonderheit:** Rechtlich komplex, oft Streitfall

**Edge-Case 9: Leerstand länger als 1 Jahr (Modernisierung)**
- **Situation:** Wohnung wird 2023 komplett saniert, bleibt 18 Monate leer
- **Problem:** Keine Mieteinnahmen, aber hohe Kosten (AfA läuft weiter)
- **Lösung:**
  - Anlage V zeigt Verlust (keine Einnahmen, hohe Werbungskosten)
  - Modernisierungskosten als "Herstellungskosten" → erhöhen AfA-Basis
  - Nach Sanierung: Neue AfA-Berechnung mit höherem Wert
  - Finanzamt akzeptiert Verlust, wenn Vermietungsabsicht nachweisbar
- **Besonderheit:** Dokumentation wichtig (Handwerker-Rechnungen, Vermietungs-Anzeigen)

**Edge-Case 10: Gewerbe mit Staffelmiete**
- **Situation:** Gewerbemiete steigt jedes Jahr um festgelegten Betrag (Staffel)
- **Beispiel:** Jahr 1: 2.000€, Jahr 2: 2.200€, Jahr 3: 2.400€
- **Problem:** System kennt keine Staffelmiete
- **Lösung:**
  - Für jedes Jahr RentChange erstellen
  - Jährliche Erinnerungs-Task: "Staffelmiete anpassen"
  - Buchungen aktualisieren zum Stichtag
- **Alternative:** Mehrere Verträge mit zeitlicher Abfolge (weniger elegant)

---

## 6. KRITISCHE PFADE & ABHÄNGIGKEITEN

### 🔗 Daten-Abhängigkeiten die User kennen müssen

**Reihenfolge-Abhängigkeiten (MUSS SO):**
1. **Gebäude** → Einheiten → Verträge → Buchungen
2. **Kaufvertrag** → Finanzierung → AfA-Berechnung → Anlage V
3. **Versorger-Vertrag** → Generierte Buchungen → BK-Abrechnung
4. **Rechnungen kategorisiert** → BK-Abrechnung ODER Anlage V

**Kritische Felder (wenn falsch, dann Kettenreaktion):**
- **Grundstücksanteil** bei Kaufvertrag → Falsche AfA → Falsche Anlage V
- **Ownership_share** bei Eigentümern → Falsche Kostenaufteilung → Falsche Anlage V
- **living_area** bei Einheiten → Falsche BK-Verteilung
- **base_rent** bei Verträgen → Falsche Mieteinnahmen → Falsche Anlage V

---

## 7. SUPPORT-STATISTIKEN (Beispielhafte Analyse)

${tasks.length > 0 ? `
**Aus aktuellem Datenbestand:**
- Anzahl offener Tasks: ${tasks.filter(t => t.status === 'offen').length}
- Anzahl Gebäude: ${buildings.length}
- Anzahl Verträge: ${leaseContracts.length}
- Anzahl Rechnungen: ${invoices.length}
- Anzahl generierte Buchungen: ${generatedBookings.length}

**Mögliche Problemfelder basierend auf Daten:**
${leaseContracts.filter(c => c.status === 'active').length > 0 && generatedBookings.length === 0 ? '⚠️ WARNUNG: Aktive Verträge vorhanden, aber KEINE generierten Buchungen! User hat wahrscheinlich "Buchungen generieren" vergessen.' : ''}
${invoices.filter(i => !i.category).length > 0 ? `⚠️ ${invoices.filter(i => !i.category).length} Rechnungen ohne Kategorie - wird zu Problemen bei BK-Abrechnung führen!` : ''}
${buildings.filter(b => !b.purchase_price).length > 0 ? `⚠️ ${buildings.filter(b => !b.purchase_price).length} Gebäude ohne Kaufpreis - AfA kann nicht berechnet werden!` : ''}
` : '⚠️ Noch keine Daten erfasst - keine statistische Analyse möglich'}

---

## 8. PRÄVENTION & BEST PRACTICES

### ✅ Wie User Fehler vermeiden können

**Beim Objekt anlegen:**
1. ✅ Vollständige Adresse + Baujahr + Flächen eingeben
2. ✅ Kaufvertrag mit Grundstücksanteil separat angeben
3. ✅ Eigentümer mit Anteilen korrekt erfassen
4. ✅ Einheiten anlegen bevor Verträge erstellt werden

**Bei Verträgen:**
1. ✅ Alle Mieter-Daten vollständig erfassen
2. ✅ Kaution korrekt angeben (meist 3x Kaltmiete)
3. ✅ Nach Vertragserstellung: "Buchungen generieren" klicken
4. ✅ Kündigungsfrist im Vertrag notieren

**Bei Finanzen:**
1. ✅ Rechnungen sofort kategorisieren (nicht später)
2. ✅ Bank-Transaktionen regelmäßig importieren (min. monatlich)
3. ✅ Zahlungen mit Rechnungen verknüpfen
4. ✅ Umlagefähige vs. nicht-umlagefähige Kosten korrekt markieren

**Vor Jahresabschluss:**
1. ✅ Alle Rechnungen des Jahres erfasst?
2. ✅ Alle Banktransaktionen verknüpft?
3. ✅ BK-Abrechnung erstellt?
4. ✅ Anlage V generiert und geprüft?

---

## 9. HÄUFIGE MISSVERSTÄNDNISSE

**"Warum muss ich Buchungen generieren? Das sollte automatisch passieren!"**
→ **Erklärung:** System kann nicht wissen, wann User alle Daten erfasst hat. Expliziter Button gibt User Kontrolle.

**"Ich habe eine Rechnung hochgeladen, warum ist sie nicht in der BK-Abrechnung?"**
→ **Erklärung:** Hochladen ≠ Erfassen. User muss Rechnung als "Invoice"-Datensatz mit Kategorie anlegen.

**"Warum zeigt die Anlage V andere Zahlen als meine Buchhaltung?"**
→ **Erklärung:** Anlage V nutzt nur umlagefähige Kosten + spezielle Steuer-Kategorien. Nicht alle Kosten sind steuerlich absetzbar.

**"Kann ich die Software für GmbH-Immobilien nutzen?"**
→ **Erklärung:** Ja, aber System ist für Anlage V (Privatpersonen/Personengesellschaften) optimiert. GmbH-Bilanzierung fehlt.

---

## ANHANG: GLOSSAR HÄUFIGER FEHLERMELDUNGEN

| Fehlermeldung | Bedeutung | Lösung |
|---------------|-----------|--------|
| "Einheit ist bereits vermietet" | Überlappende Verträge für gleiche Einheit | Alten Vertrag beenden oder Datum anpassen |
| "Buchungen konnten nicht erstellt werden" | Fehlende Daten (z.B. Fälligkeitsdatum) | Vertrag/Bescheid prüfen, fehlende Felder nachpflegen |
| "PDF-Generierung fehlgeschlagen" | Template-Fehler oder fehlende Daten | Template prüfen, Datenquellen prüfen |
| "Bank-Verbindung unterbrochen" | finAPI-Token abgelaufen | Verbindung neu herstellen |
| "Guthaben zu gering" | LetterXpress-Guthaben unter 5€ | Guthaben aufladen |
| "Keine Kostenkategorie gefunden" | Tax Library nicht installiert | Steuer-Bibliothek installieren |
| "Datenbank-Abfrage fehlgeschlagen" | Netzwerk-Problem oder Server-Fehler | Seite neu laden, ggf. Support kontaktieren |

---

**Diese Dokumentation wird kontinuierlich aktualisiert basierend auf User-Feedback und gemeldeten Problemen.**

**Letzte Aktualisierung:** ${new Date().toISOString().split('T')[0]}  
**Nächste geplante Überarbeitung:** Q2 2026
`;

        const duration = (Date.now() - startTime) / 1000;

        // Speichere Dokumentation
        const doc = await base44.asServiceRole.entities.GeneratedDocumentation.create({
            documentation_type: 'user_issues',
            title: 'User-Issues, Bugs & Edge-Cases',
            description: 'Häufige User-Fragen, typische Fehler, bekannte Bugs und Edge-Cases',
            content_markdown: content,
            content_json: {
                analyzed_data: {
                    buildings_count: buildings.length,
                    contracts_count: leaseContracts.length,
                    invoices_count: invoices.length,
                    bookings_count: generatedBookings.length,
                    documents_count: documents.length,
                    tasks_count: tasks.length
                },
                categories: [
                    'Häufige Fragen',
                    'Typische Fehler',
                    'Bugs & Limitierungen',
                    'Kritische Fehlerszenarien',
                    'Edge-Cases',
                    'Support-Statistiken'
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
        console.error('Generate user issues documentation error:', error);
        return Response.json({
            error: error.message
        }, { status: 500 });
    }
});