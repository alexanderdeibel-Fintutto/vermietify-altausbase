import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const markdown = `# Modul-Architektur

## Systemübersicht

\`\`\`
┌─────────────────────────────────────┐
│         Frontend (React)              │
│  Pages, Components, Layout            │
└──────────────┬──────────────────────┘
               │ HTTP/REST
┌──────────────▼──────────────────────┐
│      Backend (Deno/Base44)           │
│  Functions, Entities, Integrations   │
└──────────────┬──────────────────────┘
               │
   ┌───────────┼───────────┐
   │           │           │
   ▼           ▼           ▼
Database    External     Cache
(Entities)  Services
\`\`\`

## Kern-Module

### 1. Real Estate Management
**Komponenten:**
- Buildings (Gebäude)
- Units (Wohneinheiten)
- Properties (Grundstücke)
- Inspections (Inspektionen)

**Entitäten:**
- Building, Unit, Property, BuildingInspection

**Abhängigkeiten:**
- → Tenant Management (für Mietverträge)
- → Finance (für Betriebskosten)

### 2. Tenant Management
**Komponenten:**
- Tenants (Mieter)
- LeaseContracts (Mietverträge)
- Communications (Kommunikation)
- Portal (Mieter-Portal)

**Entitäten:**
- Tenant, LeaseContract, TenantCommunication, CoTenant

**Abhängigkeiten:**
- ← Real Estate Management
- → Finance (Zahlungen)
- → Documents (Verträge)

### 3. Finance
**Komponenten:**
- Invoices (Rechnungen)
- Payments (Zahlungen)
- BankAccounts (Bankkonten)
- OperatingCosts (Betriebskosten)
- Budget (Budgetierung)

**Entitäten:**
- Invoice, Payment, BankAccount, OperatingCost, Budget

**Abhängigkeiten:**
- ← Tenant Management
- ← Real Estate Management
- → Banking Integration (FinAPI)

### 4. Document Management
**Komponenten:**
- DocumentGeneration (Dokumentgenerierung)
- DocumentStorage (Speicherung)
- DocumentPermissions (Berechtigungen)
- eSignature (E-Signatur)

**Entitäten:**
- Document, DocumentTemplate, DocumentTask

**Abhängigkeiten:**
- ← Real Estate, Tenant, Finance
- → External Services

### 5. Tasks & Workflows
**Komponenten:**
- Tasks (Aufgaben)
- Workflows (Arbeitsabläufe)
- Automations (Automatisierungen)
- Notifications (Benachrichtigungen)

**Entitäten:**
- Task, Workflow, Automation, Notification

**Abhängigkeiten:**
- ← All other modules
- → Communication Services (Email, Slack)

### 6. Administration
**Komponenten:**
- UserManagement (Benutzerverwaltung)
- RolePermissions (Rollen & Berechtigungen)
- AuditLog (Audit-Protokoll)
- Settings (Einstellungen)

**Entitäten:**
- User, Role, Permission, AuditLog

**Abhängigkeiten:**
- → All other modules (für Zugriffskontrolle)

## Datenflüsse

### Szenario 1: Neue Miete erstellen
\`\`\`
User Input (Page)
  ↓
API Call (base44.functions.invoke)
  ↓
Backend Function (validateAndCreateLease)
  ├─ Validate Input
  ├─ Create LeaseContract Entity
  ├─ Generate Document (if enabled)
  └─ Trigger Notification
      ↓
      Database Update
      ↓
      Frontend Refresh (via useQuery)
\`\`\`

### Szenario 2: Zahlungabgleich
\`\`\`
BankAccount Sync (daily)
  ↓
FinAPI Integration
  ├─ Fetch transactions
  └─ Create BankTransaction entities
      ↓
      Auto-Matching Algorithm
      ├─ Match with Invoices
      ├─ Match with Payments
      └─ Create Payment records
          ↓
          Notification (if overpayment)
\`\`\`

## Kommunikationsmuster

### Synchrone Calls
- CRUD-Operationen auf Entitäten
- Datenabfragen
- Validierungen

### Asynchrone Calls
- Dokumentgenerierung
- E-Mail-Versand
- Externe API-Calls (FinAPI)
- PDF-Generierung

### Echtzeit-Updates
- Webhooks (externe Services)
- WebSockets (zukünftig für Live-Daten)
- Query-Invalidation (React Query)

## Integrationen

### Interne
- Base44 SDK (Entities, Auth, Functions)
- React Query (Datenverwaltung)

### Externe
- **FinAPI:** Banking-Integration
- **Slack:** Benachrichtigungen
- **Document Services:** PDF-Generierung

## Skalierungsüberlegungen

### Caching
- Entity-Daten werden mit React Query gecacht
- TTL: 5 Minuten (konfigurierbar)

### Pagination
- Große Datenlisten werden pagiert
- Standard: 20 Items pro Seite

### Lazy Loading
- Komponenten werden on-demand geladen
- Reduziert Initial Bundle Size

## Fehlerbehandlung

```
User Action
  ↓
Try-Catch Block
  ├─ Success → State Update → UI Update
  └─ Error → Log → User Notification
```

Fehlertypen:
- Validation Errors: 400
- Auth Errors: 401/403
- Not Found: 404
- Server Errors: 500
`;

        return Response.json({ 
            markdownContent: markdown,
            status: 'success',
            generatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error in generateModuleArchitectureDocumentation:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});