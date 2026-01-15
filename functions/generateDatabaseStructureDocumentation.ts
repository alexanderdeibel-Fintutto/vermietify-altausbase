import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Wichtigste Entitäten zum Dokumentieren
        const entityNames = [
            'Building', 'Unit', 'Tenant', 'LeaseContract', 
            'Invoice', 'Payment', 'BankAccount', 'BankTransaction',
            'OperatingCost', 'Task', 'Document', 'User'
        ];

        let markdown = `# Datenbankstruktur

## Übersicht

Diese Dokumentation beschreibt die Struktur der wichtigsten Datenbanktabellen und deren Beziehungen.

## Entity-Relationship Diagram

\`\`\`
Building (1) ------- (∞) Unit
Building (1) ------- (∞) LeaseContract
Unit (1) ------- (∞) LeaseContract
Tenant (1) ------- (∞) LeaseContract
LeaseContract (1) ------- (∞) Payment
BankAccount (1) ------- (∞) BankTransaction
Invoice (1) ------- (∞) Payment
\`\`\`

## Kern-Entitäten

`;

        // Versuchen, die Schemata abzurufen
        try {
            for (const entityName of entityNames) {
                try {
                    const entity = base44.entities[entityName];
                    if (entity && typeof entity.schema === 'function') {
                        const schema = await entity.schema();
                        
                        markdown += `
### ${entityName}

**Beschreibung:** Enthält Informationen über ${entityName.toLowerCase()}

**Felder:**

| Feldname | Typ | Beschreibung |
|----------|-----|-------------|
`;
                        
                        if (schema && schema.properties) {
                            Object.entries(schema.properties).forEach(([fieldName, fieldDef]) => {
                                const type = fieldDef.type || 'string';
                                const description = fieldDef.description || '-';
                                markdown += `| ${fieldName} | ${type} | ${description} |\n`;
                            });
                        }

                        markdown += '\n';
                    }
                } catch (e) {
                    // Entity-Schema nicht verfügbar, überspringen
                }
            }
        } catch (error) {
            console.error('Error fetching schemas:', error);
        }

        markdown += `

## Eingebaute Felder

Alle Entitäten haben folgende automatisch verwaltete Felder:

| Feldname | Typ | Beschreibung |
|----------|-----|-------------|
| id | UUID | Eindeutige Kennung |
| created_date | Timestamp | Erstellungsdatum |
| updated_date | Timestamp | Letztes Änderungsdatum |
| created_by | Email | Benutzer, der den Datensatz erstellt hat |

## Beziehungen

### One-to-Many Beziehungen

- **Building → Units:** Ein Gebäude hat viele Wohneinheiten
- **Unit → LeaseContracts:** Eine Wohneinheit kann mehrere Mietverträge haben (nacheinander)
- **Tenant → LeaseContracts:** Ein Mieter kann mehrere Verträge haben
- **LeaseContract → Payments:** Ein Mietvertrag hat viele Zahlungen
- **Invoice → Payments:** Eine Rechnung kann mehrere Zahlungen erhalten
- **BankAccount → BankTransactions:** Ein Bankkonto hat viele Transaktionen

## Integritätsregeln

- **Referenzielle Integrität:** Fremdschlüssel müssen auf existierende Datensätze verweisen
- **Eindeutigkeit:** IDs sind eindeutig über alle Datensätze
- **Audit-Trail:** Alle Änderungen werden mit Timestamp und Benutzer dokumentiert
- **Soft-Deletes:** Gelöschte Datensätze werden gekennzeichnet, nicht wirklich gelöscht (wo anwendbar)

## Performance-Indizes

- Primärer Index auf \`id\` (Standard)
- Index auf \`created_date\` für Sortierungen
- Index auf \`created_by\` für Benutzerfilter
- Zusammengesetzte Indizes auf häufig gefilterte Feldkombinationen
`;

        return Response.json({ 
            markdownContent: markdown,
            status: 'success',
            generatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error in generateDatabaseStructureDocumentation:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});