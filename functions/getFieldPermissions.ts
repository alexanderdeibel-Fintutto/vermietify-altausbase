import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { entity_type, user_role } = await req.json();

        if (!entity_type || !user_role) {
            return Response.json({ error: 'entity_type and user_role required' }, { status: 400 });
        }

        // Get role definition
        const roleDefinitions = await base44.entities.RoleDefinition.filter({ role_name: user_role });
        const roleDefinition = roleDefinitions[0];

        if (!roleDefinition) {
            return Response.json({ error: 'Role not found' }, { status: 404 });
        }

        // Get field permissions for this role and entity type
        const fieldPermissions = await base44.entities.FieldPermission.filter({
            role: user_role,
            entity_type: entity_type
        });

        // Build field access map
        const fieldAccessMap = {};
        fieldPermissions.forEach(perm => {
            fieldAccessMap[perm.field_name] = {
                access_level: perm.access_level,
                is_sensitive: perm.is_sensitive,
                description: perm.description
            };
        });

        return Response.json({
            role: user_role,
            entity_type: entity_type,
            default_access: roleDefinition.default_field_access,
            field_permissions: fieldAccessMap,
            allowed_actions: roleDefinition.allowed_actions || []
        });

    } catch (error) {
        console.error('Get field permissions error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});