import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { user_email, role_id, company_id, reason } = await req.json();

    // Get role details
    const roles = await base44.asServiceRole.entities.CustomRole.filter({ id: role_id });
    if (roles.length === 0) {
      return Response.json({ error: 'Role not found' }, { status: 404 });
    }

    const role = roles[0];

    // Assign role (create or update assignment)
    const assignments = await base44.asServiceRole.entities.UserRoleAssignment.filter({
      user_email,
      role_id
    });

    if (assignments.length > 0) {
      // Update existing
      await base44.asServiceRole.entities.UserRoleAssignment.update(assignments[0].id, {
        is_active: true
      });
    } else {
      // Create new
      await base44.asServiceRole.entities.UserRoleAssignment.create({
        user_email,
        role_id,
        company_id,
        assigned_by: user.email
      });
    }

    // Log the assignment
    await base44.asServiceRole.entities.PermissionAuditLog.create({
      action_type: 'role_assigned',
      role_id,
      role_name: role.name,
      user_email,
      changed_by: user.email,
      company_id,
      new_permissions: role.entity_permissions,
      reason
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Assign role error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});