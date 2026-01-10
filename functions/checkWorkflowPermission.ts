import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workflow_id, permission_type = 'view' } = await req.json();

    // Get workflow
    const workflow = await base44.asServiceRole.entities.WorkflowAutomation.read(workflow_id);
    if (!workflow) {
      return Response.json({ error: 'Workflow not found' }, { status: 404 });
    }

    // Get user's role assignments
    const roleAssignments = await base44.asServiceRole.entities.UserRoleAssignment.filter({
      user_email: user.email,
      is_active: true
    });

    const userRoleIds = roleAssignments.map(r => r.role_id);

    // Get user's groups
    const userGroups = await base44.asServiceRole.entities.UserGroup.filter({
      members: { $in: [user.email] },
      is_active: true
    });

    const userGroupIds = userGroups.map(g => g.id);

    // Check permissions in order of specificity: user > group > role
    const allPermissions = await base44.asServiceRole.entities.WorkflowPermission.filter({
      workflow_id
    });

    // User-specific permission
    const userPerm = allPermissions.find(p => p.user_email === user.email);
    if (userPerm) {
      const hasPermission = userPerm.permissions[permission_type];
      const isExpired = userPerm.expires_at && new Date(userPerm.expires_at) < new Date();
      
      return Response.json({
        success: true,
        has_permission: hasPermission && !isExpired,
        source: 'user',
        expires_at: userPerm.expires_at
      });
    }

    // Group-specific permission
    const groupPerm = allPermissions.find(p => p.group_id && userGroupIds.includes(p.group_id));
    if (groupPerm) {
      const hasPermission = groupPerm.permissions[permission_type];
      const isExpired = groupPerm.expires_at && new Date(groupPerm.expires_at) < new Date();
      
      return Response.json({
        success: true,
        has_permission: hasPermission && !isExpired,
        source: 'group',
        expires_at: groupPerm.expires_at
      });
    }

    // Role-specific permission
    const rolePerm = allPermissions.find(p => p.role_id && userRoleIds.includes(p.role_id));
    if (rolePerm) {
      const hasPermission = rolePerm.permissions[permission_type];
      const isExpired = rolePerm.expires_at && new Date(rolePerm.expires_at) < new Date();
      
      return Response.json({
        success: true,
        has_permission: hasPermission && !isExpired,
        source: 'role',
        expires_at: rolePerm.expires_at
      });
    }

    // No permission found
    return Response.json({
      success: true,
      has_permission: false,
      source: 'none'
    });
  } catch (error) {
    console.error('Check workflow permission error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});