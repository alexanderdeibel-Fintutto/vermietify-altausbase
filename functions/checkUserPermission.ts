import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { userId, action, resource, resourceId, fieldName } = await req.json();
    
    if (!userId || !action || !resource) {
      return Response.json({ error: "userId, action, and resource required" }, { status: 400 });
    }
    
    // User-Rollen und Permissions abrufen
    const userPermsResponse = await base44.asServiceRole.functions.invoke('getUserRolesAndPermissions', {
      userId
    });
    const userPermissions = userPermsResponse.data;
    
    // Wildcard check
    if (userPermissions.hasWildcard) {
      return Response.json({
        success: true,
        hasPermission: true,
        details: {
          reason: 'User has wildcard permission (*)',
          matchedPermissions: ['*']
        }
      });
    }
    
    // Permission code check
    const permissionCode = `${resource}_${action}`;
    const matchedPerms = userPermissions.permissions.filter(p => 
      p.code === permissionCode || 
      p.code === `${resource}_all` ||
      (p.resource === resource && p.action === action)
    );
    
    if (matchedPerms.length === 0) {
      return Response.json({
        success: true,
        hasPermission: false,
        details: {
          reason: `No matching permission found for ${permissionCode}`,
          matchedPermissions: []
        }
      });
    }
    
    // Building restriction check
    if (resourceId && resource === "buildings" && userPermissions.buildingRestrictions) {
      if (!userPermissions.buildingRestrictions.includes(resourceId)) {
        return Response.json({
          success: true,
          hasPermission: false,
          details: {
            reason: 'Building restriction - access denied to this specific building',
            matchedPermissions: matchedPerms.map(p => p.code)
          }
        });
      }
    }
    
    // Field permission check
    if (fieldName) {
      const fieldPerm = userPermissions.fieldPermissions.find(fp => 
        fp.entity_name === resource && fp.field_name === fieldName
      );
      
      if (!fieldPerm) {
        return Response.json({
          success: true,
          hasPermission: false,
          details: {
            reason: `No field permission for ${fieldName}`,
            matchedPermissions: matchedPerms.map(p => p.code)
          }
        });
      }
      
      const levelMap = {
        'read': ['read', 'write', 'admin'],
        'write': ['write', 'admin'],
        'admin': ['admin']
      };
      
      const hasFieldAccess = levelMap[action]?.includes(fieldPerm.access_level);
      
      return Response.json({
        success: true,
        hasPermission: hasFieldAccess,
        details: {
          reason: hasFieldAccess 
            ? `Field access granted (${fieldPerm.access_level})` 
            : `Insufficient field access level (${fieldPerm.access_level})`,
          matchedPermissions: matchedPerms.map(p => p.code)
        }
      });
    }
    
    return Response.json({
      success: true,
      hasPermission: true,
      details: {
        reason: 'Permission granted',
        matchedPermissions: matchedPerms.map(p => p.code)
      }
    });
    
  } catch (error) {
    console.error("Check user permission error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});