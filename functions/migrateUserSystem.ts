import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (user.role !== "admin") {
      return Response.json({ error: "Only admin can run migrations" }, { status: 403 });
    }
    
    let migrated = { users: 0, modules: 0 };
    
    // 1. Bestehende User aktualisieren
    const existingUsers = await base44.asServiceRole.entities.User.list();
    
    for (const existingUser of existingUsers) {
      // Tester-Flag hinzufügen falls nicht vorhanden
      if (existingUser.is_tester === undefined) {
        await base44.asServiceRole.entities.User.update(existingUser.id, {
          is_tester: false,
          account_id: 'default'
        });
        migrated.users++;
      }
      
      // Rollen-Zuweisung für bestehende User
      const roleAssignments = await base44.asServiceRole.entities.UserRoleAssignment.filter({
        user_id: existingUser.id
      });
      
      if (roleAssignments.length === 0) {
        // Standard-Rolle basierend auf aktuellem role-Feld zuweisen
        const roleName = existingUser.role === "admin" ? "Account-Inhaber" : "Sachbearbeiter";
        const systemRole = await base44.asServiceRole.entities.Role.filter({ 
          name: roleName,
          is_predefined: true 
        });
        
        if (systemRole.length > 0) {
          await base44.asServiceRole.entities.UserRoleAssignment.create({
            user_id: existingUser.id,
            role_id: systemRole[0].id,
            valid_from: new Date().toISOString().split('T')[0],
            assigned_by: user.id,
            notes: "Automatische Migration",
            is_active: true
          });
        }
      }
    }
    
    // 2. Standard-Module für bestehende Accounts aktivieren
    const coreModules = ['core_finance', 'core_documents', 'easy_vermieter'];
    
    for (const moduleCode of coreModules) {
      const existingAccess = await base44.asServiceRole.entities.ModuleAccess.filter({
        account_id: 'default',
        module_code: moduleCode
      });
      
      if (existingAccess.length === 0) {
        await base44.asServiceRole.entities.ModuleAccess.create({
          account_id: 'default',
          module_code: moduleCode,
          is_active: true,
          purchased_date: new Date().toISOString().split('T')[0],
          price_paid: 0,
          billing_cycle: 'onetime',
          auto_renew: false,
          purchased_by: user.id
        });
        migrated.modules++;
      }
    }
    
    return Response.json({ 
      success: true,
      migrated,
      message: `${migrated.users} User und ${migrated.modules} Module migriert`
    });
    
  } catch (error) {
    console.error("Migration error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});