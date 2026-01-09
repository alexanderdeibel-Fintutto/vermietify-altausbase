import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Creates a custom role with specified permissions
 */
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Admin access required' }, { status: 403 });
        }

        const {
            role_name,
            description,
            permission_profile,
            permissions = [],
            granular_permissions = {}
        } = await req.json();

        if (!role_name) {
            return Response.json({ error: 'role_name required' }, { status: 400 });
        }

        console.log(`Creating custom role: ${role_name}`);

        // Check if role already exists
        const existingRoles = await base44.asServiceRole.entities.UserRole.filter(
            { role_name: role_name },
            null,
            1
        );

        if (existingRoles.length > 0) {
            return Response.json({ error: 'Role already exists' }, { status: 409 });
        }

        // Create the role
        const role = await base44.asServiceRole.entities.UserRole.create({
            role_name,
            description,
            role_type: 'custom',
            permission_profile: permission_profile || 'custom',
            permissions,
            granular_permissions,
            can_manage_users: permission_profile === 'admin',
            can_manage_roles: permission_profile === 'admin',
            can_view_audit_log: permission_profile === 'admin' || permission_profile === 'manager',
            can_manage_departments: permission_profile === 'admin' || permission_profile === 'manager',
            can_access_financial_data: permission_profile !== 'viewer',
            can_export_data: permission_profile !== 'viewer',
            can_delete_data: permission_profile === 'admin',
            is_active: true,
            created_by: user.email,
            created_at: new Date().toISOString()
        });

        // Log action
        await base44.asServiceRole.entities.UserAuditLog.create({
            user_email: user.email,
            action: 'role_created',
            resource_type: 'UserRole',
            resource_id: role.id,
            resource_name: role_name,
            changes: {
                permission_profile,
                permissions_count: permissions.length
            },
            timestamp: new Date().toISOString(),
            status: 'success'
        });

        return Response.json({
            success: true,
            role: role,
            message: `Role "${role_name}" created successfully`
        });

    } catch (error) {
        console.error('Error creating custom role:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});