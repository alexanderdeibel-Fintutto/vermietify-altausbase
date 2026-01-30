import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Vormonat berechnen
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Usage-Logs für Vormonat laden
    const logs = await base44.asServiceRole.entities.AIUsageLog.filter({
      created_date: { 
        $gte: lastMonth.toISOString(),
        $lte: endLastMonth.toISOString()
      }
    });

    // Statistiken berechnen
    const totalRequests = logs.length;
    const totalCost = logs.reduce((sum, l) => sum + (l.cost_eur || 0), 0);
    const totalSavings = logs.reduce((sum, l) => sum + ((l.cost_without_cache_eur || 0) - (l.cost_eur || 0)), 0);
    const totalTokens = logs.reduce((sum, l) => sum + (l.input_tokens || 0) + (l.output_tokens || 0), 0);

    // Feature-Breakdown
    const byFeature = {};
    logs.forEach(log => {
      const feature = log.feature || 'unknown';
      if (!byFeature[feature]) {
        byFeature[feature] = { count: 0, cost: 0 };
      }
      byFeature[feature].count++;
      byFeature[feature].cost += log.cost_eur || 0;
    });

    // Settings laden
    const settingsList = await base44.asServiceRole.entities.AISettings.list();
    const settings = settingsList?.[0];

    // E-Mail-Body erstellen
    const monthName = lastMonth.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
    
    const emailBody = `
      <h2>🤖 KI-Nutzungsbericht ${monthName}</h2>
      
      <h3>📊 Übersicht</h3>
      <ul>
        <li><strong>Anfragen:</strong> ${totalRequests.toLocaleString('de-DE')}</li>
        <li><strong>Tokens:</strong> ${totalTokens.toLocaleString('de-DE')}</li>
        <li><strong>Kosten:</strong> €${totalCost.toFixed(2)}</li>
        <li><strong>Budget:</strong> €${settings?.monthly_budget_eur || 50}</li>
        <li><strong>Auslastung:</strong> ${Math.round((totalCost / (settings?.monthly_budget_eur || 50)) * 100)}%</li>
      </ul>

      <h3>✨ Ersparnis durch Caching</h3>
      <p>€${totalSavings.toFixed(2)} (${Math.round((totalSavings / (totalCost + totalSavings)) * 100)}% Ersparnis)</p>

      <h3>🎯 Nutzung nach Feature</h3>
      <ul>
        ${Object.entries(byFeature).map(([feature, data]) => 
          `<li><strong>${feature}:</strong> ${data.count}x (€${data.cost.toFixed(2)})</li>`
        ).join('')}
      </ul>

      <hr style="margin: 20px 0;">
      <p style="font-size: 12px; color: #666;">
        Dieser Bericht wurde automatisch generiert.
      </p>
    `;

    // E-Mail an Admins senden
    const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
    
    for (const admin of admins) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: admin.email,
        subject: `KI-Nutzungsbericht ${monthName}`,
        body: emailBody
      });
    }

    return Response.json({ 
      success: true, 
      month: monthName,
      total_requests: totalRequests,
      total_cost: totalCost,
      total_savings: totalSavings,
      emails_sent: admins.length
    });
  } catch (error) {
    console.error('Monthly report error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});