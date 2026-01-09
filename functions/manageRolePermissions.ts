import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const PERMISSION_PROFILES = {
  admin: {
    description: 'Vollständiger Zugriff auf alle Ressourcen',
    permissions: {
      'financial_data': ['create', 'read', 'update', 'delete', 'export'],
      'reports': ['create', 'read', 'update', 'delete', 'export'],
      'tax_forms': ['create', 'read', 'update', 'delete'],
      'users': ['create', 'read', 'update', 'delete'],
      'settings': ['create', 'read', 'update', 'delete'],
      'audit_log': ['read', 'export']
    }
  },
  manager: {
    description: 'Verwaltung von Teaminhalte und Berichten',
    permissions: {
      'financial_data': ['read', 'update', 'export'],
      'reports': ['create', 'read', 'update', 'export'],
      'team_members': ['read', 'update'],
      'audit_log': ['read']
    }
  },
  user: {
    description: 'Standard-Zugriff auf zugewiesene Ressourcen',
    permissions: {
      'financial_data': ['read', 'export'],
      'reports': ['read', 'export'],
      'personal_settings': ['read', 'update']
    }
  },
  viewer: {
    description: 'Schreibgeschützter Zugriff',
    permissions: {
      'financial_data': ['read'],
      'reports': ['read']
    }
  }
};

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Admin access required' }, { status: 403 });
        }

        const {
            action,
            role_id,
            permission_profile,
            granular_permissions,
            entity_name,
            actions_allowed
        } = await req.json();

        if (action === 'set_profile') {
            const profile = PERMISSION_PROFILES[permission_profile];
            if (!profile) {
                return Response.json({ error: 'Invalid profile' }, { status: 400 });
            }

            await base44.asServiceRole.entities.UserRole.update(role_id, {
                permission_profile,
                granular_permissions: profile.permissions
            });

            await logAuditAction(base44, user.email, 'permission_grant', 'UserRole', role_id, {
                action: 'profile_assigned',
                profile: permission_profile
            });

            return Response.json({
                success: true,
                message: `Profil '${permission_profile}' zugewiesen`,
                permissions: profile.permissions
            });
        }

        if (action === 'set_granular') {
            const role = await base44.asServiceRole.entities.UserRole.list(null, 1)
                .then(roles => roles.find(r => r.id === role_id));

            if (!role) {
                return Response.json({ error: 'Role not found' }, { status: 404 });
            }

            const updated = {
                ...role.granular_permissions,
                [entity_name]: actions_allowed
            };

            await base44.asServiceRole.entities.UserRole.update(role_id, {
                granular_permissions: updated
            });

            await logAuditAction(base44, user.email, 'permission_grant', 'UserRole', role_id, {
                action: 'granular_permission_updated',
                entity: entity_name,
                actions: actions_allowed
            });

            return Response.json({
                success: true,
                message: `Berechtigungen für ${entity_name} aktualisiert`
            });
        }

        if (action === 'get_profiles') {
            return Response.json({
                success: true,
                profiles: Object.entries(PERMISSION_PROFILES).map(([key, val]) => ({
                    id: key,
                    name: key.charAt(0).toUpperCase() + key.slice(1),
                    description: val.description,
                    permissions: val.permissions
                }))
            });
        }

        if (action === 'assign_role_to_member') {
            const { department_member_id, role_id: assignedRoleId } = req.json();

            const role = await base44.asServiceRole.entities.UserRole.list(null, 1)
                .then(roles => roles.find(r => r.id === assignedRoleId));

            if (!role) {
                return Response.json({ error: 'Role not found' }, { status: 404 });
            }

            await base44.asServiceRole.entities.DepartmentMember.update(department_member_id, {
                assigned_role_id: assignedRoleId,
                assigned_role_name: role.role_name
            });

            await logAuditAction(base44, user.email, 'role_assignment', 'DepartmentMember', 
                department_member_id, {
                action: 'role_assigned_to_member',
                role_id: assignedRoleId
            });

            return Response.json({
                success: true,
                message: `Rolle '${role.role_name}' zugewiesen`
            });
        }

        return Response.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        console.error('Error managing role permissions:', error);
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