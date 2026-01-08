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
    const fieldPermissions = await base44.asServiceRole.entities.FieldPermission.list();
    const assignments = await base44.asServiceRole.entities.UserRoleAssignment.list();
    
    const backup = {
      backupDate: new Date().toISOString(),
      backupBy: user.email,
      version: "1.0",
      entities: {
        roles,
        permissions,
        fieldPermissions,
        assignments
      },
      statistics: {
        rolesCount: roles.length,
        permissionsCount: permissions.length,
        fieldPermissionsCount: fieldPermissions.length,
        assignmentsCount: assignments.length
      }
    };
    
    // Upload backup to storage
    const backupJson = JSON.stringify(backup, null, 2);
    const blob = new Blob([backupJson], { type: 'application/json' });
    const file = new File([blob], `backup_roles_${new Date().toISOString()}.json`);
    
    const uploadResult = await base44.asServiceRole.integrations.Core.UploadFile({ file });
    
    return Response.json({
      success: true,
      backupUrl: uploadResult.file_url,
      statistics: backup.statistics,
      message: "Backup successfully created"
    });
    
  } catch (error) {
    console.error("Backup error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});