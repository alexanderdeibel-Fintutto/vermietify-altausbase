import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await req.json();
    
    if (userId !== user.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    console.log(`GDPR Delete initiated for user ${userId}`);

    // Delete all portfolios
    const portfolios = await base44.asServiceRole.entities.AssetPortfolio.filter({ user_id: userId });
    for (const p of portfolios) {
      await base44.asServiceRole.entities.AssetPortfolio.delete(p.id);
    }

    // Delete price history
    const priceHistories = await base44.asServiceRole.entities.PriceHistory.filter({});
    for (const ph of priceHistories) {
      const portfolio = portfolios.find(p => p.id === ph.asset_portfolio_id);
      if (portfolio) await base44.asServiceRole.entities.PriceHistory.delete(ph.id);
    }

    // Delete alerts
    const alerts = await base44.asServiceRole.entities.PortfolioAlert.filter({ user_id: userId });
    for (const a of alerts) {
      await base44.asServiceRole.entities.PortfolioAlert.delete(a.id);
    }

    // Log deletion for audit
    await base44.asServiceRole.entities.ActivityLog.create({
      user_id: userId,
      action: 'gdpr_data_deletion',
      entity_type: 'AssetPortfolio',
      details: { reason: 'GDPR Right to be forgotten', timestamp: new Date().toISOString() }
    });

    console.log(`GDPR Delete completed for user ${userId}`);

    return Response.json({ success: true, message: 'All data deleted successfully' });
  } catch (error) {
    console.error('GDPR delete error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});