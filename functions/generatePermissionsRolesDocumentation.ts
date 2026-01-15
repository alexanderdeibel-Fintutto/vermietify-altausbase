import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const markdown = `# Berechtigungen & Rollen

## Übersicht

Dokumentation des Rollen- und Berechtigungssystems.

## Rollen

### Admin
**Beschreibung:** Vollständiger Zugriff auf alle Funktionen und Daten

**Berechtigungen:**
- ✓ Alle Entitäten erstellen, lesen, aktualisieren, löschen
- ✓ Benutzer verwalten
- ✓ Rollen und Berechtigungen konfigurieren
- ✓ Audit Logs einsehen
- ✓ System-Einstellungen konfigurieren
- ✓ Backups erstellen/verwalten
- ✓ Alle Berichte generieren
- ✓ Externe Integrationen konfigurieren

**Typische Benutzer:**
- App-Administrator
- CTO/Technischer Leiter

---

### Manager
**Beschreibung:** Verwaltung von zugeordneten Gebäuden und Mietern

**Berechtigungen:**
- ✓ Gebäude (zugeordnet): vollständiger Zugriff
- ✓ Mieter (zugeordnet): vollständiger Zugriff
- ✓ Mietverträge: erstellen, ändern, beenden
- ✓ Dokumente hochladen/verwalten
- ✓ Berichte für zugeordnete Gebäude
- ✓ Zahlungen verarbeiten
- ✓ Mieter-Kommunikation
- ✗ Andere Gebäude sehen
- ✗ Benutzer verwalten
- ✗ System-Einstellungen

**Typische Benutzer:**
- Hausverwalter
- Gebäudemanager
- Makler

---

### Accountant
**Beschreibung:** Finanzielle Operationen und Abrechnung

**Berechtigungen:**
- ✓ Rechnungen: lesen, erstellen, ändern
- ✓ Zahlungen: lesen, verarbeiten, abgleichen
- ✓ Bankkonten: lesen
- ✓ Banktransaktionen: lesen, abgleichen
- ✓ Betriebskosten: lesen, berechnen
- ✓ Abrechnungen erstellen
- ✓ Finanzberichte generieren
- ✗ Mieter erstellen/löschen
- ✗ Mietverträge beenden
- ✗ Gebäude-Einstellungen ändern

**Typische Benutzer:**
- Buchhalter
- Finanzmanager

---

### Tenant (Mieter)
**Beschreibung:** Eingeschränkter Zugriff (Mieter-Portal)

**Berechtigungen:**
- ✓ Eigener Mietvertrag lesen
- ✓ Eigene Rechnungen einsehen
- ✓ Zahlungen tätigen
- ✓ Eigene Dokumente hochladen
- ✓ Wartungsanfragen stellen
- ✓ Mit Verwalter kommunizieren
- ✗ Andere Mieter sehen
- ✗ Gebäudedaten ändern
- ✗ Finanzielle Daten anderer

**Typische Benutzer:**
- Wohnungsmieter
- Gewerbemieter

## Berechtigungsmatrix

\`\`\`
                     Admin  Manager  Accountant  Tenant
─────────────────────────────────────────────────────
Building.create        ✓       ✓         ✗         ✗
Building.read          ✓       ✓         ✗         ✗
Building.update        ✓       ✓         ✗         ✗
Building.delete        ✓       ✗         ✗         ✗

Unit.create            ✓       ✓         ✗         ✗
Unit.read              ✓       ✓         ✗         ✗
Unit.update            ✓       ✓         ✗         ✗
Unit.delete            ✓       ✗         ✗         ✗

Tenant.create          ✓       ✓         ✗         ✗
Tenant.read            ✓       ✓         ✗         ✓(self)
Tenant.update          ✓       ✓         ✗         ✓(self)
Tenant.delete          ✓       ✗         ✗         ✗

LeaseContract.create   ✓       ✓         ✗         ✗
LeaseContract.read     ✓       ✓         ✗         ✓(own)
LeaseContract.update   ✓       ✓         ✗         ✗
LeaseContract.delete   ✓       ✗         ✗         ✗

Invoice.create         ✓       ✓         ✓         ✗
Invoice.read           ✓       ✓         ✓         ✓(own)
Invoice.update         ✓       ✓         ✓         ✗
Invoice.delete         ✓       ✗         ✗         ✗

Payment.create         ✓       ✓         ✓         ✓(own)
Payment.read           ✓       ✓         ✓         ✓(own)
Payment.update         ✓       ✓         ✓         ✗

Document.upload        ✓       ✓         ✗         ✓
Document.read          ✓       ✓         ✗         ✓
Document.delete        ✓       ✓         ✗         ✗

User.manage            ✓       ✗         ✗         ✗
Report.generate        ✓       ✓         ✓         ✗
Settings.manage        ✓       ✗         ✗         ✗
\`\`\`

## Spezifische Berechtigungen

### Field-Level Permissions

Für bestimmte Felder können Zugriffsbeschränkungen gelten:

\`\`\`
Tenant:
  - email: Admin, Manager, Self
  - phone: Admin, Manager, Self
  - bank_account: Admin, Self only
  - passport_number: Admin, Manager (restricted)

LeaseContract:
  - rent_amount: Admin, Manager, Accountant
  - deposit: Admin, Manager
  - termination_reason: Admin, Manager
  - contract_terms: All authorized (read-only for Tenant)
\`\`\`

### Building-Level Isolation

Managers können nur ihre zugeordneten Gebäude sehen:

\`\`\`javascript
// Bei Manager-Login werden nur Gebäude gefiltert, die dem Benutzer zugeordnet sind
buildings = buildings.filter(b => b.manager_id === userId)
\`\`\`

## Berechtigungsprüfung

### Implementierung

\`\`\`javascript
// Beispiel: Vor Datenzugriff
if (user.role === 'TENANT') {
  // Nur eigene Daten erlauben
  if (requestedTenantId !== user.tenant_id) {
    throw new ForbiddenError('Access Denied')
  }
}

if (user.role === 'MANAGER') {
  // Nur zugeordnete Gebäude
  const building = await Building.get(buildingId)
  if (building.manager_id !== user.id) {
    throw new ForbiddenError('Access Denied')
  }
}
\`\`\`

## Audit & Compliance

### Logged Actions

Folgende Aktionen werden protokolliert:
- Benutzer erstellen/ändern/löschen
- Rollenänderungen
- Berechtigungsänderungen
- Datenzugriffe (bei sensiblen Daten)
- Datenänderungen (who, what, when)

### Audit Log Query

\`\`\`javascript
const logs = await AuditLog.filter({
  user_email: 'admin@example.com',
  action: 'DELETE',
  entity_type: 'LeaseContract'
})
\`\`\`

## Best Practices

1. **Principle of Least Privilege**
   - Geben Sie nur die minimal notwendigen Berechtigungen
   - Überprüfen Sie regelmäßig zugewiesene Rollen

2. **Separation of Duties**
   - Accountants sollten Payments nicht genehmigen, die sie selbst erstellt haben
   - Admins sollten ihre eigenen Änderungen nicht genehmigen

3. **Regular Audits**
   - Monatliche Überprüfung von Benutzerrollen
   - Entfernung ungenutzter Konten
   - Überprüfung von Gebäude-Zuordnungen

4. **Incident Response**
   - Bei Sicherheitsverletzung sofort Passwort resetzen
   - Berechtigungen sofort entziehen
   - Audit Log überprüfen auf verdächtige Aktivitäten
`;

        return Response.json({ 
            markdownContent: markdown,
            status: 'success',
            generatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error in generatePermissionsRolesDocumentation:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});