import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const PREDEFINED_PERMISSIONS = {
  "*": { name: "Alle Rechte", module: "*", resource: "*", action: "all" },
  "finance_read": { name: "Finanzen lesen", module: "core_finance", resource: "finance", action: "read" },
  "finance_write": { name: "Finanzen bearbeiten", module: "core_finance", resource: "finance", action: "write" },
  "finance_delete": { name: "Finanzen löschen", module: "core_finance", resource: "finance", action: "delete" },
  "buildings_read": { name: "Gebäude lesen", module: "easy_vermieter", resource: "buildings", action: "read" },
  "buildings_write": { name: "Gebäude bearbeiten", module: "easy_vermieter", resource: "buildings", action: "write" },
  "documents_read": { name: "Dokumente lesen", module: "core_documents", resource: "documents", action: "read" },
  "documents_create": { name: "Dokumente erstellen", module: "core_documents", resource: "documents", action: "write" },
  "contracts_read": { name: "Verträge lesen", module: "easy_vermieter", resource: "contracts", action: "read" },
  "contracts_write": { name: "Verträge bearbeiten", module: "easy_vermieter", resource: "contracts", action: "write" },
  "tasks_manage": { name: "Aufgaben verwalten", module: "core_tasks", resource: "tasks", action: "all" },
  "maintenance_full": { name: "Wartung verwalten", module: "maintenance", resource: "maintenance", action: "all" },
  "reports_generate": { name: "Berichte erstellen", module: "core_finance", resource: "reports", action: "execute" },
  "user_management": { name: "Benutzerverwaltung", module: "core", resource: "users", action: "all" },
  "own_buildings_read": { name: "Eigene Gebäude lesen", module: "easy_vermieter", resource: "buildings", action: "read" },
  "test_environment": { name: "Test-Umgebung", module: "testing", resource: "testing", action: "all" }
};

const PREDEFINED_ROLES = {
  "account_owner": {
    name: "Account-Inhaber",
    description: "Vollzugriff auf alle Module und Benutzer",
    category: "admin",
    permissions: ["*"]
  },
  "buchhalter": {
    name: "Buchhalter",
    description: "Vollzugriff auf Finanzen, eingeschränkter Zugriff auf andere Module",
    category: "mitarbeiter",
    permissions: ["finance_read", "finance_write", "documents_read", "reports_generate"]
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
    permissions: ["contracts_read", "contracts_write", "buildings_read", "documents_create", "finance_read"]
  },
  "eigentuemer": {
    name: "Eigentümer",
    description: "Einsicht in eigene Objekte und Abrechnungen",
    category: "extern",
    permissions: ["own_buildings_read", "documents_read", "reports_generate"]
  },
  "tester": {
    name: "Tester",
    description: "Vollzugriff für Testing mit Zeiterfassung",
    category: "testing",
    permissions: ["test_environment", "*"]
  }
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (user.role !== "admin") {
      return Response.json({ error: "Only admin can initialize roles" }, { status: 403 });
    }
    
    let created = { roles: 0, permissions: 0, modules: 0 };
    
    // 1. Permissions erstellen
    for (const [code, permData] of Object.entries(PREDEFINED_PERMISSIONS)) {
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
        created.permissions++;
      }
    }
    
    // Permission-IDs laden
    const allPermissions = await base44.asServiceRole.entities.Permission.list();
    const permissionMap = {};
    allPermissions.forEach(p => {
      permissionMap[p.code] = p.id;
    });
    
    // 2. Rollen erstellen
    for (const [code, roleData] of Object.entries(PREDEFINED_ROLES)) {
      const existing = await base44.asServiceRole.entities.Role.filter({ 
        name: roleData.name,
        is_predefined: true 
      });
      
      if (existing.length === 0) {
        const permissionIds = roleData.permissions
          .map(permCode => permissionMap[permCode])
          .filter(id => id);
        
        await base44.asServiceRole.entities.Role.create({
          name: roleData.name,
          description: roleData.description,
          category: roleData.category,
          is_predefined: true,
          is_active: true,
          permissions: permissionIds
        });
        created.roles++;
      }
    }
    
    // 3. Modul-Preise initialisieren
    const moduleConfigs = [
      { 
        code: "core_finance", 
        name: "Finanzmodul", 
        category: "core",
        description: "Buchungen, Rechnungen, Banking, Zahlungsverkehr",
        price_monthly: 29, 
        price_yearly: 290,
        features: ["Buchungen", "Rechnungsmanagement", "Banking-Integration", "Zahlungsabgleich"]
      },
      { 
        code: "core_documents", 
        name: "Dokumentenmodul", 
        category: "core",
        description: "Dokumentenerstellung, Templates, PDF-Generierung",
        price_monthly: 19, 
        price_yearly: 190,
        features: ["Template-System", "PDF-Generierung", "Dokumentenverwaltung"]
      },
      { 
        code: "core_tasks", 
        name: "Aufgabenmodul", 
        category: "core",
        description: "Task-Management, Workflows, Erinnerungen",
        price_monthly: 12, 
        price_yearly: 120,
        features: ["Task-Management", "Workflows", "Automatisierung"]
      },
      { 
        code: "easy_vermieter", 
        name: "easyVermieter", 
        category: "app_package",
        description: "Komplette Immobilienverwaltung für Vermieter",
        price_monthly: 99, 
        price_yearly: 990,
        features: ["Objektverwaltung", "Mieterverwaltung", "Verträge", "Betriebskosten", "Anlage V"],
        dependencies: ["core_finance", "core_documents", "core_tasks"]
      }
    ];
    
    for (const config of moduleConfigs) {
      const existing = await base44.asServiceRole.entities.ModulePricing.filter({ 
        module_code: config.code 
      });
      
      if (existing.length === 0) {
        await base44.asServiceRole.entities.ModulePricing.create({
          module_code: config.code,
          module_name: config.name,
          description: config.description,
          category: config.category,
          price_monthly: config.price_monthly,
          price_yearly: config.price_yearly,
          features: config.features || [],
          dependencies: config.dependencies || [],
          is_active: true
        });
        created.modules++;
      }
    }
    
    return Response.json({ 
      success: true,
      created,
      message: `${created.permissions} Permissions, ${created.roles} Rollen, ${created.modules} Module erstellt`
    });
    
  } catch (error) {
    console.error("Initialize roles error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});