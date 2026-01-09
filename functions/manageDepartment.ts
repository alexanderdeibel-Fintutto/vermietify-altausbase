import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Manage departments and team structure
 * Create, update, and manage department memberships
 */
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Admin access required' }, { status: 403 });
        }

        const {
            action, // 'create_dept', 'add_member', 'remove_member', 'update_member', 'list_depts'
            department_name,
            department_code,
            description,
            manager_email,
            department_id,
            user_email,
            role_in_department,
            can_approve_expenses
        } = await req.json();

        if (action === 'create_dept') {
            const dept = await base44.asServiceRole.entities.Department.create({
                department_name,
                department_code,
                description,
                manager_email: manager_email || user.email,
                created_by: user.email,
                created_at: new Date().toISOString()
            });

            await logAuditAction(base44, user.email, 'team_join', 'Department', dept.id, {
                action: 'department_created',
                department_name
            });

            return Response.json({
                success: true,
                department_id: dept.id,
                message: `Abteilung '${department_name}' erstellt`
            });
        }

        if (action === 'add_member') {
            if (!department_id || !user_email) {
                return Response.json({ error: 'Missing required fields' }, { status: 400 });
            }

            const member = await base44.asServiceRole.entities.DepartmentMember.create({
                department_id,
                user_email,
                role_in_department: role_in_department || 'member',
                can_approve_expenses: can_approve_expenses || false,
                joined_at: new Date().toISOString()
            });

            // Update member count
            const depts = await base44.asServiceRole.entities.Department.filter(
                { id: department_id },
                null,
                1
            );
            const dept = depts[0];
            if (dept) {
                await base44.asServiceRole.entities.Department.update(department_id, {
                    member_count: (dept.member_count || 0) + 1
                });
            }

            await logAuditAction(base44, user.email, 'team_join', 'DepartmentMember', member.id, {
                action: 'member_added',
                department_id,
                user_email
            });

            return Response.json({
                success: true,
                member_id: member.id,
                message: `Benutzer zur Abteilung hinzugefügt`
            });
        }

        if (action === 'remove_member') {
            if (!department_id || !user_email) {
                return Response.json({ error: 'Missing required fields' }, { status: 400 });
            }

            const members = await base44.asServiceRole.entities.DepartmentMember.filter(
                { department_id, user_email },
                null,
                1
            );

            if (members.length > 0) {
                const member = members[0];
                await base44.asServiceRole.entities.DepartmentMember.update(member.id, {
                    is_active: false,
                    left_at: new Date().toISOString()
                });

                // Update member count
                const depts = await base44.asServiceRole.entities.Department.filter(
                    { id: department_id },
                    null,
                    1
                );
                const dept = depts[0];
                if (dept) {
                    await base44.asServiceRole.entities.Department.update(department_id, {
                        member_count: Math.max(0, (dept.member_count || 1) - 1)
                    });
                }

                await logAuditAction(base44, user.email, 'team_leave', 'DepartmentMember', member.id, {
                    action: 'member_removed',
                    department_id,
                    user_email
                });
            }

            return Response.json({
                success: true,
                message: 'Benutzer aus Abteilung entfernt'
            });
        }

        if (action === 'update_member') {
            if (!department_id || !user_email) {
                return Response.json({ error: 'Missing required fields' }, { status: 400 });
            }

            const members = await base44.asServiceRole.entities.DepartmentMember.filter(
                { department_id, user_email },
                null,
                1
            );

            if (members.length > 0) {
                const member = members[0];
                const updates = {};
                if (role_in_department) updates.role_in_department = role_in_department;
                if (can_approve_expenses !== undefined) updates.can_approve_expenses = can_approve_expenses;

                await base44.asServiceRole.entities.DepartmentMember.update(member.id, updates);

                await logAuditAction(base44, user.email, 'settings_change', 'DepartmentMember', member.id, {
                    action: 'member_updated',
                    changes: updates
                });
            }

            return Response.json({
                success: true,
                message: 'Mitgliedschaft aktualisiert'
            });
        }

        if (action === 'list_depts') {
            const departments = await base44.asServiceRole.entities.Department.filter(
                { is_active: true },
                'department_name',
                100
            );

            const deptMembers = await base44.asServiceRole.entities.DepartmentMember.filter(
                { is_active: true },
                null,
                1000
            );

            return Response.json({
                success: true,
                departments,
                members: deptMembers
            });
        }

        return Response.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        console.error('Error managing department:', error);
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