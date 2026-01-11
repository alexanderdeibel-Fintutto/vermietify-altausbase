import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Initialize roles
        console.log('Initializing role definitions...');
        const rolesResponse = await base44.asServiceRole.functions.invoke('seedRoleDefinitions', {});
        console.log('Roles initialized:', rolesResponse.created_roles);

        // Initialize field permissions
        console.log('Initializing field permissions...');
        const permsResponse = await base44.asServiceRole.functions.invoke('seedFieldPermissions', {});
        console.log('Field permissions initialized:', permsResponse.created_count);

        return Response.json({
            success: true,
            message: 'Permission system initialized',
            roles_created: rolesResponse.created_roles,
            field_permissions_created: permsResponse.created_count
        });

    } catch (error) {
        console.error('Initialize permission system error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});