import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { userId } = await req.json();
    
    if (!userId) {
      return Response.json({ error: "userId required" }, { status: 400 });
    }
    
    // User-Rollen laden
    const roleAssignments = await base44.asServiceRole.entities.UserRoleAssignment.filter({
      user_id: userId,
      is_active: true,
      valid_from: { $lte: new Date().toISOString().split('T')[0] },
      $or: [
        { valid_until: null },
        { valid_until: { $gte: new Date().toISOString().split('T')[0] } }
      ]
    });
    
    // Rollen laden
    const roleIds = roleAssignments.map(ra => ra.role_id);
    const roles = await base44.asServiceRole.entities.Role.filter({
      id: { $in: roleIds },
      is_active: true
    });
    
    // Permissions sammeln
    let allPermissionIds = [];
    roles.forEach(role => {
      if (role.permissions) {
        allPermissionIds = [...allPermissionIds, ...role.permissions];
      }
    });
    
    const permissions = await base44.asServiceRole.entities.Permission.filter({
      id: { $in: allPermissionIds },
      is_active: true
    });
    
    // Field Permissions laden
    const fieldPermissions = await base44.asServiceRole.entities.FieldPermission.filter({
      permission_id: { $in: allPermissionIds }
    });
    
    // Building restrictions sammeln
    const buildingRestrictions = [];
    roleAssignments.forEach(ra => {
      if (ra.building_restrictions) {
        buildingRestrictions.push(...ra.building_restrictions);
      }
    });
    
    return Response.json({
      success: true,
      roles: roles.map(r => ({
        id: r.id,
        name: r.name,
        category: r.category,
        description: r.description
      })),
      permissions: permissions.map(p => ({
        id: p.id,
        code: p.code,
        name: p.name,
        module: p.module,
        resource: p.resource,
        action: p.action
      })),
      fieldPermissions: fieldPermissions.map(fp => ({
        entity_name: fp.entity_name,
        field_name: fp.field_name,
        access_level: fp.access_level
      })),
      buildingRestrictions: buildingRestrictions.length > 0 ? buildingRestrictions : null,
      hasWildcard: permissions.some(p => p.code === '*')
    });
    
  } catch (error) {
    console.error("Get user roles error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});