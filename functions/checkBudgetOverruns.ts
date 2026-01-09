import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Checks for budget overruns and deadline alerts
 * Scheduled to run periodically
 */
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        console.log('Checking budget overruns and deadlines');

        // Get all active rolling budgets
        const budgets = await base44.asServiceRole.entities.RollingBudget.list('-created_at', 100);

        const alerts = [];

        for (const budget of budgets) {
            if (!budget.is_active || !budget.periods) continue;

            // Get current period
            const today = new Date();
            const currentPeriod = budget.periods.find(p => {
                const start = new Date(p.period_start);
                const end = new Date(p.period_end);
                return today >= start && today <= end;
            });

            if (!currentPeriod) continue;

            // Check for overruns
            const totalBudget = Object.values(currentPeriod.category_budgets || {}).reduce((a, b) => a + b, 0);
            const spentPercentage = (budget.spent || 0) / totalBudget * 100;

            if (spentPercentage > 100) {
                alerts.push({
                    type: 'overrun',
                    severity: 'high',
                    budget_id: budget.id,
                    budget_name: budget.budget_name,
                    user_email: budget.user_email,
                    message: `Budget "${budget.budget_name}" überschritten: ${spentPercentage.toFixed(0)}%`,
                    current_spending: budget.spent,
                    budget_limit: totalBudget
                });
            } else if (spentPercentage > 80) {
                alerts.push({
                    type: 'warning',
                    severity: 'medium',
                    budget_id: budget.id,
                    budget_name: budget.budget_name,
                    user_email: budget.user_email,
                    message: `Budget "${budget.budget_name}" zu ${spentPercentage.toFixed(0)}% ausgeschöpft`,
                    current_spending: budget.spent,
                    budget_limit: totalBudget
                });
            }
        }

        // Check approval deadline alerts
        const workflows = await base44.asServiceRole.entities.ApprovalWorkflow.filter(
            { status: 'pending' },
            null,
            100
        );

        const now = new Date();

        for (const workflow of workflows) {
            if (!workflow.deadline) continue;

            const deadlineDate = new Date(workflow.deadline);
            const daysUntilDeadline = (deadlineDate - now) / (1000 * 60 * 60 * 24);

            if (daysUntilDeadline < 0) {
                alerts.push({
                    type: 'deadline_overdue',
                    severity: 'high',
                    workflow_id: workflow.id,
                    workflow_name: workflow.workflow_name,
                    requester_email: workflow.requester_email,
                    message: `Genehmigung für "${workflow.workflow_name}" ist überfällig`,
                    deadline: workflow.deadline
                });
            } else if (daysUntilDeadline < 1) {
                alerts.push({
                    type: 'deadline_approaching',
                    severity: 'medium',
                    workflow_id: workflow.id,
                    workflow_name: workflow.workflow_name,
                    requester_email: workflow.requester_email,
                    message: `Genehmigung für "${workflow.workflow_name}" fällig innerhalb von ${daysUntilDeadline.toFixed(1)} Tagen`,
                    deadline: workflow.deadline
                });
            }
        }

        // Store alerts
        for (const alert of alerts) {
            await base44.asServiceRole.entities.Notification.create({
                user_email: alert.user_email || alert.requester_email,
                notification_type: alert.type,
                severity: alert.severity,
                message: alert.message,
                related_id: alert.budget_id || alert.workflow_id,
                created_at: new Date().toISOString(),
                is_read: false
            });
        }

        return Response.json({
            success: true,
            alerts_generated: alerts.length,
            alerts
        });

    } catch (error) {
        console.error('Error checking overruns:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});