import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const markdown = `# Master Data & Konstanten

## Übersicht

Alle Auswahloptionen, Kategorien und festen Werte des Systems.

## Enumerationen

### Vertragstypen
\`\`\`
- RESIDENTIAL: Wohnungsvermietung
- COMMERCIAL: Gewerbevermietung
- PARKING: Parkplatz
- STORAGE: Lagerraum
\`\`\`

### Vertrags-Status
\`\`\`
- DRAFT: Entwurf
- ACTIVE: Aktiv
- SUSPENDED: Ausgesetzt
- TERMINATED: Beendet
- EXPIRED: Abgelaufen
\`\`\`

### Zahlungsstatus
\`\`\`
- PENDING: Ausstehend
- OVERDUE: Überfällig
- PAID: Bezahlt
- PARTIALLY_PAID: Teilweise bezahlt
- CANCELLED: Storniert
\`\`\`

### Dokumenttypen
\`\`\`
- LEASE_CONTRACT: Mietvertrag
- INVOICE: Rechnung
- PAYMENT_RECEIPT: Zahlungsbestätigung
- HANDOVER_PROTOCOL: Übergabeprotokoll
- TERMINATION_NOTICE: Kündigungsschreiben
- OPERATING_COST_STATEMENT: Betriebskostenabrechnung
\`\`\`

### Benutzerrollen
\`\`\`
- ADMIN: Vollständiger Zugriff
- MANAGER: Verwaltete Gebäude
- ACCOUNTANT: Finanzielle Operationen
- TENANT: Mieter (eingeschränkter Zugriff)
\`\`\`

### Gebäudetypen
\`\`\`
- RESIDENTIAL: Mehrfamilienhaus
- SINGLE_FAMILY: Einfamilienhaus
- COMMERCIAL: Gewerbegebäude
- MIXED: Gemischte Nutzung
\`\`\`

## Konstanten

### Gesetzliche Fristen (Deutschland)

\`\`\`javascript
MIETERHÖHUNG_ANKÜNDIGUNGSFRIST: 3 Monate
MIETERHÖHUNG_MAX_PROZENTSATZ: 20% // innerhalb 3 Jahre
KÜNDIGUNG_FRIST_MIETER: 3 Monate zum 15. oder Monatsende
KÜNDIGUNG_FRIST_VERMIETER: 3 Monate zum 15. oder Monatsende
KAUTION_FRIST_RÜCKZAHLUNG: 30 Tage nach Übergabe
\`\`\`

### Betriebskostenkategorien

\`\`\`
- HEATING: Heizung
- WATER: Wasser/Abwasser
- GARBAGE: Müllabfuhr
- CLEANING: Reinigung
- MAINTENANCE: Instandhaltung
- INSURANCE: Versicherung
- GARDEN: Gartenpflege
- ELEVATOR: Aufzug
\`\`\`

### Zahlungsweisen

\`\`\`
- BANK_TRANSFER: Banküberweisung
- SEPA_DEBIT: SEPA-Lastschrift
- CASH: Bar
- CHEQUE: Scheck
- CREDIT_CARD: Kreditkarte
\`\`\`

## Länder-Konfigurationen

### Deutschland (DE)
- Währung: EUR
- Mehrwertsteuersatz: 19%
- Betriebskostenabrechnung: §556 BGB
- Kaution: 3 Monatsmieten max.

### Österreich (AT)
- Währung: EUR
- Mehrwertsteuersatz: 20%
- Betriebskostenabrechnung: MRG
- Kaution: 2 Monatsmieten max.

### Schweiz (CH)
- Währung: CHF
- Mehrwertsteuersatz: 7.7%
- Betriebskostenabrechnung: OR Art. 253
- Kaution: 1-2 Monatsmieten max.

## Feldlängen-Limits

\`\`\`
IBAN: 15-34 Zeichen
BIC: 8-11 Zeichen
Name: 2-100 Zeichen
Email: 5-255 Zeichen
Telefon: 7-20 Zeichen
Adresse: 10-200 Zeichen
\`\`\`

## Fehler-Codes

\`\`\`
E001: Ungültige Eingabe
E002: Authentifizierung erforderlich
E003: Ressource nicht gefunden
E004: Berechtigung verweigert
E005: Geschäftslogik-Verletzung
E006: Datenbankfehler
E007: Externer Service nicht erreichbar
\`\`\`
`;

        return Response.json({ 
            markdownContent: markdown,
            status: 'success',
            generatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error in generateMasterDataDocumentation:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});