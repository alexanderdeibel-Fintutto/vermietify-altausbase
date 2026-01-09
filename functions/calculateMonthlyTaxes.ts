import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    console.log('Starting monthly tax calculation...');

    const currentYear = new Date().getFullYear();
    const users = await base44.asServiceRole.entities.User.list();
    let calculated = 0;
    let errors = 0;

    for (const user of users) {
      try {
        const assets = await base44.asServiceRole.entities.AssetPortfolio.filter({
          user_id: user.id,
          status: 'active'
        });

        if (assets.length === 0) continue;

        // Aggregate tax-relevant data
        let capitalGains = 0;
        let dividends = 0;
        let interest = 0;

        for (const asset of assets) {
          // Unrealized gains
          const assetValue = asset.quantity * asset.current_value;
          const costBasis = asset.quantity * asset.purchase_price;
          const unrealizedGain = assetValue - costBasis;

          if (unrealizedGain > 0) {
            capitalGains += unrealizedGain;
          }

          // Dividends/Interest (from asset_details if available)
          if (asset.asset_details?.dividend_yield) {
            dividends += assetValue * (asset.asset_details.dividend_yield / 100);
          }
        }

        // Estimate tax burden
        const sparer_pauschbetrag = user.marital_status === 'married' ? 2000 : 1000;
        const taxableAmount = Math.max(0, capitalGains + dividends - sparer_pauschbetrag);
        const estimatedTax = taxableAmount * 0.26375; // 25% + Soli + Church tax

        // Create tax calculation record
        const calculation = await base44.asServiceRole.entities.TaxCalculation.create({
          user_id: user.id,
          tax_year: currentYear,
          calculation_date: new Date().toISOString(),
          form_type: 'anlage_kap',
          input_data: {
            capital_gains: capitalGains,
            dividends: dividends,
            interest: interest
          },
          calculated_fields: {
            zeile_12_wertpapiergewinne: capitalGains,
            zeile_9_dividenden_inland: dividends,
            zeile_7_zinsen_inland: interest,
            zeile_16_pauschbetrag: sparer_pauschbetrag,
            estimated_tax: estimatedTax
          },
          sparer_pauschbetrag_used: Math.min(sparer_pauschbetrag, capitalGains + dividends),
          sparer_pauschbetrag_remaining: Math.max(0, sparer_pauschbetrag - (capitalGains + dividends)),
          validation_status: 'valid'
        });

        // Check for tax optimization opportunities
        if (capitalGains < 0 || (capitalGains + dividends - sparer_pauschbetrag) < 0) {
          await base44.functions.invoke('sendPortfolioNotification', {
            userId: user.id,
            type: 'tax_optimization',
            title: 'Steuer-Optimierungsmöglichkeit',
            message: 'Sie könnten Verluste mit Gewinnen verrechnen - Details im Steuer-Cockpit',
            severity: 'info',
            channels: ['in_app']
          });
        }

        calculated++;
      } catch (userError) {
        console.error(`Error calculating taxes for user:`, userError);
        errors++;
      }
    }

    console.log(`Monthly tax calculation completed: ${calculated} calculated, ${errors} errors`);

    return Response.json({
      success: true,
      calculated,
      errors,
      message: `Monatliche Steuerberechnung für ${calculated} Benutzer durchgeführt`
    });
  } catch (error) {
    console.error('Monthly tax calculation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});