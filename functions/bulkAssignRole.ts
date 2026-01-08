import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }
    
    const { userIds, roleId, validFrom, validUntil, sendNotification = true } = await req.json();
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0 || !roleId) {
      return Response.json({ error: "userIds array and roleId required" }, { status: 400 });
    }
    
    const role = await base44.asServiceRole.entities.Role.filter({ id: roleId });
    if (!role || role.length === 0) {
      return Response.json({ error: "Role not found" }, { status: 404 });
    }
    
    const results = {
      successful: [],
      failed: []
    };
    
    for (const userId of userIds) {
      try {
        // Check if assignment already exists
        const existing = await base44.asServiceRole.entities.UserRoleAssignment.filter({
          user_id: userId,
          role_id: roleId,
          is_active: true
        });
        
        if (existing.length > 0) {
          results.failed.push({ userId, reason: 'Already assigned' });
          continue;
        }
        
        // Create assignment
        await base44.asServiceRole.entities.UserRoleAssignment.create({
          user_id: userId,
          role_id: roleId,
          building_restrictions: null,
          valid_from: validFrom || new Date().toISOString().split('T')[0],
          valid_until: validUntil || null,
          assigned_by: user.id,
          notes: 'Bulk assignment',
          is_active: true
        });
        
        // Send notification
        if (sendNotification) {
          await base44.asServiceRole.functions.invoke('sendPermissionChangeNotification', {
            userId,
            changeType: 'role_assigned',
            details: { roleName: role[0].name }
          });
        }
        
        results.successful.push(userId);
      } catch (error) {
        results.failed.push({ userId, reason: error.message });
      }
    }
    
    return Response.json({
      success: true,
      results,
      message: `Assigned role to ${results.successful.length}/${userIds.length} users`
    });
    
  } catch (error) {
    console.error("Bulk assign role error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});