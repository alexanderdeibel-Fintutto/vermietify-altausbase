import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }
    
    const roles = await base44.asServiceRole.entities.Role.list();
    const permissions = await base44.asServiceRole.entities.Permission.list();
    const assignments = await base44.asServiceRole.entities.UserRoleAssignment.list();
    
    const exportData = {
      exportDate: new Date().toISOString(),
      exportedBy: user.email,
      version: "1.0",
      data: {
        roles,
        permissions,
        assignments
      },
      summary: {
        rolesCount: roles.length,
        permissionsCount: permissions.length,
        assignmentsCount: assignments.length
      }
    };
    
    return Response.json({
      success: true,
      data: exportData
    });
    
  } catch (error) {
    console.error("Export roles error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});