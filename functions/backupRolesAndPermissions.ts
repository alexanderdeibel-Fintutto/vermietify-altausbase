import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }
    
    // Alle relevanten Daten für Backup sammeln
    const roles = await base44.asServiceRole.entities.Role.list();
    const permissions = await base44.asServiceRole.entities.Permission.list();
    const fieldPermissions = await base44.asServiceRole.entities.FieldPermission.list();
    const roleAssignments = await base44.asServiceRole.entities.UserRoleAssignment.list();
    const moduleAccess = await base44.asServiceRole.entities.ModuleAccess.list();
    
    const backup = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      createdBy: user.email,
      data: {
        roles,
        permissions,
        fieldPermissions,
        roleAssignments,
        moduleAccess
      },
      statistics: {
        totalRoles: roles.length,
        totalPermissions: permissions.length,
        totalAssignments: roleAssignments.length,
        activeRoles: roles.filter(r => r.is_active).length
      }
    };
    
    return Response.json({
      success: true,
      backup,
      message: 'Backup erfolgreich erstellt'
    });
    
  } catch (error) {
    console.error("Backup error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});