import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Initializes the role and permission system with default roles
 * Should be called once during app setup
 */
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Admin access required' }, { status: 403 });
        }

        console.log('Initializing role and permission system');

        // Define default permissions
        const permissions = [
            // Financial Data Permissions
            {
                permission_code: 'view_financial_data',
                permission_name: 'View Financial Data',
                category: 'financial_data',
                resource: 'FinancialReport',
                actions: ['read'],
                is_system: true
            },
            {
                permission_code: 'create_financial_data',
                permission_name: 'Create Financial Data',
                category: 'financial_data',
                resource: 'FinancialReport',
                actions: ['create'],
                is_system: true
            },
            {
                permission_code: 'edit_financial_data',
                permission_name: 'Edit Financial Data',
                category: 'financial_data',
                resource: 'FinancialReport',
                actions: ['update'],
                is_system: true
            },
            {
                permission_code: 'delete_financial_data',
                permission_name: 'Delete Financial Data',
                category: 'financial_data',
                resource: 'FinancialReport',
                actions: ['delete'],
                is_system: true
            },
            {
                permission_code: 'export_financial_data',
                permission_name: 'Export Financial Data',
                category: 'financial_data',
                resource: 'FinancialReport',
                actions: ['export'],
                is_system: true
            },
            // Budget Permissions
            {
                permission_code: 'view_budgets',
                permission_name: 'View Budgets',
                category: 'financial_data',
                resource: 'RollingBudget',
                actions: ['read'],
                is_system: true
            },
            {
                permission_code: 'manage_budgets',
                permission_name: 'Manage Budgets',
                category: 'financial_data',
                resource: 'RollingBudget',
                actions: ['create', 'update', 'delete'],
                is_system: true
            },
            // Request Permissions
            {
                permission_code: 'view_requests',
                permission_name: 'View Budget Requests',
                category: 'financial_data',
                resource: 'BudgetRequest',
                actions: ['read'],
                is_system: true
            },
            {
                permission_code: 'create_requests',
                permission_name: 'Create Budget Requests',
                category: 'financial_data',
                resource: 'BudgetRequest',
                actions: ['create'],
                is_system: true
            },
            {
                permission_code: 'approve_requests',
                permission_name: 'Approve Budget Requests',
                category: 'financial_data',
                resource: 'BudgetRequest',
                actions: ['update'],
                is_system: true
            },
            // User Management Permissions
            {
                permission_code: 'manage_users',
                permission_name: 'Manage Users',
                category: 'user_management',
                resource: 'User',
                actions: ['read', 'update', 'delete'],
                is_system: true
            },
            {
                permission_code: 'manage_roles',
                permission_name: 'Manage Roles',
                category: 'user_management',
                resource: 'UserRole',
                actions: ['create', 'read', 'update', 'delete'],
                is_system: true
            },
            // Audit & Admin Permissions
            {
                permission_code: 'view_audit_logs',
                permission_name: 'View Audit Logs',
                category: 'audit',
                resource: 'UserAuditLog',
                actions: ['read'],
                is_system: true
            }
        ];

        // Create permissions
        const createdPermissions = [];
        for (const perm of permissions) {
            try {
                const existing = await base44.asServiceRole.entities.UserPermission.filter(
                    { permission_code: perm.permission_code },
                    null,
                    1
                );

                if (existing.length === 0) {
                    const created = await base44.asServiceRole.entities.UserPermission.create(perm);
                    createdPermissions.push(created.id);
                }
            } catch (error) {
                console.warn(`Failed to create permission ${perm.permission_code}:`, error.message);
            }
        }

        // Define default roles
        const roles = [
            {
                role_name: 'Admin',
                description: 'Full system access with all privileges',
                role_type: 'system',
                permission_profile: 'admin',
                can_manage_users: true,
                can_manage_roles: true,
                can_view_audit_log: true,
                can_access_financial_data: true,
                can_export_data: true,
                can_delete_data: true,
                permissions: permissions.map(p => p.permission_code),
                is_active: true
            },
            {
                role_name: 'Manager',
                description: 'Can manage budgets and approve requests',
                role_type: 'system',
                permission_profile: 'manager',
                can_manage_users: false,
                can_manage_roles: false,
                can_view_audit_log: true,
                can_access_financial_data: true,
                can_export_data: true,
                can_delete_data: false,
                permissions: [
                    'view_financial_data',
                    'create_financial_data',
                    'edit_financial_data',
                    'export_financial_data',
                    'view_budgets',
                    'manage_budgets',
                    'view_requests',
                    'approve_requests',
                    'view_audit_logs'
                ],
                is_active: true
            },
            {
                role_name: 'User',
                description: 'Can view financial data and create requests',
                role_type: 'system',
                permission_profile: 'user',
                can_manage_users: false,
                can_manage_roles: false,
                can_view_audit_log: false,
                can_access_financial_data: true,
                can_export_data: false,
                can_delete_data: false,
                permissions: [
                    'view_financial_data',
                    'view_budgets',
                    'view_requests',
                    'create_requests'
                ],
                is_active: true
            }
        ];

        // Create roles
        const createdRoles = [];
        for (const role of roles) {
            try {
                const existing = await base44.asServiceRole.entities.UserRole.filter(
                    { role_name: role.role_name },
                    null,
                    1
                );

                if (existing.length === 0) {
                    const created = await base44.asServiceRole.entities.UserRole.create(role);
                    createdRoles.push(created);
                }
            } catch (error) {
                console.warn(`Failed to create role ${role.role_name}:`, error.message);
            }
        }

        return Response.json({
            success: true,
            permissions_created: createdPermissions.length,
            roles_created: createdRoles.length,
            message: 'Role and permission system initialized'
        });

    } catch (error) {
        console.error('Error initializing role system:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});