import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Monitors budgets and sends alerts when spending approaches limits
 * Should be called regularly as a scheduled task
 */
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        console.log('Starting budget alert monitoring');

        // Get all active rolling budgets
        const budgets = await base44.asServiceRole.entities.RollingBudget.list('-created_at', 100);
        
        const alerts = [];

        for (const budget of budgets) {
            if (!budget.is_active) continue;

            // Get current period
            const today = new Date();
            const currentPeriod = budget.periods?.find(p => {
                const start = new Date(p.period_start);
                const end = new Date(p.period_end);
                return today >= start && today <= end;
            });

            if (!currentPeriod) continue;

            // Get recent transactions to calculate spending
            const reports = await base44.asServiceRole.entities.FinancialReport.filter(
                { 
                    user_email: budget.user_email,
                    period_start: currentPeriod.period_start
                },
                '-generated_at',
                1
            );

            if (!reports.length) continue;

            const report = reports[0];
            const expenses = report.metrics?.expense_analysis?.categories || {};

            // Check each category
            for (const [category, spending] of Object.entries(expenses)) {
                const budget_limit = currentPeriod.category_budgets?.[category] || 0;
                
                if (budget_limit === 0) continue;

                const percentage = (spending / budget_limit) * 100;

                if (percentage >= 100) {
                    alerts.push({
                        type: 'budget_exceeded',
                        severity: 'high',
                        budget_id: budget.id,
                        category,
                        spending,
                        budget_limit,
                        percentage: Math.round(percentage)
                    });
                } else if (percentage >= 80) {
                    alerts.push({
                        type: 'budget_warning',
                        severity: 'medium',
                        budget_id: budget.id,
                        category,
                        spending,
                        budget_limit,
                        percentage: Math.round(percentage)
                    });
                }
            }
        }

        // Create notifications for alerts
        for (const alert of alerts) {
            const budget = budgets.find(b => b.id === alert.budget_id);
            if (!budget) continue;

            const message = alert.type === 'budget_exceeded'
                ? `⚠️ Budget für ${alert.category} überschritten: ${alert.percentage}% (${alert.spending}€ / ${alert.budget_limit}€)`
                : `⏱️ Budget für ${alert.category} zu ${alert.percentage}% ausgeschöpft (${alert.spending}€ / ${alert.budget_limit}€)`;

            // Create notification
            await base44.asServiceRole.entities.Notification.create({
                user_email: budget.user_email,
                notification_type: alert.type,
                severity: alert.severity,
                message,
                related_id: budget.id,
                created_at: new Date().toISOString(),
                is_read: false
            });

            // Send email
            try {
                const user = await base44.asServiceRole.entities.User.filter(
                    { email: budget.user_email },
                    null,
                    1
                );

                if (user.length > 0) {
                    await base44.integrations.Core.SendEmail({
                        to: budget.user_email,
                        subject: `${alert.type === 'budget_exceeded' ? '🚨 Budget überschritten' : '⏱️ Budget-Warnung'}: ${alert.category}`,
                        body: message
                    });
                }
            } catch (error) {
                console.warn(`Failed to send email: ${error.message}`);
            }
        }

        return Response.json({
            success: true,
            alerts_generated: alerts.length,
            high_severity: alerts.filter(a => a.severity === 'high').length,
            medium_severity: alerts.filter(a => a.severity === 'medium').length
        });

    } catch (error) {
        console.error('Error monitoring budgets:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});