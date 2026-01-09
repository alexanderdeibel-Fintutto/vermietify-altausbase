import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all portfolio data
    const portfolio = await base44.entities.AssetPortfolio.filter({ user_id: user.id });
    const priceHistory = await base44.entities.PriceHistory.filter({});
    const alerts = await base44.entities.PortfolioAlert.filter({ user_id: user.id });
    const automation = await base44.entities.AutomationConfig.filter({ user_id: user.id });

    const backup = {
      backupDate: new Date().toISOString(),
      userId: user.id,
      version: '1.0',
      data: {
        portfolio,
        priceHistory: priceHistory.filter(ph => portfolio.find(p => p.id === ph.asset_portfolio_id)),
        alerts,
        automation
      }
    };

    // Save backup metadata
    await base44.asServiceRole.entities.ActivityLog.create({
      user_id: user.id,
      action: 'backup_created',
      entity_type: 'AssetPortfolio',
      details: {
        portfolioCount: portfolio.length,
        backupDate: backup.backupDate
      }
    });

    return Response.json({
      success: true,
      backup,
      message: `Backup erstellt: ${portfolio.length} Positionen`
    });
  } catch (error) {
    console.error('Backup error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});