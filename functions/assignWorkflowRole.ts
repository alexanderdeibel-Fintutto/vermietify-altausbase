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
      role_id,
      user_email,
      group_id,
      workflow_id,
      expires_at
    } = await req.json();

    // Check if user is admin
    const isAdmin = user.role === 'admin';
    if (!isAdmin) {
      return Response.json({ error: 'Only admins can assign roles' }, { status: 403 });
    }

    // Create assignment
    const assignment = await base44.asServiceRole.entities.WorkflowRoleAssignment.create({
      company_id,
      role_id,
      user_email,
      group_id,
      workflow_id,
      assigned_by: user.email,
      assigned_at: new Date().toISOString(),
      expires_at,
      is_active: true
    });

    // Log audit
    await base44.asServiceRole.entities.PermissionAuditLog.create({
      action_type: 'role_assigned',
      role_id,
      role_name: 'WorkflowRole',
      user_email: user_email || group_id,
      changed_by: user.email,
      company_id,
      new_permissions: { assignment_id: assignment.id },
      reason: `Assigned ${user_email ? 'user' : 'group'} to workflow role`
    });

    return Response.json({
      success: true,
      assignment
    });
  } catch (error) {
    console.error('Assign workflow role error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});