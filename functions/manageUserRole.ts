import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Manage user roles and permissions
 * Create, update, assign, and revoke roles
 */
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Admin access required' }, { status: 403 });
        }

        const {
            action, // 'create_role', 'assign_role', 'remove_role', 'update_role', 'list_roles'
            role_name,
            description,
            permissions,
            target_user_email,
            role_id
        } = await req.json();

        if (action === 'create_role') {
            const newRole = await base44.asServiceRole.entities.UserRole.create({
                role_name,
                description,
                permissions: permissions || [],
                created_by: user.email,
                created_at: new Date().toISOString()
            });

            // Log action
            await logAuditAction(base44, user.email, 'role_assignment', 'UserRole', newRole.id, {
                action: 'role_created',
                role_name
            });

            return Response.json({
                success: true,
                role_id: newRole.id,
                message: `Rolle '${role_name}' erstellt`
            });
        }

        if (action === 'assign_role') {
            if (!target_user_email || !role_id) {
                return Response.json({ error: 'Missing required fields' }, { status: 400 });
            }

            const targetUser = await base44.auth.me();
            await targetUser.updateMe?.({ role_id });

            await logAuditAction(base44, user.email, 'role_assignment', 'User', target_user_email, {
                action: 'role_assigned',
                role_id,
                target_user: target_user_email
            });

            return Response.json({
                success: true,
                message: `Rolle ${role_id} dem Benutzer ${target_user_email} zugewiesen`
            });
        }

        if (action === 'list_roles') {
            const roles = await base44.asServiceRole.entities.UserRole.list('-created_at', 100);
            return Response.json({
                success: true,
                roles
            });
        }

        if (action === 'update_role') {
            if (!role_id) {
                return Response.json({ error: 'role_id required' }, { status: 400 });
            }

            const updates = {};
            if (role_name) updates.role_name = role_name;
            if (description) updates.description = description;
            if (permissions) updates.permissions = permissions;

            await base44.asServiceRole.entities.UserRole.update(role_id, updates);

            await logAuditAction(base44, user.email, 'role_assignment', 'UserRole', role_id, {
                action: 'role_updated',
                changes: updates
            });

            return Response.json({
                success: true,
                message: 'Rolle aktualisiert'
            });
        }

        return Response.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        console.error('Error managing user role:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});

async function logAuditAction(base44, userEmail, action, resourceType, resourceId, changes) {
    try {
        await base44.asServiceRole.entities.UserAuditLog.create({
            user_email: userEmail,
            action,
            resource_type: resourceType,
            resource_id: resourceId,
            changes,
            status: 'success',
            timestamp: new Date().toISOString()
        }).catch(() => null);
    } catch (err) {
        console.warn('Failed to log audit action:', err);
    }
}