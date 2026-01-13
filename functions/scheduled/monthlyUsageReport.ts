import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    console.log('[USAGE_REPORT] Starting monthly usage report generation...');

    const subscriptions = await base44.asServiceRole.entities.UserSubscription.filter({
      status: 'ACTIVE'
    });

    const tiers = await base44.asServiceRole.entities.PricingTier.list();
    const limits = await base44.asServiceRole.entities.UsageLimit.list();

    let sentCount = 0;

    for (const sub of subscriptions) {
      try {
        const tier = tiers.find(t => t.id === sub.tier_id);
        
        const userLimits = await base44.asServiceRole.entities.UserLimit.filter({
          user_email: sub.user_email
        });

        let reportLines = [`Ihr monatlicher Nutzungsbericht für ${tier?.name || 'Ihr Plan'}:\n`];

        for (const ul of userLimits) {
          const limit = limits.find(l => l.id === ul.limit_id);
          if (!limit) continue;

          const percentage = ul.limit_value === -1 
            ? 0 
            : (ul.current_usage / ul.limit_value) * 100;

          reportLines.push(
            `• ${limit.name}: ${ul.current_usage}${ul.limit_value !== -1 ? `/${ul.limit_value}` : ''} ${limit.unit || 'Einheiten'} (${percentage.toFixed(0)}%)`
          );
        }

        if (sub.next_billing_date) {
          reportLines.push(`\nNächste Abrechnung: ${sub.next_billing_date}`);
        }

        await base44.asServiceRole.integrations.Core.SendEmail({
          to: sub.user_email,
          subject: 'Ihr monatlicher Nutzungsbericht',
          body: reportLines.join('\n')
        });

        sentCount++;
        console.log(`[USAGE_REPORT] Sent report to ${sub.user_email}`);
      } catch (error) {
        console.error(`[USAGE_REPORT] Error for ${sub.user_email}:`, error);
      }
    }

    console.log(`[USAGE_REPORT] Completed. Sent ${sentCount} reports.`);

    return Response.json({
      success: true,
      sent: sentCount,
      total: subscriptions.length
    });

  } catch (error) {
    console.error('[USAGE_REPORT] Fatal error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});