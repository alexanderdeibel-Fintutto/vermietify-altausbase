import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Performance-Optimierungs-Funktion
 * Admin-Only: Nur für Admin-Benutzer zugänglich
 * 
 * WICHTIG: Folgende Datenbank-Indizes sollten auf Platform-Ebene erstellt werden:
 * 
 * CREATE INDEX idx_tasks_status ON Task(status);
 * CREATE INDEX idx_tasks_due_date ON Task(due_date);
 * CREATE INDEX idx_tasks_priority ON Task(priority_id);
 * CREATE INDEX idx_tasks_object ON Task(assigned_object_id);
 * CREATE INDEX idx_tasks_workflow ON Task(workflow_id);
 * CREATE INDEX idx_emails_processed ON Email(is_processed);
 * CREATE INDEX idx_emails_account ON Email(imap_account_id);
 * CREATE INDEX idx_automation_active ON Automation(is_active);
 * CREATE INDEX idx_workflow_active ON Workflow(is_active);
 * CREATE INDEX idx_activity_log_entity ON ActivityLog(entity_type, entity_id);
 * CREATE INDEX idx_notifications_user_read ON Notification(user_id, is_read);
 */

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        // Admin-Check
        if (user?.role !== 'admin') {
            return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        const stats = {
            tasks_optimized: 0,
            emails_optimized: 0,
            automations_checked: 0,
            workflows_checked: 0,
            recommendations: []
        };

        // 1. Alte erledigte Tasks archivieren (älter als 6 Monate)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        
        const oldTasks = await base44.asServiceRole.entities.Task.filter({
            status: 'erledigt',
            completed_at: { $lt: sixMonthsAgo.toISOString() }
        });
        
        stats.tasks_optimized = oldTasks.length;
        if (oldTasks.length > 50) {
            stats.recommendations.push({
                type: 'archive',
                message: `${oldTasks.length} alte Tasks sollten archiviert werden`,
                action: 'Erwägen Sie ein Archivierungssystem'
            });
        }

        // 2. Verwaiste Emails bereinigen
        const oldEmails = await base44.asServiceRole.entities.Email.filter({
            is_processed: true
        });
        
        stats.emails_optimized = oldEmails.length;
        if (oldEmails.length > 1000) {
            stats.recommendations.push({
                type: 'cleanup',
                message: `${oldEmails.length} verarbeitete Emails könnten bereinigt werden`,
                action: 'Implementieren Sie eine Email-Retention-Policy'
            });
        }

        // 3. Inaktive Automatisierungen prüfen
        const inactiveAutomations = await base44.asServiceRole.entities.Automation.filter({
            is_active: false
        });
        
        stats.automations_checked = inactiveAutomations.length;
        if (inactiveAutomations.length > 10) {
            stats.recommendations.push({
                type: 'cleanup',
                message: `${inactiveAutomations.length} inaktive Automatisierungen`,
                action: 'Löschen Sie ungenutzte Automatisierungen'
            });
        }

        // 4. Workflow-Nutzung analysieren
        const workflows = await base44.asServiceRole.entities.Workflow.list();
        const tasks = await base44.asServiceRole.entities.Task.list();
        
        const workflowUsage = {};
        tasks.forEach(task => {
            if (task.workflow_id) {
                workflowUsage[task.workflow_id] = (workflowUsage[task.workflow_id] || 0) + 1;
            }
        });

        const unusedWorkflows = workflows.filter(w => !workflowUsage[w.id]);
        stats.workflows_checked = workflows.length;
        
        if (unusedWorkflows.length > 0) {
            stats.recommendations.push({
                type: 'optimization',
                message: `${unusedWorkflows.length} Workflows werden nicht genutzt`,
                action: 'Deaktivieren oder löschen Sie ungenutzte Workflows'
            });
        }

        // 5. Activity Log Rotation
        const activityLogs = await base44.asServiceRole.entities.ActivityLog.list();
        if (activityLogs.length > 10000) {
            stats.recommendations.push({
                type: 'maintenance',
                message: `${activityLogs.length} Activity Logs`,
                action: 'Implementieren Sie Log-Rotation (behalten Sie nur 30 Tage)'
            });
        }

        // 6. Notification Cleanup
        const oldNotifications = await base44.asServiceRole.entities.Notification.filter({
            is_read: true
        });
        
        if (oldNotifications.length > 500) {
            stats.recommendations.push({
                type: 'cleanup',
                message: `${oldNotifications.length} gelesene Benachrichtigungen`,
                action: 'Löschen Sie gelesene Benachrichtigungen älter als 7 Tage'
            });
        }

        // Empfohlene Indizes dokumentieren
        stats.required_indexes = [
            'idx_tasks_status',
            'idx_tasks_due_date',
            'idx_tasks_priority',
            'idx_tasks_object',
            'idx_tasks_workflow',
            'idx_emails_processed',
            'idx_emails_account',
            'idx_automation_active',
            'idx_workflow_active',
            'idx_activity_log_entity',
            'idx_notifications_user_read'
        ];

        return Response.json({
            success: true,
            stats,
            message: 'Performance-Analyse abgeschlossen'
        });

    } catch (error) {
        console.error('Performance optimization error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});