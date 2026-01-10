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
      action
    } = await req.json();

    // Get user's role assignments (company-wide and workflow-specific)
    const assignments = await base44.asServiceRole.entities.WorkflowRoleAssignment.filter({
      company_id,
      $or: [
        { user_email: user.email, is_active: true },
        { workflow_id, user_email: user.email, is_active: true }
      ]
    });

    // Get user's group assignments
    const userGroups = await base44.asServiceRole.entities.UserGroup.filter({
      company_id,
      members: user.email
    });

    const groupAssignments = await base44.asServiceRole.entities.WorkflowRoleAssignment.filter({
      company_id,
      group_id: { $in: userGroups.map(g => g.id) },
      is_active: true
    });

    const allAssignments = [...assignments, ...groupAssignments];

    // Check for expired assignments
    const activeAssignments = allAssignments.filter(a => {
      if (!a.expires_at) return true;
      return new Date(a.expires_at) > new Date();
    });

    if (activeAssignments.length === 0) {
      return Response.json({
        has_permission: false,
        reason: 'No active role assignments',
        action_allowed: false
      });
    }

    // Get roles and check permissions
    const roleIds = activeAssignments.map(a => a.role_id);
    const roles = [];

    for (const roleId of roleIds) {
      const role = await base44.asServiceRole.entities.WorkflowRole.read(roleId);
      if (role) roles.push(role);
    }

    // Check if any role allows the action
    const hasPermission = roles.some(role => {
      const actionPermissionMap = {
        'view': 'view',
        'execute': 'execute',
        'edit': 'edit',
        'delete': 'delete',
        'manage_permissions': 'manage_permissions',
        'manage_templates': 'manage_templates',
        'view_analytics': 'view_analytics',
        'approve': 'approve'
      };

      const permission = actionPermissionMap[action];
      return role.permissions[permission] === true;
    });

    return Response.json({
      has_permission: hasPermission,
      action_allowed: hasPermission,
      assigned_roles: roles.map(r => ({ id: r.id, name: r.display_name })),
      action,
      user_email: user.email
    });
  } catch (error) {
    console.error('Check workflow permission by role error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});