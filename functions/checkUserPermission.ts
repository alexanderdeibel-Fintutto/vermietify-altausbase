import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { userId, action, resource, resourceId, fieldName } = await req.json();
    
    // 1. User-Rollen laden
    const today = new Date().toISOString().split('T')[0];
    const userRoles = await base44.entities.UserRoleAssignment.filter({
      user_id: userId,
      is_active: true,
      valid_from: { $lte: today }
    });
    
    // Filter valid_until
    const activeRoles = userRoles.filter(r => !r.valid_until || r.valid_until >= today);
    
    if (activeRoles.length === 0) {
      return Response.json({ hasPermission: false, reason: "No active roles" });
    }
    
    // 2. Berechtigungen sammeln
    const roleIds = activeRoles.map(r => r.role_id);
    const roles = await base44.asServiceRole.entities.Role.filter({
      id: { $in: roleIds },
      is_active: true
    });
    
    let allPermissionIds = [];
    for (const role of roles) {
      if (role.permissions && role.permissions.length > 0) {
        allPermissionIds = [...allPermissionIds, ...role.permissions];
      }
    }
    
    // Wildcard check
    if (allPermissionIds.includes("*")) {
      return Response.json({ 
        hasPermission: true, 
        reason: "Wildcard permission",
        roles: roles.map(r => r.name)
      });
    }
    
    // 3. Permissions laden
    const permissions = await base44.asServiceRole.entities.Permission.filter({
      id: { $in: allPermissionIds },
      is_active: true
    });
    
    // 4. Permission-Check
    const permissionCode = `${resource}_${action}`;
    const hasBasicPermission = permissions.some(p => 
      p.code === permissionCode || p.code === `${resource}_all`
    );
    
    if (!hasBasicPermission) {
      return Response.json({ hasPermission: false, reason: "No basic permission" });
    }
    
    // 5. Objekt-Level Check (Building-Einschränkungen)
    if (resourceId && resource === "buildings") {
      const hasObjectAccess = activeRoles.some(role => {
        if (!role.building_restrictions || role.building_restrictions.length === 0) {
          return true; // Keine Einschränkungen = alle Gebäude
        }
        return role.building_restrictions.includes(resourceId);
      });
      
      if (!hasObjectAccess) {
        return Response.json({ hasPermission: false, reason: "No object access" });
      }
    }
    
    // 6. Feld-Level Check
    if (fieldName) {
      const fieldPermissions = await base44.asServiceRole.entities.FieldPermission.filter({
        permission_id: { $in: allPermissionIds },
        entity_name: resource,
        field_name: fieldName
      });
      
      const hasFieldAccess = fieldPermissions.some(fp => {
        switch(action) {
          case 'read': return ['read', 'write', 'admin'].includes(fp.access_level);
          case 'write': return ['write', 'admin'].includes(fp.access_level);
          case 'admin': return fp.access_level === 'admin';
          default: return false;
        }
      });
      
      if (fieldPermissions.length > 0 && !hasFieldAccess) {
        return Response.json({ hasPermission: false, reason: "No field access" });
      }
    }
    
    return Response.json({ 
      hasPermission: true, 
      permissions: permissions.map(p => p.code),
      roles: roles.map(r => r.name)
    });
    
  } catch (error) {
    console.error("Permission check error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});