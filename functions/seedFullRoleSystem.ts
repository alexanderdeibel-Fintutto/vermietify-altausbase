import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const FULL_PERMISSIONS = {
  // Finance Permissions
  "finance_read": { name: "Finanzen lesen", module: "core_finance", resource: "finance", action: "read" },
  "finance_write": { name: "Finanzen bearbeiten", module: "core_finance", resource: "finance", action: "write" },
  "finance_delete": { name: "Finanzen löschen", module: "core_finance", resource: "finance", action: "delete" },
  
  // Buildings Permissions
  "buildings_read": { name: "Gebäude lesen", module: "property", resource: "buildings", action: "read" },
  "buildings_write": { name: "Gebäude bearbeiten", module: "property", resource: "buildings", action: "write" },
  "buildings_delete": { name: "Gebäude löschen", module: "property", resource: "buildings", action: "delete" },
  "own_buildings_read": { name: "Eigene Gebäude lesen", module: "property", resource: "buildings", action: "read" },
  
  // Documents Permissions
  "documents_read": { name: "Dokumente lesen", module: "core_documents", resource: "documents", action: "read" },
  "documents_create": { name: "Dokumente erstellen", module: "core_documents", resource: "documents", action: "write" },
  "documents_delete": { name: "Dokumente löschen", module: "core_documents", resource: "documents", action: "delete" },
  
  // Tasks Permissions
  "tasks_read": { name: "Aufgaben lesen", module: "core_tasks", resource: "tasks", action: "read" },
  "tasks_manage": { name: "Aufgaben verwalten", module: "core_tasks", resource: "tasks", action: "write" },
  "tasks_assign": { name: "Aufgaben zuweisen", module: "core_tasks", resource: "tasks", action: "execute" },
  
  // Contracts Permissions
  "contracts_read": { name: "Verträge lesen", module: "property", resource: "contracts", action: "read" },
  "contracts_full": { name: "Verträge verwalten", module: "property", resource: "contracts", action: "all" },
  "own_contract_read": { name: "Eigenen Vertrag lesen", module: "property", resource: "contracts", action: "read" },
  
  // Tenants Permissions
  "tenants_read": { name: "Mieter lesen", module: "property", resource: "tenants", action: "read" },
  "tenants_manage": { name: "Mieter verwalten", module: "property", resource: "tenants", action: "write" },
  "tenants_full": { name: "Mieter Vollzugriff", module: "property", resource: "tenants", action: "all" },
  
  // Reports & Analytics
  "reports_read": { name: "Berichte lesen", module: "core", resource: "reports", action: "read" },
  "reports_generate": { name: "Berichte erstellen", module: "core", resource: "reports", action: "execute" },
  "own_reports_read": { name: "Eigene Berichte lesen", module: "core", resource: "reports", action: "read" },
  
  // User Management
  "users_read": { name: "Benutzer lesen", module: "core", resource: "users", action: "read" },
  "users_manage": { name: "Benutzer verwalten", module: "core", resource: "users", action: "write" },
  "user_management": { name: "Benutzerverwaltung", module: "core", resource: "users", action: "all" },
  
  // System
  "system_settings": { name: "System-Einstellungen", module: "core", resource: "system", action: "all" },
  "audit_logs": { name: "Audit-Logs", module: "core", resource: "logs", action: "read" },
  
  // Maintenance
  "maintenance_read": { name: "Wartung lesen", module: "maintenance", resource: "maintenance", action: "read" },
  "maintenance_full": { name: "Wartung verwalten", module: "maintenance", resource: "maintenance", action: "all" },
  "maintenance_request": { name: "Wartung anfordern", module: "maintenance", resource: "maintenance", action: "execute" },
  
  // Testing
  "test_environment": { name: "Test-Umgebung", module: "testing", resource: "testing", action: "all" },
  "all_modules_test": { name: "Alle Module testen", module: "testing", resource: "*", action: "all" },
  "feedback_submit": { name: "Feedback senden", module: "testing", resource: "feedback", action: "write" },
  
  // Wildcard
  "*": { name: "Alle Rechte", module: "*", resource: "*", action: "all" }
};

