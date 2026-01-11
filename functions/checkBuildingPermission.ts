import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { building_id, required_level = 'read' } = await req.json();

        if (!building_id) {
            return Response.json({ error: 'building_id required' }, { status: 400 });
        }

        // Admins have full access
        if (user.role === 'admin') {
            return Response.json({
                allowed: true,
                permission_level: 'write',
                message: 'Admin user'
            });
        }

        // Check specific building permissions
        const permissions = await base44.entities.BuildingPermission.filter({
            building_id: building_id,
            user_email: user.email
        });

        if (permissions.length === 0) {
            return Response.json({
                allowed: false,
                permission_level: 'none',
                message: 'No permission for this building'
            }, { status: 403 });
        }

        const permission = permissions[0];
        const hasAccess = required_level === 'read' 
            ? permission.permission_level === 'read' || permission.permission_level === 'write'
            : permission.permission_level === 'write';

        if (!hasAccess) {
            return Response.json({
                allowed: false,
                permission_level: permission.permission_level,
                message: `Insufficient permissions. Required: ${required_level}, Got: ${permission.permission_level}`
            }, { status: 403 });
        }

        return Response.json({
            allowed: true,
            permission_level: permission.permission_level,
            message: 'Access granted'
        });

    } catch (error) {
        console.error('Permission check error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});