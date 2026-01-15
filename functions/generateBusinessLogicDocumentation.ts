import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const markdown = `# Geschäftslogik & Validierungen

## Übersicht

Diese Dokumentation beschreibt die Kerngeschäftsregeln, Validierungen, Berechnungen und Automatismen der Anwendung.

## Geschäftsregeln

### 1. Mietverträge

#### Erstellung
- Ein Mietvertrag benötigt: Mieter, Wohneinheit, Startdatum, Miete
- Start- und Enddatum müssen logisch aufeinander folgen
- Miete muss > 0 sein
- Keine überlappenden Verträge für dieselbe Einheit (mit Ausnahme von Co-Mietern)

#### Änderung
- Mieterhöhung muss gesetzliche Fristen beachten (z.B. 3 Monate Ankündigung)
- Historische Verträge können nicht rückwirkend geändert werden
- Kündigungsfristen müssen eingehalten werden

#### Beendigung
- Beim Vertragsende wird ein Enddatum gesetzt
- Automatische Erinnerungen 30 Tage vor Ablauf
- Kaution muss ordnungsgemäß freigegeben werden

### 2. Zahlungen

#### Abgleich
- Transaktionen werden automatisch gegen Rechnungen und Verträge abgeglichen
- Mehrfachzahlungen werden erkannt
- Teilzahlungen werden nachverfolgt

#### Validierung
- Betrag muss > 0 sein
- IBAN/BIC müssen gültig sein (IBAN-Check)
- Valutadatum muss in der Zukunft liegen (für geplante Zahlungen)

#### Verarbeitung
- Zahlungen werden als "ausstehend" bis "verarbeitet" bis "abgeschlossen" durchlaufen
- Verspätete Zahlungen triggern automatische Erinnerungen

### 3. Betriebskosten-Abrechnung

#### Berechnung
- Monatliche Betriebskosten werden anteilig auf Mieter umgelegt
- Berechnung: (Gesamtkosten / Gesamtfläche) × Einheitsfläche
- Heizkostenabrechnung nach HeizkostenV

#### Periode
- Abrechnung typischerweise 1x pro Jahr
- Vorschüsse werden monatlich erhoben
- Nachzahlungen/Rückerstattungen am Jahresende

#### Validierung
- Alle Eingaben müssen dokumentiert sein
- Belegpflicht für alle Kosten
- Nachschau muss Verträge überprüfen

### 4. Dokumente

#### Generierung
- Mietverträge werden aus Templates generiert
- Automatische Feldausfüllung mit Vertragsdaten
- Audit-Trail aller generierten Versionen

#### Signatur
- Signatur erforderlich für: Mietverträge, Übernahmeprotokolle
- E-Signatur (wenn konfiguriert) oder manuelle Signatur
- Signierte Dokumente können nicht mehr bearbeitet werden

### 5. Berechtigungen

#### Mieter
- Können eigene Verträge und Rechnungen einsehen
- Dürfen keine anderen Mieter/Objekte sehen
- Können Zahlungen nur für eigene Verträge tätigen

#### Admin
- Vollständiger Zugriff auf alle Daten
- Können Berichte generieren und exportieren
- Können Benutzer verwalten

## Validierungen

### Feldvalidierungen

| Feld | Regel | Fehlermeldung |
|------|-------|---------------|
| IBAN | Muss 15-34 Zeichen lang sein | "Ungültige IBAN-Länge" |
| Email | Muss @-Zeichen enthalten | "Ungültige E-Mail-Adresse" |
| Datumsbereich | Start < Ende | "Enddatum muss nach Startdatum liegen" |
| Betrag | Muss > 0 sein | "Betrag muss größer als 0 sein" |
| Telefon | Optional, muss aber Format erfüllen | "Ungültiges Telefonformat" |

### Geschäftslogik-Validierungen

**Mietvertrag-Erstellung:**
\`\`\`
1. Mieter muss existieren
2. Wohneinheit muss leer oder endet Vormieter-Vertrag
3. Startdatum muss in der Zukunft oder heute sein
4. Enddatum (falls gesetzt) > Startdatum
5. Keine Konflikte mit bestehenden Verträgen
\`\`\`

**Zahlung-Verarbeitung:**
\`\`\`
1. Betrag > 0
2. Konto muss existieren
3. Nur zukünftige Transaktionen können geplant werden
4. Keine Duplikat-Zahlungen (Überprüfung über Betrag + Datum + Quelle)
\`\`\`

## Berechnungen

### Mieterhöhung
\`\`\`
neue_miete = alte_miete × (1 + erhöhungsprozentsatz)
\`\`\`

### Betriebskostenanteil
\`\`\`
anteil = (fläche_der_einheit / gesamtfläche_gebäude) × gesamtkosten
\`\`\`

### Zinsberechnung (falls zutreffend)
\`\`\`
zinsen = kapital × zinssatz × tage / 360
\`\`\`

## Automatismen

### Täglich
- Überfällige Zahlungen überprüfen
- Erinnerungsschreiben generieren (30 Tage vor Fälligkeitsdatum)
- Transaktionen mit Bankkonten synchronisieren

### Wöchentlich
- Betriebskosten-Prognose aktualisieren
- Datenqualität überprüfen
- Reports generieren

### Monatlich
- Automatische Rechnungen für Mietverträge erstellen
- Betriebskostenvorauszahlungen berechnen
- Zahlungsziele überprüfen

### Jährlich
- Betriebskostenabrechnung durchführen
- Mietverträge auf Kündigungen überprüfen
- Archivierung alter Daten

## Edge Cases

### Szenario 1: Mieter wechselt innerhalb eines Monats
- Alte Rechnung wird proratiert
- Neue Rechnung wird ab Übergabedatum erstellt
- Betriebskostenanteil wird angepasst

### Szenario 2: Mietvertrag ohne Enddatum
- Wird als unbefristeter Vertrag behandelt
- Kündigungsfristen gelten
- Wird manuell beendet

### Szenario 3: Mehrfachzahlung erkannt
- System markiert als "duplicate"
- Benachrichtigung an Admin
- Kann manuell als Rückzahlung verarbeitet werden

## Error Handling

Alle Operationen verwenden Try-Catch mit sprechenden Fehlermeldungen:
- Validierungsfehler: 400 Bad Request
- Nicht autorisiert: 403 Forbidden
- Nicht gefunden: 404 Not Found
- Server-Fehler: 500 Internal Server Error
`;

        return Response.json({ 
            markdownContent: markdown,
            status: 'success',
            generatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error in generateBusinessLogicDocumentation:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});