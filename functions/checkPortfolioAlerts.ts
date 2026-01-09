import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    console.log("Checking portfolio alerts...");

    // Ungelöste Alerts laden
    const openAlerts = await base44.asServiceRole.entities.PortfolioAlert.filter({
      is_resolved: false
    });

    let checkedCount = 0;
    let resolvedCount = 0;

    for (const alert of openAlerts) {
      try {
        // Prüfen ob Alert abgelaufen ist
        if (new Date(alert.expires_at) < new Date()) {
          await base44.asServiceRole.entities.PortfolioAlert.update(alert.id, {
            is_resolved: true
          });
          resolvedCount++;
          continue;
        }

        // Für Price-Change Alerts: Aktuelle Preise prüfen
        if (alert.alert_type === "price_change" && alert.asset_portfolio_id) {
          const asset = await base44.asServiceRole.entities.AssetPortfolio.get(
            alert.asset_portfolio_id
          );

          if (asset) {
            const currentGain = asset.quantity * (asset.current_value - asset.purchase_price);
            const gainPercent = ((asset.current_value - asset.purchase_price) / asset.purchase_price) * 100;

            // Wenn Preis sich wieder normalisiert hat: Alert auflösen
            if (Math.abs(gainPercent) < 10) {
              await base44.asServiceRole.entities.PortfolioAlert.update(alert.id, {
                is_resolved: true
              });
              resolvedCount++;
            }
          }
        }

        // Für Tax-Optimization Alerts: Nur gegen Jahresende relevant
        if (alert.alert_type === "tax_optimization") {
          const now = new Date();
          const monthsUntilYearEnd = 12 - now.getMonth();

          if (monthsUntilYearEnd > 3 && !alert.action_required) {
            // Not relevant anymore, resolve it
            await base44.asServiceRole.entities.PortfolioAlert.update(alert.id, {
              is_resolved: true
            });
            resolvedCount++;
          }
        }

        checkedCount++;
      } catch (error) {
        console.error(`Error checking alert ${alert.id}:`, error);
      }
    }

    console.log(`Alert check completed: ${checkedCount} checked, ${resolvedCount} resolved`);

    return Response.json({
      success: true,
      checked_count: checkedCount,
      resolved_count: resolvedCount
    });
  } catch (error) {
    console.error("checkPortfolioAlerts error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});