const FULL_ROLES = {
  // Admin Roles
  "account_owner": {
    name: "Account-Inhaber",
    description: "Vollzugriff auf alle Module und Benutzer",
    category: "admin",
    permissions: ["*"]
  },
  "super_admin": {
    name: "Administrator",
    description: "Technischer Administrator mit erweiterten Rechten",
    category: "admin",
    permissions: ["user_management", "system_settings", "audit_logs", "*"]
  },
  
  // Employee Roles
  "buchhalter": {
    name: "Buchhalter",
    description: "Vollzugriff auf Finanzen, eingeschränkter Zugriff auf andere Module",
    category: "mitarbeiter",
    permissions: ["finance_read", "finance_write", "documents_read", "reports_generate", "buildings_read"]
  },
  "hauswart": {
    name: "Hauswart/Facility Manager",
    description: "Wartung, Reparaturen, Mängelverwaltung",
    category: "mitarbeiter",
    permissions: ["maintenance_full", "buildings_read", "tasks_manage", "documents_create"]
  },
  "sachbearbeiter": {
    name: "Sachbearbeiter",
    description: "Breite Rechte für operative Tätigkeiten",
    category: "mitarbeiter",
    permissions: ["contracts_full", "tenants_full", "documents_create", "buildings_read", "tasks_manage"]
  },
  "assistent": {
    name: "Assistent/Empfang",
    description: "Eingeschränkte Rechte für Assistenz-Tätigkeiten",
    category: "mitarbeiter",
    permissions: ["tenants_read", "documents_read", "tasks_read"]
  },
  "verwalter_assistent": {
    name: "Verwalter-Assistent",
    description: "Unterstützung bei Verwaltungstätigkeiten",
    category: "mitarbeiter",
    permissions: ["buildings_read", "tenants_manage", "documents_create", "contracts_read"]
  },
  
  // External Roles
  "eigentuemer": {
    name: "Eigentümer",
    description: "Einsicht in eigene Objekte und Abrechnungen",
    category: "extern",
    permissions: ["own_buildings_read", "documents_read", "own_reports_read"]
  },
  "gesellschafter": {
    name: "Gesellschafter",
    description: "Einsicht in Gesellschafts-Objekte",
    category: "extern",
    permissions: ["own_buildings_read", "reports_read", "documents_read"]
  },
  "mieter": {
    name: "Mieter",
    description: "Einsicht in eigenen Mietvertrag und Abrechnungen",
    category: "extern",
    permissions: ["own_contract_read", "documents_read", "maintenance_request"]
  },
  "kunde": {
    name: "Kunde",
    description: "Kundenportal-Zugriff",
    category: "extern",
    permissions: ["documents_read", "reports_read"]
  },
  
  // Service Provider Roles
  "handwerker": {
    name: "Handwerker",
    description: "Zugriff auf Wartungsaufträge und Objektdaten",
    category: "dienstleister",
    permissions: ["maintenance_read", "buildings_read", "tasks_read"]
  },
  "steuerberater": {
    name: "Steuerberater",
    description: "Zugriff auf steuerliche Daten und Berichte",
    category: "dienstleister",
    permissions: ["finance_read", "reports_generate", "documents_read"]
  },
  "rechtsanwalt": {
    name: "Rechtsanwalt",
    description: "Zugriff auf Verträge und Rechtsdokumente",
    category: "dienstleister",
    permissions: ["contracts_read", "documents_read"]
  },
  "facility_manager": {
    name: "Facility Manager",
    description: "Technische Gebäudeverwaltung",
    category: "dienstleister",
    permissions: ["maintenance_full", "buildings_read", "tasks_manage"]
  },
  
  // Testing Roles
  "tester": {
    name: "Tester",
    description: "Vollzugriff für Testing mit Zeiterfassung",
    category: "testing",
    permissions: ["test_environment", "all_modules_test", "feedback_submit"]
  },
  "beta_user": {
    name: "Beta-Tester",
    description: "Früher Zugriff auf neue Features",
    category: "testing",
    permissions: ["all_modules_test", "feedback_submit"]
  }
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }
    
    const stats = {
      permissions_created: 0,
      roles_created: 0,
      errors: []
    };
    
    // 1. Permissions erstellen
    for (const [code, permData] of Object.entries(FULL_PERMISSIONS)) {
      try {
        const existing = await base44.asServiceRole.entities.Permission.filter({ code });
        
        if (existing.length === 0) {
          await base44.asServiceRole.entities.Permission.create({
            code,
            name: permData.name,
            description: permData.name,
            module: permData.module,
            resource: permData.resource,
            action: permData.action,
            is_active: true
          });
          stats.permissions_created++;
        }
      } catch (error) {
        stats.errors.push(`Permission ${code}: ${error.message}`);
      }
    }
    
    // 2. Rollen erstellen
    for (const [roleCode, roleData] of Object.entries(FULL_ROLES)) {
      try {
        const existing = await base44.asServiceRole.entities.Role.filter({
          name: roleData.name,
          is_predefined: true
        });
        
        if (existing.length === 0) {
          // Permission-IDs sammeln
          const permissionIds = [];
          for (const permCode of roleData.permissions) {
            const perms = await base44.asServiceRole.entities.Permission.filter({ code: permCode });
            if (perms.length > 0) {
              permissionIds.push(perms[0].id);
            }
          }
          
          await base44.asServiceRole.entities.Role.create({
            name: roleData.name,
            description: roleData.description,
            category: roleData.category,
            is_predefined: true,
            is_active: true,
            permissions: permissionIds
          });
          stats.roles_created++;
        }
      } catch (error) {
        stats.errors.push(`Role ${roleCode}: ${error.message}`);
      }
    }
    
    return Response.json({
      success: true,
      stats,
      message: `${stats.permissions_created} Permissions und ${stats.roles_created} Rollen erstellt`
    });
    
  } catch (error) {
    console.error("Seed role system error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});