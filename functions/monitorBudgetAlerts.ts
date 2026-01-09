import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Monitors budget spending and creates alerts when thresholds are exceeded
 * Scheduled to run daily
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    console.log('Monitoring budget alerts...');

    // Fetch all cost centers
    const costCenters = await base44.asServiceRole.entities.CostCenter.list('-updated_date', 100);
    const transactions = await base44.asServiceRole.entities.FinancialItem.list('-transaction_date', 1000);

    let alertCount = 0;

    for (const costCenter of costCenters) {
      if (!costCenter.is_active || !costCenter.budget_amount) {
        continue;
      }

      // Get current month
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      // Calculate spending for this month
      const monthTransactions = transactions.filter(t => {
        if (t.cost_center_id !== costCenter.id) return false;
        if (t.transaction_type !== 'expense') return false;
        
        const transDate = new Date(t.transaction_date);
        const transMonth = `${transDate.getFullYear()}-${String(transDate.getMonth() + 1).padStart(2, '0')}`;
        return transMonth === currentMonth;
      });

      const spentAmount = monthTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
      const remainingAmount = costCenter.budget_amount - spentAmount;
      const usagePercentage = (spentAmount / costCenter.budget_amount) * 100;

      // Check for existing alerts
      const existingAlerts = await base44.asServiceRole.entities.BudgetAlert.filter(
        { cost_center_id: costCenter.id, is_resolved: false },
        null,
        10
      );

      // Determine alert level
      let shouldAlert = false;
      let alertType = '';

      if (usagePercentage >= 90) {
        alertType = 'critical';
        shouldAlert = true;
      } else if (usagePercentage >= 75) {
        alertType = 'warning';
        shouldAlert = true;
      }

      if (shouldAlert) {
        // Check if alert already exists
        const existingAlert = existingAlerts.find(a => a.alert_type === alertType);

        if (!existingAlert) {
          const alert = await base44.asServiceRole.entities.BudgetAlert.create({
            cost_center_id: costCenter.id,
            alert_type: alertType,
            threshold_percentage: usagePercentage,
            budget_amount: costCenter.budget_amount,
            spent_amount: spentAmount,
            remaining_amount: remainingAmount,
            alert_date: new Date().toISOString(),
            notes: `${usagePercentage.toFixed(1)}% des Budgets verbraucht`
          });

          alertCount++;

          // Send notification to admins
          try {
            const allUsers = await base44.asServiceRole.entities.User.list('-updated_date', 100);
            const admins = allUsers.filter(u => u.role === 'admin');

            for (const admin of admins) {
              await base44.asServiceRole.entities.Notification.create({
                user_id: admin.id,
                user_email: admin.email,
                title: `${alertType === 'critical' ? '🚨' : '⚠️'} Budget-Warnung: ${costCenter.name}`,
                message: `${usagePercentage.toFixed(1)}% des Budgets verbraucht (${spentAmount.toFixed(2)}€ von ${costCenter.budget_amount.toFixed(2)}€)`,
                notification_type: 'system_alert',
                priority: alertType === 'critical' ? 'critical' : 'high',
                metadata: {
                  cost_center_id: costCenter.id,
                  usage_percentage: usagePercentage
                }
              });
            }
          } catch (err) {
            console.error(`Failed to create notifications: ${err.message}`);
          }
        }
      } else {
        // Resolve existing alerts if spending is now under threshold
        for (const alert of existingAlerts) {
          await base44.asServiceRole.entities.BudgetAlert.update(alert.id, {
            is_resolved: true
          });
        }
      }
    }

    console.log(`Processed ${alertCount} budget alerts`);

    return Response.json({
      success: true,
      alert_count: alertCount
    });
  } catch (error) {
    console.error('Error monitoring budget alerts:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});