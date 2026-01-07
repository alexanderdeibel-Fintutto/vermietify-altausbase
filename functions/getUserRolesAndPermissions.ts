import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { userId } = await req.json();
    
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: "Only admin can view user permissions" }, { status: 403 });
    }
    
    // Rollen-Zuweisungen laden
    const today = new Date().toISOString().split('T')[0];
    const roleAssignments = await base44.asServiceRole.entities.UserRoleAssignment.filter({
      user_id: userId,
      is_active: true
    });
    
    const activeAssignments = roleAssignments.filter(ra => {
      if (ra.valid_from > today) return false;
      if (ra.valid_until && ra.valid_until < today) return false;
      return true;
    });
    
    // Rollen laden
    const roleIds = activeAssignments.map(ra => ra.role_id);
    const roles = await base44.asServiceRole.entities.Role.filter({
      id: { $in: roleIds }
    });
    
    // Permissions laden
    const allPermissionIds = [];
    roles.forEach(role => {
      if (role.permissions && role.permissions.length > 0) {
        allPermissionIds.push(...role.permissions);
      }
    });
    
    const permissions = await base44.asServiceRole.entities.Permission.filter({
      id: { $in: allPermissionIds }
    });
    
    // Module Access laden
    const moduleAccess = await base44.asServiceRole.entities.ModuleAccess.filter({
      is_active: true
    });
    
    return Response.json({ 
      success: true,
      roleAssignments: activeAssignments.map(ra => ({
        ...ra,
        role: roles.find(r => r.id === ra.role_id)
      })),
      roles,
      permissions,
      moduleAccess
    });
    
  } catch (error) {
    console.error("Get user roles error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});