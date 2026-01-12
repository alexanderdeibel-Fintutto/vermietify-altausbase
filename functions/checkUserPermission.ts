import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { module, action, building_id } = await req.json();

    // Admins always have permission
    if (user.role === 'admin') {
      return Response.json({ has_permission: true, is_admin: true });
    }

    // Get user's role assignments
    const userAccess = await base44.entities.UserMandantAccess.filter({
      user_email: user.email,
      ist_aktiv: true
    });

    // Check feature permission
    let hasFeaturePermission = false;
    for (const access of userAccess) {
      const permissions = JSON.parse(access.berechtigungen || '{}');
      if (permissions[module]?.includes(action)) {
        hasFeaturePermission = true;
        break;
      }
    }

    if (!hasFeaturePermission) {
      return Response.json({ 
        has_permission: false, 
        reason: 'Missing feature permission',
        required_module: module,
        required_action: action
      });
    }

    // Check building access if building_id provided
    if (building_id) {
      let hasBuildingAccess = false;
      
      for (const access of userAccess) {
        const allowedBuildings = JSON.parse(access.gebaeude_zugriff || '[]');
        
        // Empty array means access to all buildings
        if (allowedBuildings.length === 0) {
          hasBuildingAccess = true;
          break;
        }
        
        // Check if building is in allowed list
        if (allowedBuildings.includes(building_id)) {
          hasBuildingAccess = true;
          break;
        }
      }

      if (!hasBuildingAccess) {
        return Response.json({ 
          has_permission: false, 
          reason: 'No access to this building',
          building_id
        });
      }
    }

    return Response.json({ has_permission: true });
  } catch (error) {
    console.error('Permission check error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});