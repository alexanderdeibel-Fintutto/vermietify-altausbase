import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }
    
    const { operations } = await req.json();
    
    if (!operations || !Array.isArray(operations)) {
      return Response.json({ error: "operations array required" }, { status: 400 });
    }
    
    const results = {
      successful: [],
      failed: []
    };
    
    for (const op of operations) {
      try {
        const { userId, roleId, action, validFrom, validUntil } = op;
        
        if (action === 'assign') {
          // Check if already assigned
          const existing = await base44.asServiceRole.entities.UserRoleAssignment.filter({
            user_id: userId,
            role_id: roleId,
            is_active: true
          });
          
          if (existing.length > 0) {
            results.failed.push({ userId, roleId, reason: 'Already assigned' });
            continue;
          }
          
          await base44.asServiceRole.entities.UserRoleAssignment.create({
            user_id: userId,
            role_id: roleId,
            building_restrictions: null,
            valid_from: validFrom || new Date().toISOString().split('T')[0],
            valid_until: validUntil || null,
            assigned_by: user.id,
            notes: 'Bulk operation',
            is_active: true
          });
          
          results.successful.push({ userId, roleId, action: 'assigned' });
        } else if (action === 'remove') {
          const assignments = await base44.asServiceRole.entities.UserRoleAssignment.filter({
            user_id: userId,
            role_id: roleId,
            is_active: true
          });
          
          for (const assignment of assignments) {
            await base44.asServiceRole.entities.UserRoleAssignment.update(assignment.id, {
              is_active: false
            });
          }
          
          results.successful.push({ userId, roleId, action: 'removed' });
        }
      } catch (error) {
        results.failed.push({ 
          userId: op.userId, 
          roleId: op.roleId, 
          reason: error.message 
        });
      }
    }
    
    return Response.json({
      success: true,
      results,
      message: `${results.successful.length}/${operations.length} operations successful`
    });
    
  } catch (error) {
    console.error("Bulk update user roles error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});