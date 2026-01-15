import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const markdown = `# Performance-Metriken & Limits

## Typische Datenmengen

| Metrik | Größe | Einheit |
|--------|-------|--------|
| Durchschnittliche Gebäude pro Benutzer | 5-50 | Objekte |
| Durchschnittliche Mieter pro Gebäude | 20-100 | Personen |
| Durchschnittliche Mietverträge pro Gebäude | 25-120 | Verträge |
| Durchschnittliche Rechnungen pro Jahr | 300-1200 | Dokumente |
| Durchschnittliche Zahlungen pro Jahr | 500-2000 | Transaktionen |
| Durchschnittliche Betriebskosten pro Jahr | 100-500 | Einträge |

## System-Limits

### Datenbankgrenzen

| Item | Limit | Notizen |
|------|-------|---------|
| Max. Gebäude pro Account | Unbegrenzt | Empfehlung: < 10.000 |
| Max. Mieter pro Account | Unbegrenzt | Performance kritisch ab > 50.000 |
| Max. Mietverträge | Unbegrenzt | Archivierung bei > 100.000 |
| Max. Dokumente | Unbegrenzt | Speicher-Limits beachten |
| Max. Transaktionen | Unbegrenzt | Query-Performance ab > 1.000.000 |
| Dateigröße pro Dokument | 50 MB | Für PDFs, Bilder, etc. |
| String-Feldlänge | 10.000 Zeichen | Für Beschreibungen |

### API-Limits

| Parameter | Limit | Konsequenz |
|-----------|-------|-----------|
| Max. Results per Query | 1.000 | Pagination erforderlich |
| Response Timeout | 30 Sekunden | Query wird abgebrochen |
| Batch Create | 1.000 Items | Große Batches aufteilen |
| Concurrent Requests | 10 pro Benutzer | Rate-Limiting |
| API Rate Limit | 1.000 req/min | Nach Überschreitung: 429 |

## Performance-kritische Operationen

### Langsame Queries

| Operation | Typische Dauer | Empfehlung |
|-----------|---|---|
| Alle Gebäude laden | 100-500 ms | Mit Pagination |
| Alle Mieter laden | 500-2000 ms | Mit Filter/Pagination |
| Jahresbericht generieren | 5-30 Sekunden | Asynchron verarbeiten |
| Betriebskostenabrechnung | 10-60 Sekunden | Async mit Progress |
| Banktransaktionen abgleichen | 5-20 Sekunden | Batch-Verarbeitung |

### Index-Empfehlungen

\`\`\`sql
-- Primary Indexes (automatisch)
INDEX building.id
INDEX tenant.id
INDEX leaseContract.id

-- Performance Indexes
INDEX building.created_date
INDEX tenant.email
INDEX leaseContract.status
INDEX leaseContract.unit_id
INDEX invoice.invoice_date
INDEX payment.payment_date
INDEX payment.status
INDEX tenant.building_id
\`\`\`

## Skalierungsstrategien

### Datenbank-Optimierung

**Partitionierung:**
- Nach Gebäude (für Multi-Tenant)
- Nach Datum (für historische Daten)
- Nach Status (für aktive vs. archivierte)

**Archivierung:**
- Transaktionen > 3 Jahre: Archive
- Abrechnung > 7 Jahre: Archive
- Dokumente > 10 Jahre: Optional Archive

### Caching-Strategie

| Item | TTL | Strategy |
|------|-----|----------|
| Gebäudedaten | 5 min | Cache invalidation on update |
| Mieterdaten | 10 min | User-scoped cache |
| Verträge | 15 min | Update triggered invalidation |
| Rechnungen | 24 h | Immutable nach completion |

### Pagination

**Standard Page Size:**
- Gebäude: 50 items
- Mieter: 20 items
- Verträge: 20 items
- Transaktionen: 50 items

**Lazy Loading:**
- Dokumente: 10 items initial, +10 on scroll
- Audit Logs: 25 items, +25 on scroll

## Monitoring-Metriken

### Response Times

**Zielwerte:**
- Seiten-Load: < 2 Sekunden
- API-Calls: < 500 ms (p95)
- Report-Generierung: < 30 Sekunden
- Search: < 1 Sekunde

**Alerts:**
- p95 Response Time > 1 Sekunde: Warning
- p99 Response Time > 3 Sekunden: Alert
- Any Timeout: Critical

### Error Rates

**Zielwerte:**
- Overall Error Rate: < 0.1%
- 5xx Server Errors: < 0.01%
- Database Errors: < 0.05%
- External API Errors: < 1% (FinAPI, Slack, etc.)

### Resource Utilization

| Resource | Warning | Critical |
|----------|---------|----------|
| CPU | > 70% | > 90% |
| Memory | > 80% | > 95% |
| Disk | > 85% | > 95% |
| Database Connections | > 80% | > 95% |
| API Rate Limit | > 80% | > 95% |

## Optimierungstipps

### Frontend

1. **Code Splitting:** Lazy-load Seiten mit React.lazy()
2. **Image Optimization:** WebP Format, Compression
3. **Bundle Size:** < 500 KB initial, < 1 MB total
4. **Query Caching:** React Query mit staleTime

### Backend

1. **Query Optimization:** Nur benötigte Felder selektieren
2. **Batch Operations:** Bulk create/update/delete
3. **Asynchronous Processing:** Lange Operationen async
4. **Connection Pooling:** DB-Verbindungen reuse
5. **API Rate Limiting:** Protect gegen Abuse

### Database

1. **Index Strategy:** Regelmäßige Index-Analyse
2. **Vacuum/Analyze:** Regelmäßig durchführen
3. **Partitioning:** Bei Tabellen > 10 GB
4. **Query Planning:** EXPLAIN ANALYZE nutzen

## Load Testing

### Test-Szenarien

**Szenario 1: Normal Load**
- 100 gleichzeitige Benutzer
- 5 Anfragen pro Benutzer
- Ziel: p95 < 500 ms

**Szenario 2: Peak Load**
- 500 gleichzeitige Benutzer
- 10 Anfragen pro Benutzer
- Ziel: p95 < 1 Sekunde

**Szenario 3: Stress Test**
- 1000+ gleichzeitige Benutzer
- bis zum Fehler
- Ziel: Graceful degradation

### Monitoring nach Deployment

- 24h kontinuierliches Monitoring
- Automatische Alerting bei Anomalien
- Tägliche Performance Reports
`;

        return Response.json({ 
            markdownContent: markdown,
            status: 'success',
            generatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error in generatePerformanceDataDocumentation:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});