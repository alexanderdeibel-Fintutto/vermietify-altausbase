import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { resource, action, company_id } = await req.json();

    // Get user's role assignments
    const assignments = await base44.asServiceRole.entities.UserRoleAssignment.filter({
      user_email: user.email,
      company_id: company_id,
      is_active: true
    });

    if (assignments.length === 0) {
      return Response.json({ has_permission: false, reason: 'no_role_assigned' });
    }

    // Check if any of the user's roles has the required permission
    for (const assignment of assignments) {
      const role = await base44.asServiceRole.entities.UserRole.filter({
        id: assignment.role_id
      });

      if (role.length > 0) {
        const roleData = role[0];
        
        // Check expiration
        if (assignment.expires_at && new Date(assignment.expires_at) < new Date()) {
          continue; // Skip expired assignment
        }

        // Check permission
        const parts = resource.split('.');
        let perms = roleData.permissions;

        for (const part of parts) {
          if (perms && typeof perms === 'object') {
            perms = perms[part];
          } else {
            break;
          }
        }

        if (perms && perms[action] === true) {
          return Response.json({
            has_permission: true,
            role: roleData.name,
            resource,
            action
          });
        }
      }
    }

    return Response.json({
      has_permission: false,
      reason: 'permission_denied',
      resource,
      action
    });
  } catch (error) {
    console.error('Check permission error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});