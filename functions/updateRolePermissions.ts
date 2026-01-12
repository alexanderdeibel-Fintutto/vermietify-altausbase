import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { mandant_id, permissions } = await req.json();

    console.log(`[Permissions] Updating role permissions for mandant ${mandant_id}`);

    // Update each role's permissions
    for (const [roleName, rolePerms] of Object.entries(permissions)) {
      const existingAccess = await base44.asServiceRole.entities.UserMandantAccess.filter({
        rolle: roleName
      });

      if (existingAccess.length > 0) {
        // Update all existing records with this role
        for (const access of existingAccess) {
          await base44.asServiceRole.entities.UserMandantAccess.update(access.id, {
            berechtigungen: JSON.stringify(rolePerms)
          });
        }
      }

      // Also update or create the role definition
      const roleDef = await base44.asServiceRole.entities.RoleDefinition.filter({ rolle_name: roleName });
      
      if (roleDef.length > 0) {
        await base44.asServiceRole.entities.RoleDefinition.update(roleDef[0].id, {
          berechtigungen: JSON.stringify(rolePerms)
        });
      }
    }

    console.log(`[Permissions] Updated permissions for ${Object.keys(permissions).length} roles`);

    return Response.json({ 
      success: true,
      updated_roles: Object.keys(permissions).length
    });
  } catch (error) {
    console.error('Update permissions error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});