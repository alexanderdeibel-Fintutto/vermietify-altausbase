import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Checks if a user has a specific permission
 */
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { permission_code } = await req.json();

        if (!permission_code) {
            return Response.json({ error: 'permission_code required' }, { status: 400 });
        }

        // Admins have all permissions
        if (user.role === 'admin') {
            return Response.json({ has_permission: true });
        }

        // Get user's role assignment
        const assignments = await base44.asServiceRole.entities.UserRoleAssignment.filter(
            { user_email: user.email },
            null,
            1
        );

        if (assignments.length === 0) {
            // Default to User role
            const defaultRoles = await base44.asServiceRole.entities.UserRole.filter(
                { role_name: 'User' },
                null,
                1
            );

            if (defaultRoles.length === 0) {
                return Response.json({ has_permission: false });
            }

            const role = defaultRoles[0];
            const hasPermission = (role.permissions || []).includes(permission_code);
            return Response.json({ has_permission: hasPermission });
        }

        const assignment = assignments[0];
        const roles = await base44.asServiceRole.entities.UserRole.filter(
            { id: assignment.role_id },
            null,
            1
        );

        if (roles.length === 0) {
            return Response.json({ has_permission: false });
        }

        const role = roles[0];
        const hasPermission = (role.permissions || []).includes(permission_code);

        return Response.json({
            has_permission: hasPermission,
            user_role: role.role_name,
            user_permissions: role.permissions
        });

    } catch (error) {
        console.error('Error checking permission:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});