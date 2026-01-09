import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Assigns a role to a user
 */
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Admin access required' }, { status: 403 });
        }

        const { target_email, role_name } = await req.json();

        if (!target_email || !role_name) {
            return Response.json({ error: 'target_email and role_name required' }, { status: 400 });
        }

        // Get the role
        const roles = await base44.asServiceRole.entities.UserRole.filter(
            { role_name: role_name },
            null,
            1
        );

        if (roles.length === 0) {
            return Response.json({ error: 'Role not found' }, { status: 404 });
        }

        const role = roles[0];

        // Create or update user role assignment
        const assignments = await base44.asServiceRole.entities.UserRoleAssignment.filter(
            { user_email: target_email },
            null,
            1
        );

        if (assignments.length > 0) {
            // Update existing assignment
            await base44.asServiceRole.entities.UserRoleAssignment.update(assignments[0].id, {
                role_id: role.id,
                role_name: role.role_name,
                assigned_at: new Date().toISOString()
            });
        } else {
            // Create new assignment
            await base44.asServiceRole.entities.UserRoleAssignment.create({
                user_email: target_email,
                role_id: role.id,
                role_name: role.role_name,
                assigned_at: new Date().toISOString()
            });
        }

        // Log action
        await base44.asServiceRole.entities.UserAuditLog.create({
            user_email: user.email,
            action: 'role_assignment',
            resource_type: 'UserRole',
            resource_id: role.id,
            resource_name: role.role_name,
            changes: {
                target_user: target_email,
                new_role: role.role_name
            },
            timestamp: new Date().toISOString(),
            status: 'success'
        });

        return Response.json({
            success: true,
            user_email: target_email,
            role: role.role_name,
            permissions: role.permissions
        });

    } catch (error) {
        console.error('Error assigning role:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});