import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      company_id,
      workflow_id,
      action,
      role_id,
      user_email,
      group_id,
      permissions,
      expires_at,
      notes
    } = await req.json();

    // Check if user has manage permission
    const existingPermissions = await base44.asServiceRole.entities.WorkflowPermission.filter({
      workflow_id,
      user_email: user.email
    });

    const userHasManage = existingPermissions.some(p => p.permissions?.manage);
    if (!userHasManage) {
      return Response.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    let result;

    if (action === 'grant') {
      // Check if permission already exists
      const query = {
        workflow_id,
        company_id
      };
      
      if (role_id) query.role_id = role_id;
      if (user_email) query.user_email = user_email;
      if (group_id) query.group_id = group_id;

      const existing = await base44.asServiceRole.entities.WorkflowPermission.filter(query);

      if (existing.length > 0) {
        // Update existing
        result = await base44.asServiceRole.entities.WorkflowPermission.update(existing[0].id, {
          permissions,
          expires_at,
          notes,
          granted_by: user.email
        });
      } else {
        // Create new
        result = await base44.asServiceRole.entities.WorkflowPermission.create({
          workflow_id,
          company_id,
          role_id,
          user_email,
          group_id,
          permissions,
          expires_at,
          notes,
          granted_by: user.email
        });
      }

      // Log to permission audit
      await base44.asServiceRole.entities.PermissionAuditLog.create({
        action_type: 'permission_granted',
        role_id,
        role_name: `Workflow: ${workflow_id}`,
        user_email: user_email || group_id,
        changed_by: user.email,
        company_id,
        new_permissions: permissions,
        changed_fields: Object.keys(permissions),
        reason: notes
      });
    } else if (action === 'revoke') {
      const query = {
        workflow_id,
        company_id
      };
      
      if (role_id) query.role_id = role_id;
      if (user_email) query.user_email = user_email;
      if (group_id) query.group_id = group_id;

      const existing = await base44.asServiceRole.entities.WorkflowPermission.filter(query);

      if (existing.length > 0) {
        await base44.asServiceRole.entities.WorkflowPermission.delete(existing[0].id);
        result = { success: true, deleted: true };

        // Log revoke
        await base44.asServiceRole.entities.PermissionAuditLog.create({
          action_type: 'permission_revoked',
          role_id,
          role_name: `Workflow: ${workflow_id}`,
          user_email: user_email || group_id,
          changed_by: user.email,
          company_id,
          old_permissions: existing[0].permissions,
          reason: notes
        });
      }
    }

    return Response.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Manage workflow permissions error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});