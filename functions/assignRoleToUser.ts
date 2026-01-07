import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    const { userId, roleId, buildingRestrictions, validFrom, validUntil, notes } = await req.json();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: "Only admin can assign roles" }, { status: 403 });
    }
    
    // Rolle existiert?
    const roles = await base44.asServiceRole.entities.Role.filter({ id: roleId });
    if (roles.length === 0) {
      return Response.json({ error: "Role not found" }, { status: 404 });
    }
    
    // User existiert?
    const users = await base44.asServiceRole.entities.User.filter({ id: userId });
    if (users.length === 0) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }
    
    // Rollen-Zuweisung erstellen
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
    
    return Response.json({ 
      success: true,
      assignment,
      message: "Role assigned successfully" 
    });
    
  } catch (error) {
    console.error("Assign role error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});