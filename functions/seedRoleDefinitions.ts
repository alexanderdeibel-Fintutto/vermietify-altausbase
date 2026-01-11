import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Forbidden' }, { status: 403 });
        }

        const rolesToCreate = [
            {
                role_name: 'admin',
                description: 'Vollständiger Zugriff auf alle Gebäude und sensible Daten.',
                building_access: 'all',
                default_field_access: 'write',
                is_system_role: true,
                allowed_actions: ['view_financials', 'create_tenants', 'manage_permissions', 'edit_contracts']
            },
            {
                role_name: 'property_manager',
                description: 'Verwaltet zugewiesene Gebäude. Kann Mieter und Verträge verwalten, aber keine Finanzierungsdaten sehen.',
                building_access: 'assigned',
                default_field_access: 'read',
                is_system_role: true,
                allowed_actions: ['view_tenants', 'create_maintenance_tasks', 'view_communications']
            },
            {
                role_name: 'owner',
                description: 'Eigentumsrolle. Lesezugriff auf eigene Gebäude und Finanzübersichten.',
                building_access: 'own',
                default_field_access: 'read',
                is_system_role: true,
                allowed_actions: ['view_financials', 'view_reports']
            },
            {
                role_name: 'tenant',
                description: 'Mieterrolle. Eingeschränkter Zugriff auf eigene Mietinformationen.',
                building_access: 'own',
                default_field_access: 'minimal',
                is_system_role: true,
                allowed_actions: ['view_own_contract', 'view_announcements', 'submit_maintenance_request']
            }
        ];

        // Check existing roles
        const existingRoles = await base44.asServiceRole.entities.RoleDefinition.list();
        const existingRoleNames = new Set(existingRoles.map(r => r.role_name));

        // Create missing roles
        const createdRoles = [];
        for (const role of rolesToCreate) {
            if (!existingRoleNames.has(role.role_name)) {
                const created = await base44.asServiceRole.entities.RoleDefinition.create(role);
                createdRoles.push(created);
            }
        }

        return Response.json({
            success: true,
            message: `${createdRoles.length} roles created`,
            created_roles: createdRoles.map(r => r.role_name)
        });

    } catch (error) {
        console.error('Seed roles error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});