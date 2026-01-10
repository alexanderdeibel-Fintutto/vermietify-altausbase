import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user_email, role_id, company_id, expires_at, notes } = await req.json();

    // Check if user has permission to assign roles
    const hasPermission = await base44.functions.invoke('checkUserPermission', {
      resource: 'admin.manage_users',
      action: 'manage_users',
      company_id: company_id
    });

    if (!hasPermission.data.has_permission) {
      return Response.json({ error: 'Permission denied' }, { status: 403 });
    }

    // Remove existing active assignments for this user
    const existingAssignments = await base44.asServiceRole.entities.UserRoleAssignment.filter({
      user_email: user_email,
      company_id: company_id,
      is_active: true
    });

    for (const assignment of existingAssignments) {
      await base44.asServiceRole.entities.UserRoleAssignment.update(assignment.id, {
        is_active: false
      });
    }

    // Create new assignment
    const newAssignment = await base44.asServiceRole.entities.UserRoleAssignment.create({
      user_email: user_email,
      role_id: role_id,
      company_id: company_id,
      assigned_by: user.email,
      assigned_at: new Date().toISOString(),
      expires_at: expires_at,
      notes: notes,
      is_active: true
    });

    return Response.json({
      success: true,
      assignment: newAssignment
    });
  } catch (error) {
    console.error('Assign role error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});