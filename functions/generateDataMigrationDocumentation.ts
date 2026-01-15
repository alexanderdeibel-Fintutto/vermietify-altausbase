import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const markdown = `# Daten-Migration & Historisierung

## Übersicht

Strategien für Datenmigration, Versionierung und historische Daten.

## Versionierung

### Entity Versioning Pattern

Alle kritischen Entitäten werden mit Versionshistorie verwaltet:

\`\`\`
LeaseContract (v1)
  ├─ created_date: 2024-01-01
  ├─ version: 1
  └─ data: { rent: 1000, deposit: 3000 }

LeaseContract (v2) - Mieterhöhung
  ├─ modified_date: 2024-07-01
  ├─ version: 2
  ├─ previous_version_id: v1
  └─ data: { rent: 1030, deposit: 3000 }
\`\`\`

### Change Tracking

\`\`\`javascript
{
  "entity_id": "contract_123",
  "version": 2,
  "changed_fields": ["rent_amount"],
  "previous_values": { "rent_amount": 1000 },
  "new_values": { "rent_amount": 1030 },
  "changed_by": "user_456",
  "changed_at": "2024-07-01T09:00:00Z",
  "change_reason": "Indexmiete 2024"
}
\`\`\`

## Archivierung

### Soft Delete Strategy

Gelöschte Daten werden nicht wirklich gelöscht, sondern markiert:

\`\`\`javascript
{
  "id": "lease_789",
  "status": "DELETED",
  "deleted_date": "2024-12-31T23:59:59Z",
  "deleted_by": "user_456",
  "deletion_reason": "Mietvertrag beendet",
  "restoration_available_until": "2025-01-31T23:59:59Z"
}
\`\`\`

### Archivierungs-Policies

| Entitätstyp | Aufbewahrung | Action |
|---|---|---|
| LeaseContract (beendet) | 7 Jahre | Archive nach 1 Jahr |
| Invoice (bezahlt) | 10 Jahre | Archive nach 1 Jahr |
| Payment | 10 Jahre | Archive nach 2 Jahren |
| Document | Unbegrenzt | Archive nach 5 Jahren |
| AuditLog | 3 Jahre | Delete nach Aufbewahrung |

## Data Migration

### Migration 1: Legacy System → Base44

**Szenario:** Import von Mietverwaltungsdaten aus altem System

**Prozess:**

1. **Export aus Legacy System**
   - CSV Export mit allen Gebäuden
   - CSV Export mit allen Mietern
   - CSV Export mit allen Mietverträgen
   - CSV Export mit Zahlungshistorie

2. **Validation & Cleansing**
   \`\`\`javascript
   - Duplikat-Überprüfung
   - Feldformat-Normalisierung
   - Fehlende Pflichtfelder identifizieren
   - Datentyp-Konvertierung
   - Konsistenz-Überprüfung (z.B. Vertragsdaten)
   \`\`\`

3. **Mapping**
   \`\`\`
   Legacy.Gebäude.nr → Base44.Building.building_number
   Legacy.Gebäude.strasse → Base44.Building.street_address
   Legacy.Mieter.nachname → Base44.Tenant.last_name
   Legacy.Mieter.vorname → Base44.Tenant.first_name
   Legacy.Vertrag.mietstart → Base44.LeaseContract.start_date
   \`\`\`

4. **Batch Import**
   \`\`\`javascript
   await base44.entities.Building.bulkCreate(buildingsData)
   await base44.entities.Tenant.bulkCreate(tenantsData)
   await base44.entities.LeaseContract.bulkCreate(contractsData)
   \`\`\`

5. **Verifikation**
   - Zählung überprüfen (Quell vs. Ziel)
   - Stichproben-Validierung
   - Duplikat-Check
   - Referenzielle Integrität überprüfen

6. **Rollback-Plan**
   - Backup vor Migration
   - Test-Umgebung für Dry-Run
   - Rollback-Prozedur dokumentiert

### Migration 2: Field Renaming

**Beispiel:** Umbenennung von \`monthly_rent\` zu \`rent_amount\`

\`\`\`javascript
// Phase 1: Dual-Writing (1 Woche)
// Schreibe zu beiden Feldern
data.rent_amount = data.monthly_rent

// Phase 2: Migration
// Kopiere Daten für alle historischen Records
await db.query(\`
  UPDATE LeaseContract 
  SET rent_amount = monthly_rent 
  WHERE rent_amount IS NULL
\`)

// Phase 3: Cleanup
// Lösche altes Feld nach Verifikation
ALTER TABLE LeaseContract DROP COLUMN monthly_rent
\`\`\`

### Migration 3: Schema Evolution

**Beispiel:** Hinzufügen eines neuen Feldes \`property_tax\` zu Building

\`\`\`javascript
// 1. Schema Change
ALTER TABLE Building ADD COLUMN property_tax DECIMAL(10,2) DEFAULT 0

// 2. Data Population
UPDATE Building SET property_tax = 0 // Standardwert

// 3. Backfill mit Daten (falls notwendig)
UPDATE Building 
SET property_tax = calculate_property_tax(location, building_value)

// 4. Optional: Constraint hinzufügen
ALTER TABLE Building 
ADD CONSTRAINT check_property_tax CHECK (property_tax >= 0)
\`\`\`

## Point-in-Time Recovery

### Backup Strategy

\`\`\`
Täglich:  Full backup (23:00 Uhr)
Stündlich: Incremental backup
Real-time: Transaction log replication
\`\`\`

### Recovery Procedure

\`\`\`
1. Fehler erkannt
2. Recovery Point in Time auswählen (z.B. vor 2 Stunden)
3. Backup auswählen
4. Recovery starten
5. Daten-Validierung
6. Produktiv-Freigabe
\`\`\`

## Audit Trail

Alle Änderungen werden vollständig dokumentiert:

\`\`\`javascript
{
  "id": "audit_001",
  "timestamp": "2024-01-15T10:30:00Z",
  "user_id": "user_456",
  "user_email": "admin@example.com",
  "entity_type": "LeaseContract",
  "entity_id": "contract_123",
  "action": "UPDATE",
  "old_values": { "rent_amount": 1000 },
  "new_values": { "rent_amount": 1030 },
  "change_reason": "Indexmiete 2024",
  "ip_address": "192.168.1.1",
  "request_id": "req_abc123xyz"
}
\`\`\`

### Audit Log Retention

\`\`\`
Speichern: 3 Jahre
Archivieren: Nach 6 Monaten
Löschen: Nach 3 Jahren
GxP-Compliance: 7 Jahre (für regulierte Industrien)
\`\`\`

## Historische Datenabfragen

### Beispiel: Miethistorie eines Mieters

\`\`\`javascript
const history = await AuditLog.filter({
  entity_type: 'LeaseContract',
  'data.tenant_id': 'tenant_789'
}).sort({ timestamp: -1 })

// Ausgabe:
[
  { action: 'DELETE', timestamp: '2024-12-31', rent: 1030 },
  { action: 'UPDATE', timestamp: '2024-07-01', rent: 1030 },
  { action: 'CREATE', timestamp: '2024-01-01', rent: 1000 }
]
\`\`\`

### Beispiel: Zahlungshistorie

\`\`\`javascript
const payments = await Payment.filter({
  'data.tenant_id': 'tenant_789'
}).sort({ payment_date: -1 }).limit(24) // Letzte 24 Monate

// Ausgabe:
[
  { payment_date: '2024-12-31', amount: 1030, status: 'PAID' },
  { payment_date: '2024-11-30', amount: 1030, status: 'PAID' },
  ...
]
\`\`\`

## Data Quality Monitoring

Regelmaßige Überprüfungen:

\`\`\`
- Wöchentlich: Duplikat-Überprüfung
- Monatlich: Referenzielle Integrität
- Monatlich: Datentyp-Validierung
- Jährlich: Archivierungs-Überprüfung
\`\`\`
`;

        return Response.json({ 
            markdownContent: markdown,
            status: 'success',
            generatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error in generateDataMigrationDocumentation:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});