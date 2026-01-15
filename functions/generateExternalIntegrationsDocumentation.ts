import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let markdown = `# Externe Integrationen

## Übersicht

Diese Dokumentation beschreibt alle API-Verbindungen und externen Services, die in die Anwendung integriert sind.

## Aktivierte Integrationen

### Slack
- **Status:** ✅ Konfiguriert
- **Authentifizierung:** OAuth 2.0
- **Berechtigungen:** 
  - \`chat:write\` - Nachrichten in Kanäle schreiben
  - \`users:read\` - Benutzerinformationen lesen
  - \`users:read.email\` - E-Mail-Adressen lesen

**Verwendung:**
- Benachrichtigungen für kritische Ereignisse
- Massenbenachrichtigungen an Makler/Admin
- Dokumenten-Sharing in Slack

**Beispiel:**
\`\`\`
POST /functions/slackNotification
{
  "channel": "#alerts",
  "message": "Neue Mietanfrage erhalten",
  "blocks": [...]
}
\`\`\`

### FinAPI (Finanzautomation)
- **Status:** ✅ Konfiguriert
- **Authentifizierung:** API Key + Secret
- **Basis-URL:** ${Deno.env.get('FINAPI_BASE_URL') || 'https://api.finapi.io'}

**Funktionen:**
- Bankkonten synchronisieren
- Transaktionen automatisch abrufen
- Kontostände aktualisieren
- Multi-Banking-Unterstützung

**Endpoints:**
- \`GET /accounts\` - Bankkonten auflisten
- \`GET /transactions\` - Transaktionen abrufen
- \`POST /accounts/connect\` - Neues Konto verbinden
- \`POST /sepaOrders\` - SEPA-Transfers initiieren

**Implementierung:**
- Automatische tägliche Synchronisation
- Fehlerbehandlung mit Benachrichtigungen
- Transaktionsabgleich mit Rechnungen

## Backend-Integration Patterns

### Asynchrone Integration
Lange laufende Operationen werden asynchron verarbeitet:
\`\`\`javascript
const result = await base44.functions.invoke('syncFinAPITransactions', {
  accountId: '12345'
});
\`\`\`

### Webhooks
Externe Services können Webhooks auslösen:
- Slack-Benachrichtigungen bei Ereignissen
- FinAPI-Transaktions-Updates
- Stripe-Zahlungs-Callbacks

### Fehlerbehandlung
- Retry-Logik für fehlgeschlagene Anfragen (max 3x)
- Fallback zu manuellen Prozessen
- Detaillierte Error-Logs für Debugging

## Datentransformation

### Slack → Intern
\`\`\`
Slack Message → Function Parameter → Entity Creation
\`\`\`

### FinAPI → Intern
\`\`\`
Bank Transaction → Normalisierung → BankTransaction Entity → Abgleich
\`\`\`

## Rate Limiting & Quotas

| Service | Limit | Fenster |
|---------|-------|---------|
| Slack | 30 requests | 1 Minute |
| FinAPI | 100 requests | 1 Stunde |

## Security

- **API Keys:** In Umgebungsvariablen gespeichert
- **OAuth Tokens:** Verschlüsselt in der Datenbank
- **Request Validation:** Alle externen Requests werden validiert
- **Data Sanitization:** Eingaben werden bereinigt und validiert

## Zukünftige Integrationen

### Geplant:
- **Google Calendar:** Termin-Integration
- **Microsoft Teams:** Alternative zu Slack
- **Stripe:** Zahlungsverarbeitung
- **Document Signing:** E-Signatur-Service

### In Evaluierung:
- **Elster:** Deutsche Steuererklärungen
- **Notion:** Dokumenten-Verwaltung
`;

        return Response.json({ 
            markdownContent: markdown,
            status: 'success',
            generatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error in generateExternalIntegrationsDocumentation:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});