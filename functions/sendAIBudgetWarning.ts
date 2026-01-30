import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    // Triggered by AIUsageLog entity automation
    const { event, data } = await req.json();

    // Trigger AI Workflows
    await base44.asServiceRole.functions.invoke('triggerAIWorkflow', {
      trigger_type: 'budget_exceeded',
      trigger_data: { 
        log_id: data.id,
        user_email: data.user_email,
        cost: data.cost_eur
      }
    });
    
    if (!data || event.type !== 'create') {
      return Response.json({ skipped: true });
    }

    // Settings laden
    const settingsList = await base44.asServiceRole.entities.AISettings.list();
    const settings = settingsList?.[0];
    
    if (!settings) {
      return Response.json({ error: 'No settings found' }, { status: 404 });
    }

    // Aktuelle Monatskosten berechnen
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const logs = await base44.asServiceRole.entities.AIUsageLog.filter({
      created_date: { $gte: startOfMonth.toISOString() }
    });

    const currentMonthCost = logs.reduce((sum, log) => sum + (log.cost_eur || 0), 0);
    const budgetPercent = (currentMonthCost / settings.monthly_budget_eur) * 100;

    // Warnung nur wenn Schwelle erreicht
    if (budgetPercent < settings.budget_warning_threshold) {
      return Response.json({ skipped: true, budget_percent: budgetPercent });
    }

    // E-Mail an Admins
    const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
    
    const subject = budgetPercent >= 100 
      ? '🚨 AI-Budget überschritten!'
      : `⚠️ AI-Budget-Warnung (${Math.round(budgetPercent)}%)`;

    const body = `
      <h2>${subject}</h2>
      
      <p>Das KI-Budget für diesen Monat ist bei <strong>${budgetPercent.toFixed(1)}%</strong>.</p>
      
      <ul>
        <li><strong>Aktuell:</strong> €${currentMonthCost.toFixed(2)}</li>
        <li><strong>Budget:</strong> €${settings.monthly_budget_eur}</li>
        <li><strong>Verbleibend:</strong> €${(settings.monthly_budget_eur - currentMonthCost).toFixed(2)}</li>
      </ul>

      ${budgetPercent >= 100 ? '<p><strong>⚠️ Weitere Anfragen werden blockiert bis zum nächsten Monat.</strong></p>' : ''}
      
      <p><a href="${Deno.env.get('BASE_URL') || ''}/AISettings">→ Zu den KI-Einstellungen</a></p>
    `;

    for (const admin of admins) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: admin.email,
        subject,
        body
      });
    }

    // Auto-Disable wenn Budget überschritten
    if (budgetPercent >= 100 && settings.is_enabled) {
      await base44.asServiceRole.entities.AISettings.update(settings.id, {
        is_enabled: false,
        api_status: 'budget_exceeded'
      });
    }

    return Response.json({ 
      success: true, 
      budget_percent: budgetPercent,
      emails_sent: admins.length,
      auto_disabled: budgetPercent >= 100
    });

  } catch (error) {
    console.error('Budget warning error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});