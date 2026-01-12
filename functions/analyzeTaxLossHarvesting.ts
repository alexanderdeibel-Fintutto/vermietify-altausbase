import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { portfolio_id, min_loss = 100 } = await req.json();

    // Alle Assets im Portfolio
    const assets = await base44.entities.Asset.filter({ portfolio_id });

    const suggestions = [];

    for (const asset of assets) {
      // Nur bei Aktien/ETFs/Krypto
      if (!['STOCK', 'ETF', 'MUTUAL_FUND', 'CRYPTO'].includes(asset.asset_class)) continue;

      // Berechne unrealisierte Verluste
      const cost_basis = asset.purchase_price_avg * asset.quantity;
      const current_value = asset.current_value || 0;
      const unrealized_loss = cost_basis - current_value;

      if (unrealized_loss >= min_loss) {
        // Berechne Steuerersparnis
        const tax_savings = unrealized_loss * 0.25; // KapErtSt 25%

        // Prüfe Haltefrist-Risiko
        let haltefrist_risk = false;
        if (['CRYPTO', 'GOLD', 'SILVER', 'PLATINUM'].includes(asset.asset_class)) {
          const holding_period_days = 
            (new Date() - new Date(asset.tax_holding_period_start)) / (1000 * 60 * 60 * 24);
          if (holding_period_days < 365) {
            haltefrist_risk = true;
          }
        }

        suggestions.push({
          asset_id: asset.id,
          asset_name: asset.name,
          asset_class: asset.asset_class,
          unrealized_loss,
          tax_savings,
          current_price: asset.current_price,
          quantity: asset.quantity,
          haltefrist_risk,
          haltefrist_warning: haltefrist_risk
            ? 'Achtung: Haltefrist noch nicht abgelaufen. Wiederanlage könnte zu Steuerpflicht führen!'
            : null,
        });
      }
    }

    // Sortiere nach Steuerersparnis absteigend
    suggestions.sort((a, b) => b.tax_savings - a.tax_savings);

    console.log(`[Tax Loss Harvesting] Found ${suggestions.length} opportunities in portfolio ${portfolio_id}`);

    return Response.json({
      count: suggestions.length,
      total_potential_tax_savings: suggestions.reduce((sum, s) => sum + s.tax_savings, 0),
      suggestions,
    });
  } catch (error) {
    console.error('[Tax Loss Harvesting] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});