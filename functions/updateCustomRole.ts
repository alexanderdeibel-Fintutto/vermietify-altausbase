import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Updates an existing custom role
 */
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Admin access required' }, { status: 403 });
        }

        const {
            role_id,
            description,
            permission_profile,
            permissions = [],
            granular_permissions = {},
            is_active
        } = await req.json();

        if (!role_id) {
            return Response.json({ error: 'role_id required' }, { status: 400 });
        }

        console.log(`Updating role: ${role_id}`);

        // Fetch the role
        const roles = await base44.asServiceRole.entities.UserRole.filter(
            { id: role_id },
            null,
            1
        );

        if (roles.length === 0) {
            return Response.json({ error: 'Role not found' }, { status: 404 });
        }

        const role = roles[0];

        // Store old values for audit
        const oldValues = {
            permission_profile: role.permission_profile,
            permissions_count: role.permissions?.length || 0
        };

        // Update role
        const updateData = {};
        if (description !== undefined) updateData.description = description;
        if (permission_profile !== undefined) {
            updateData.permission_profile = permission_profile;
            updateData.can_manage_users = permission_profile === 'admin';
            updateData.can_manage_roles = permission_profile === 'admin';
            updateData.can_view_audit_log = permission_profile === 'admin' || permission_profile === 'manager';
            updateData.can_manage_departments = permission_profile === 'admin' || permission_profile === 'manager';
            updateData.can_access_financial_data = permission_profile !== 'viewer';
            updateData.can_export_data = permission_profile !== 'viewer';
            updateData.can_delete_data = permission_profile === 'admin';
        }
        if (permissions.length > 0) updateData.permissions = permissions;
        if (Object.keys(granular_permissions).length > 0) updateData.granular_permissions = granular_permissions;
        if (is_active !== undefined) updateData.is_active = is_active;

        await base44.asServiceRole.entities.UserRole.update(role_id, updateData);

        // Log action
        await base44.asServiceRole.entities.UserAuditLog.create({
            user_email: user.email,
            action: 'role_updated',
            resource_type: 'UserRole',
            resource_id: role_id,
            resource_name: role.role_name,
            changes: {
                old: oldValues,
                new: {
                    permission_profile: permission_profile || oldValues.permission_profile,
                    permissions_count: permissions.length || oldValues.permissions_count
                }
            },
            timestamp: new Date().toISOString(),
            status: 'success'
        });

        return Response.json({
            success: true,
            message: `Role updated successfully`
        });

    } catch (error) {
        console.error('Error updating role:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});