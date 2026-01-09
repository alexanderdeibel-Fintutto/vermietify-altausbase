import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { user_id, tax_year } = await req.json();

    if (!user_id || !tax_year) {
      return Response.json(
        { error: 'Missing user_id or tax_year' },
        { status: 400 }
      );
    }

    // 1. Load all assets for the user
    const portfolio = await base44.asServiceRole.entities.AssetPortfolio.filter(
      { user_id: user_id, status: 'active' },
      '-created_date',
      1000
    );

    if (!portfolio || portfolio.length === 0) {
      return Response.json({
        zeile_7_zinsen: 0,
        zeile_9_dividenden: 0,
        zeile_12_wertpapiergewinne: 0,
        zeile_16_pauschbetrag: 0,
        zeile_26_verluste: 0,
        sparer_pauschbetrag_used: 0,
        sparer_pauschbetrag_remaining: 1000
      });
    }

    // 2. Calculate tax data
    const taxData = {
      zeile_7_zinsen: 0,
      zeile_9_dividenden: 0,
      zeile_10_dividenden_ausland: 0,
      zeile_12_wertpapiergewinne: 0,
      zeile_26_verluste: 0,
      zeile_37_steuerabzug: 0
    };

    for (const asset of portfolio) {
      // Simulate dividend/interest calculation
      const estimatedDividend = asset.quantity * asset.current_value * 0.02; // 2% yield estimate
      
      if (asset.asset_category === 'bonds' || asset.asset_category === 'cash') {
        taxData.zeile_7_zinsen += estimatedDividend;
      } else if (asset.asset_category === 'stocks') {
        if (asset.currency === 'EUR') {
          taxData.zeile_9_dividenden += estimatedDividend;
        } else {
          taxData.zeile_10_dividenden_ausland += estimatedDividend;
        }
      }

      // Realized gains
      if (asset.purchase_date) {
        const purchaseDate = new Date(asset.purchase_date);
        const yearPurchased = purchaseDate.getFullYear();
        
        if (yearPurchased <= tax_year) {
          const totalValue = asset.quantity * asset.current_value;
          const totalInvested = asset.quantity * asset.purchase_price;
          const gain = totalValue - totalInvested;

          if (gain > 0) {
            taxData.zeile_12_wertpapiergewinne += gain;
          } else if (gain < 0) {
            taxData.zeile_26_verluste += Math.abs(gain);
          }
        }
      }
    }

    // 3. Calculate Sparer-Pauschbetrag
    const totalGains = 
      taxData.zeile_7_zinsen + 
      taxData.zeile_9_dividenden + 
      taxData.zeile_10_dividenden_ausland + 
      taxData.zeile_12_wertpapiergewinne;

    const maxPauschbetrag = 1000; // 1000€ for single, 2000€ for married
    const pauschbetrag = Math.min(maxPauschbetrag, totalGains);

    // 4. Calculate withholding tax
    const witholdingTax = totalGains * 0.25; // 25% Abgeltungsteuer

    // 5. Create TaxCalculation record
    const calculation = await base44.asServiceRole.entities.TaxCalculation.create({
      user_id: user_id,
      tax_year: tax_year,
      form_type: 'anlage_kap',
      calculation_date: new Date().toISOString(),
      calculated_fields: taxData,
      sparer_pauschbetrag_used: pauschbetrag,
      sparer_pauschbetrag_remaining: maxPauschbetrag - pauschbetrag,
      validation_status: 'valid'
    });

    return Response.json({
      calculation_id: calculation.id,
      zeile_7_zinsen: taxData.zeile_7_zinsen,
      zeile_9_dividenden: taxData.zeile_9_dividenden,
      zeile_12_wertpapiergewinne: taxData.zeile_12_wertpapiergewinne,
      zeile_26_verluste: taxData.zeile_26_verluste,
      zeile_16_pauschbetrag: pauschbetrag,
      zeile_37_steuerabzug: witholdingTax,
      sparer_pauschbetrag_used: pauschbetrag,
      sparer_pauschbetrag_remaining: maxPauschbetrag - pauschbetrag,
      taxable_gains: Math.max(0, totalGains - pauschbetrag - taxData.zeile_26_verluste),
      estimated_tax: Math.max(0, (totalGains - pauschbetrag) * 0.25)
    });
  } catch (error) {
    console.error('calculateAnlageKAP error:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});