import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }
    
    const { userId, roleId, buildingRestrictions, validFrom, validUntil, notes } = await req.json();
    
    if (!userId || !roleId) {
      return Response.json({ error: "userId and roleId required" }, { status: 400 });
    }
    
    // Prüfen ob User existiert
    const targetUser = await base44.asServiceRole.entities.User.filter({ id: userId });
    if (targetUser.length === 0) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }
    
    // Prüfen ob Rolle existiert
    const role = await base44.asServiceRole.entities.Role.filter({ id: roleId });
    if (role.length === 0) {
      return Response.json({ error: "Role not found" }, { status: 404 });
    }
    
    // Prüfen ob bereits zugewiesen
    const existing = await base44.asServiceRole.entities.UserRoleAssignment.filter({
      user_id: userId,
      role_id: roleId,
      is_active: true
    });
    
    if (existing.length > 0) {
      return Response.json({ error: "Role already assigned to user" }, { status: 400 });
    }
    
    // Rolle zuweisen
    const assignment = await base44.asServiceRole.entities.UserRoleAssignment.create({
      user_id: userId,
      role_id: roleId,
      building_restrictions: buildingRestrictions || null,
      valid_from: validFrom || new Date().toISOString().split('T')[0],
      valid_until: validUntil || null,
      assigned_by: user.id,
      notes: notes || '',
      is_active: true
    });
    
    // Activity Log
    await base44.asServiceRole.entities.UserActivity.create({
      user_id: user.id,
      action_type: 'entity_update',
      resource: 'UserRoleAssignment',
      resource_id: assignment.id,
      details: {
        target_user: userId,
        role: role[0].name,
        action: 'role_assigned'
      },
      ip_address: req.headers.get('x-forwarded-for') || 'unknown',
      user_agent: req.headers.get('user-agent')
    });
    
    return Response.json({
      success: true,
      assignment,
      message: `Role ${role[0].name} assigned to user`
    });
    
  } catch (error) {
    console.error("Assign role error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});