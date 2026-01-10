import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workflow_id, company_id } = await req.json();

    // Check if user can manage permissions
    const userPerms = await base44.asServiceRole.entities.WorkflowPermission.filter({
      workflow_id,
      user_email: user.email
    });

    const canManage = userPerms.some(p => p.permissions?.manage);
    if (!canManage) {
      return Response.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get all permissions for workflow
    const allPermissions = await base44.asServiceRole.entities.WorkflowPermission.filter({
      workflow_id
    });

    // Enhance with user/role/group details
    const enrichedPermissions = await Promise.all(
      allPermissions.map(async (perm) => {
        let target_info = null;

        if (perm.user_email) {
          target_info = {
            type: 'user',
            email: perm.user_email
          };
        } else if (perm.role_id) {
          const role = await base44.asServiceRole.entities.CustomRole.read(perm.role_id);
          target_info = {
            type: 'role',
            id: perm.role_id,
            name: role?.name
          };
        } else if (perm.group_id) {
          const group = await base44.asServiceRole.entities.UserGroup.read(perm.group_id);
          target_info = {
            type: 'group',
            id: perm.group_id,
            name: group?.name,
            members_count: group?.members?.length || 0
          };
        }

        return {
          ...perm,
          target_info,
          is_expired: perm.expires_at && new Date(perm.expires_at) < new Date()
        };
      })
    );

    return Response.json({
      success: true,
      permissions: enrichedPermissions
    });
  } catch (error) {
    console.error('Get workflow permissions error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});