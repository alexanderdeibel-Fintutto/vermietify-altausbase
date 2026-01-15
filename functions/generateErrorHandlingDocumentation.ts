import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const markdown = `# Fehlerbehandlung & Logging

## Übersicht

Fehlerbehandlung, Logging und Monitoring-Strategien.

## HTTP Status Codes

| Code | Bedeutung | Beispiele |
|------|-----------|----------|
| 200 | OK | Erfolgreiche Anfrage |
| 201 | Created | Ressource erstellt |
| 204 | No Content | Erfolg ohne Inhalt |
| 400 | Bad Request | Ungültige Eingabedaten |
| 401 | Unauthorized | Authentifizierung erforderlich |
| 403 | Forbidden | Keine Berechtigung |
| 404 | Not Found | Ressource existiert nicht |
| 409 | Conflict | Datenbankkonflikt (z.B. Duplikat) |
| 500 | Server Error | Interner Fehler |
| 503 | Service Unavailable | Service temporär nicht erreichbar |

## Fehlertypen

### Validierungsfehler (400)

\`\`\`json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validierung fehlgeschlagen",
    "details": [
      {
        "field": "email",
        "message": "E-Mail ist ungültig"
      },
      {
        "field": "rent_amount",
        "message": "Betrag muss > 0 sein"
      }
    ]
  }
}
\`\`\`

### Authentifizierungsfehler (401)

\`\`\`json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentifizierung erforderlich",
    "hint": "Bitte melden Sie sich an"
  }
}
\`\`\`

### Berechtigungsfehler (403)

\`\`\`json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Sie haben keine Berechtigung für diese Aktion",
    "action": "DELETE_BUILDING"
  }
}
\`\`\`

### Nicht gefunden (404)

\`\`\`json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Gebäude mit ID '123' existiert nicht",
    "resource_type": "Building",
    "resource_id": "123"
  }
}
\`\`\`

### Geschäftslogik-Fehler (409)

\`\`\`json
{
  "error": {
    "code": "BUSINESS_RULE_VIOLATION",
    "message": "Wohneinheit ist bereits vermietet",
    "reason": "Existierender Mietvertrag bis 2024-12-31"
  }
}
\`\`\`

### Server-Fehler (500)

\`\`\`json
{
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "Ein interner Fehler ist aufgetreten",
    "request_id": "req_abc123xyz",
    "support": "support@example.com"
  }
}
\`\`\`

## Logging-Strategie

### Log-Level

**DEBUG**
- Detaillierte Informationen für Entwicklung
- Alle Funktionsaufrufe und Parameter
- Nicht in Produktion

**INFO**
- Wichtige Geschäftsereignisse
- Benutzeraktionen
- Externe API-Calls

**WARN**
- Potenzielle Probleme
- Deprecated APIs
- Performance-Warnung

**ERROR**
- Fehlgeschlagene Operationen
- Unerwartete Exceptions
- Fehler bei externen Services

**CRITICAL**
- Systemfehler
- Datenverlust-Risiken
- Sicherheitsverletzungen

### Log-Format

\`\`\`
[TIMESTAMP] [LEVEL] [MODULE] [REQUEST_ID] MESSAGE
{
  "timestamp": "2024-01-15T08:30:45.123Z",
  "level": "INFO",
  "module": "LeaseContractService",
  "request_id": "req_abc123xyz",
  "message": "Mietvertrag erstellt",
  "data": {
    "contract_id": "contract_456",
    "tenant_id": "tenant_789",
    "building_id": "building_012"
  },
  "duration_ms": 245,
  "user_id": "user_345"
}
\`\`\`

### Beispiel-Log-Einträge

**Erfolgreicher Mietvertrag:**
\`\`\`
[2024-01-15T08:30:45.123Z] [INFO] [LeaseContractService] [req_abc123] 
Mietvertrag erstellt: contract_456, Mieter: tenant_789
\`\`\`

**Zahlungs-Abgleich-Fehler:**
\`\`\`
[2024-01-15T09:15:20.456Z] [WARN] [PaymentMatcher] [req_def456]
Zahlungsabgleich fehlgeschlagen: Mehrfach-Zahlungen erkannt
Transaktion: trans_001 €1000, Invoice: inv_001 €950
\`\`\`

**FinAPI-Integration-Fehler:**
\`\`\`
[2024-01-15T10:45:30.789Z] [ERROR] [FinAPISync] [req_ghi789]
FinAPI Fehler: Connection Timeout nach 30s
Retry geplant für: 2024-01-15T10:50:00Z
Versuch: 2/3
\`\`\`

## Fehlerbehandlung im Code

### Try-Catch Pattern

\`\`\`javascript
try {
  const contract = await createLeaseContract(data)
  logger.info('Mietvertrag erstellt', { contract_id: contract.id })
  return { success: true, data: contract }
} catch (error) {
  if (error instanceof ValidationError) {
    logger.warn('Validierungsfehler', { details: error.details })
    return Response.json({ error: error.details }, { status: 400 })
  }
  
  if (error instanceof BusinessRuleError) {
    logger.warn('Geschäftslogik-Verletzung', { reason: error.reason })
    return Response.json({ error: error.message }, { status: 409 })
  }
  
  logger.error('Unerwarteter Fehler', { error: error.message })
  return Response.json({ error: 'Internal Server Error' }, { status: 500 })
}
\`\`\`

## Monitoring & Alerting

### Metriken zum Überwachen

- **Response Time:** p50, p95, p99
- **Error Rate:** Prozentsatz fehlgeschlagener Anfragen
- **External Service Health:** FinAPI, Slack Verfügbarkeit
- **Database Performance:** Query-Zeiten, Connection-Pool
- **Authentication Failures:** Fehlgeschlagene Logins

### Alert-Schwellenwerte

| Metrik | Schwellenwert | Aktion |
|--------|---------------|--------|
| Error Rate | > 1% | Notification |
| Error Rate | > 5% | Page/SMS |
| Response Time (p95) | > 5s | Warning |
| Service Unavailable | Jegliche | Critical |
| Database Connections | > 80% | Warning |

## Incident Response

### Schweregrad 1 (Kritisch)
- System-Ausfall
- Datenverlust
- Sicherheitsverletzung
- Aktion: Sofortige Benachrichtigung, Incident Commander

### Schweregrad 2 (Hoch)
- Mehrere Benutzer betroffen
- Funktionalität reduziert
- Aktion: Benachrichtigung, schnelle Behebung

### Schweregrad 3 (Mittel)
- Einzelne Benutzer betroffen
- Workaround verfügbar
- Aktion: Benachrichtigung, Planung

### Schweregrad 4 (Niedrig)
- Kosmetische Fehler
- Minimale Auswirkung
- Aktion: Logging und zukünftige Behebung
`;

        return Response.json({ 
            markdownContent: markdown,
            status: 'success',
            generatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error in generateErrorHandlingDocumentation:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});