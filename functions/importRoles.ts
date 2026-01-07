import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }
    
    const { importData } = await req.json();
    
    if (!importData || !importData.roles) {
      return Response.json({ error: 'Invalid import data' }, { status: 400 });
    }
    
    const results = {
      rolesCreated: 0,
      permissionsCreated: 0,
      errors: []
    };
    
    // Import Permissions zuerst
    if (importData.permissions) {
      for (const perm of importData.permissions) {
        try {
          // Prüfen ob Permission bereits existiert
          const existing = await base44.asServiceRole.entities.Permission.filter({
            code: perm.code
          });
          
          if (existing.length === 0) {
            await base44.asServiceRole.entities.Permission.create(perm);
            results.permissionsCreated++;
          }
        } catch (error) {
          results.errors.push(`Permission ${perm.code}: ${error.message}`);
        }
      }
    }
    
    // Import Rollen
    for (const role of importData.roles) {
      try {
        // Prüfen ob Rolle bereits existiert
        const existing = await base44.asServiceRole.entities.Role.filter({
          name: role.name
        });
        
        if (existing.length === 0) {
          await base44.asServiceRole.entities.Role.create(role);
          results.rolesCreated++;
        } else {
          results.errors.push(`Rolle ${role.name} existiert bereits`);
        }
      } catch (error) {
        results.errors.push(`Rolle ${role.name}: ${error.message}`);
      }
    }
    
    return Response.json({
      success: true,
      ...results,
      message: `${results.rolesCreated} Rollen und ${results.permissionsCreated} Permissions importiert`
    });
    
  } catch (error) {
    console.error("Import roles error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});