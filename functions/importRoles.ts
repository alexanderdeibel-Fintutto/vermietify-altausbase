import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }
    
    const { importData, mode = 'merge' } = await req.json();
    
    if (!importData || !importData.data) {
      return Response.json({ error: "Invalid import data" }, { status: 400 });
    }
    
    const { roles = [], permissions = [], assignments = [] } = importData.data;
    
    let stats = {
      rolesCreated: 0,
      rolesUpdated: 0,
      permissionsCreated: 0,
      assignmentsCreated: 0,
      errors: []
    };
    
    // Import Permissions
    for (const perm of permissions) {
      try {
        const existing = await base44.asServiceRole.entities.Permission.filter({ code: perm.code });
        if (existing.length === 0) {
          await base44.asServiceRole.entities.Permission.create(perm);
          stats.permissionsCreated++;
        }
      } catch (error) {
        stats.errors.push(`Permission ${perm.code}: ${error.message}`);
      }
    }
    
    // Import Roles
    for (const role of roles) {
      try {
        const existing = await base44.asServiceRole.entities.Role.filter({ name: role.name });
        if (existing.length === 0) {
          await base44.asServiceRole.entities.Role.create(role);
          stats.rolesCreated++;
        } else if (mode === 'overwrite') {
          await base44.asServiceRole.entities.Role.update(existing[0].id, role);
          stats.rolesUpdated++;
        }
      } catch (error) {
        stats.errors.push(`Role ${role.name}: ${error.message}`);
      }
    }
    
    return Response.json({
      success: true,
      stats,
      message: `Import completed: ${stats.rolesCreated} roles, ${stats.permissionsCreated} permissions created`
    });
    
  } catch (error) {
    console.error("Import roles error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});