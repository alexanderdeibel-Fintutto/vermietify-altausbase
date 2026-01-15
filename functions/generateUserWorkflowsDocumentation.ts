import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const markdown = `# User-Workflows

## Übersicht

Schritt-für-Schritt Dokumentation aller wichtigen Benutzer-Prozesse.

## Workflow 1: Neues Gebäude registrieren

**Benutzerrolle:** Admin, Manager
**Dauer:** 5-10 Minuten
**Häufigkeit:** Monatlich

### Schritte:

1. **Navigation**
   - Menü → Real Estate → Buildings
   - Klick auf "Neues Gebäude"

2. **Grunddaten eingeben**
   - Name (z.B. "Musterstraße 42")
   - Straße, Hausnummer
   - PLZ, Stadt
   - Bundesland

3. **Gebäudespezifikationen**
   - Baujahr
   - Gebäudetyp (Mehrfamilienhaus, etc.)
   - Anzahl Stockwerke
   - Gesamtwohnfläche

4. **Kontaktdaten**
   - Verwalter Name
   - Telefon, E-Mail
   - Energiepass-Daten (optional)

5. **Speichern**
   - Überprüfung (Validierung)
   - Speichern → Bestätigung

6. **Nächste Schritte**
   - Wohneinheiten hinzufügen
   - Gebäudedokumente uploaden
   - Verwalter/Hausmeister assignen

## Workflow 2: Mietvertrag erstellen und signieren

**Benutzerrolle:** Admin, Manager
**Dauer:** 10-15 Minuten
**Häufigkeit:** Bei jedem Mieterwechsel

### Schritte:

1. **Mieter auswählen oder erstellen**
   - Suche nach existierendem Mieter
   - Falls nicht vorhanden: Neue Mieter erstellen
   - Erforderliche Daten: Name, E-Mail, IBAN

2. **Wohneinheit auswählen**
   - Gebäude auswählen
   - Wohneinheit auswählen
   - Verfügbarkeit überprüfen

3. **Vertragsdaten eingeben**
   - Startdatum (z.B. "01.02.2024")
   - Enddatum (optional)
   - Monatliche Miete
   - Nebenkosten-Vorschuss
   - Kaution

4. **Dokument generieren**
   - System generiert Mietvertrag aus Template
   - Überprüfung durch Admin
   - Optional: Anpassungen manuell vornehmen

5. **Unterschrift einholen**
   - PDF an Mieter versenden
   - E-Signatur anfordern (falls konfiguriert)
   - Oder: Manuell ausdrucken und unterschreiben

6. **Vertrag finalisieren**
   - Signiertes Dokument hochladen
   - Status auf "ACTIVE" setzen
   - Archivierung

7. **Automatische Aktionen**
   - Mieter im Portal aktivieren
   - Erste Rechnung erstellen (nächster Monat)
   - Benachrichtigung an Hausmeister

## Workflow 3: Miete erhöhen

**Benutzerrolle:** Admin, Manager
**Dauer:** 15-20 Minuten
**Häufigkeit:** 1x pro Jahr

### Schritte:

1. **Mieter/Vertrag auswählen**
   - Dashboard → Mieter Management
   - Mieter auswählen
   - Aktiven Vertrag auswählen

2. **Erhöhung prüfen**
   - Aktuelle Miete: €1.000
   - Index: 3%
   - Neue Miete: €1.030

3. **Validierungen**
   - Letzte Erhöhung: > 12 Monate? ✓
   - Anhebungsbetrag innerhalb Limits? ✓
   - Gesetzliche Frist (3 Monate)? ✓

4. **Kündigungsschreiben generieren**
   - Template: "Mieterhöhung"
   - Auto-filled mit Daten
   - Überprüfung

5. **Versand**
   - PDF generieren
   - Via PostService versenden (optional)
   - Oder manuell ausdrucken
   - Zustellnachweis archivieren

6. **Nachverfolgung**
   - Annahme-Bestätigung einholen
   - Ablehnungen protokollieren
   - Neue Miete am Stichtag aktivieren

## Workflow 4: Zahlung verarbeiten

**Benutzerrolle:** Admin, Accountant, Tenant (für Mieter-Zahlungen)
**Dauer:** 2-5 Minuten
**Häufigkeit:** Täglich

### Schritte:

1. **Banktransaktionen synchronisieren**
   - System syncronisiert automatisch täglich
   - Oder: Manuell via "Konto synchronisieren"
   - FinAPI-Integration wird aufgerufen

2. **Transaktionen überprüfen**
   - Neue Transaktionen anzeigen
   - Automatischer Abgleich starten
   - System schlägt Zuordnungen vor

3. **Manuelle Zuordnung**
   - Falls Auto-Match fehlschlägt
   - Mieter/Rechnungspaar auswählen
   - Betrag überprüfen

4. **Zahlung verbuchen**
   - Status setzen: PAID
   - Datum: Valutadatum
   - Belegnummer: Automatisch

5. **Benachrichtigungen**
   - Zahlungsbestätigung an Mieter (optional)
   - Quittung generieren
   - Audit Log Entry

6. **Abstimmung**
   - Offene Rechnungen überprüfen
   - Mahnungen wenn nötig
   - Monatliche Zusammenfassung

## Workflow 5: Bericht generieren

**Benutzerrolle:** Admin, Manager, Accountant
**Dauer:** 5-10 Minuten
**Häufigkeit:** Monatlich/Jährlich

### Schritte:

1. **Berichtstyp auswählen**
   - Dashboard → Reports
   - Typ: z.B. "Betriebskostenabrechnung"

2. **Filter setzen**
   - Gebäude: "Alle" oder spezifisch
   - Zeitraum: z.B. "01.01.2024 - 31.01.2024"
   - Kategorien: Heizung, Wasser, etc.

3. **Generieren**
   - "Bericht erstellen" klicken
   - System berechnet und aggregiert
   - Lädt: 5-30 Sekunden

4. **Überprüfung**
   - Summen überprüfen
   - Verteilungsquoten prüfen
   - Konsistenz mit Eingaben

5. **Export/Versand**
   - Format: PDF, Excel, oder beides
   - Empfänger: an Mieter/Admin
   - Archivierung

## Workflow 6: Dokument hochladen und verwalten

**Benutzerrolle:** Admin, Manager, Tenant (einige Dokumente)
**Dauer:** 2-5 Minuten
**Häufigkeit:** Nach Bedarf

### Schritte:

1. **Navigieren zu Dokumenten**
   - Gebäude/Mieter Detail → Dokumente
   - Oder: Globale Dokumenten-Verwaltung

2. **Datei auswählen**
   - Drag-and-Drop oder Datei-Picker
   - Unterstützte Formate: PDF, JPG, PNG, DOC
   - Max. Größe: 50 MB

3. **Metadaten eingeben**
   - Dokumenttyp: z.B. "Energiepass"
   - Beschreibung
   - Tags (optional)

4. **Berechtigungen setzen**
   - Sichtbar für: Admin, Mieter, etc.
   - Download erlaubt?
   - Bewerbung erforderlich?

5. **Speichern und Archivieren**
   - Hochladen
   - OCR-Verarbeitung (optional, automatisch)
   - Archivierung mit Versionierung

6. **Notwendige Aktionen**
   - Automatische Benachrichtigungen
   - Datenschutz-Compliance überprüfen
   - Audit Log eintrag
`;

        return Response.json({ 
            markdownContent: markdown,
            status: 'success',
            generatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error in generateUserWorkflowsDocumentation:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});