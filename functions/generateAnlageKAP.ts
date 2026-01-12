import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { tax_year } = await req.json();
    
    console.log(`[Anlage KAP] Generating for year ${tax_year}`);
    
    // 1. Alle Dividenden des Jahres
    const dividends = await base44.entities.Dividend.filter({ tax_year });
    const dividends_total = dividends.reduce((sum, d) => sum + d.amount_gross, 0);
    const dividends_tax = dividends.reduce((sum, d) => sum + d.tax_withheld, 0);
    
    // 2. Alle Verkäufe des Jahres
    const sales = await base44.entities.AssetTransaction.filter({ 
      transaction_type: "SELL",
      tax_year 
    });
    const capital_gains = sales.reduce((sum, s) => sum + (s.realized_gain_loss || 0), 0);
    
    // 3. Freistellungsaufträge
    const fsa = await base44.entities.TaxOptimization.filter({
      tax_year,
      pot_type: "FREISTELLUNGSAUFTRAG"
    });
    const fsa_total = fsa.reduce((sum, f) => sum + f.amount_available, 0);
    const fsa_used = fsa.reduce((sum, f) => sum + f.amount_used, 0);
    
    // 4. Verlustverrechnungstöpfe
    const stockLossPot = await base44.entities.TaxOptimization.filter({
      tax_year,
      pot_type: "STOCK_LOSS_POT"
    });
    
    const otherLossPot = await base44.entities.TaxOptimization.filter({
      tax_year,
      pot_type: "OTHER_LOSS_POT"
    });
    
    // 5. Berechne finale Steuerlast
    const total_income = dividends_total + capital_gains;
    const taxable_income = Math.max(0, total_income - fsa_total);
    
    const kapitalertragsteuer = taxable_income * 0.25;
    const solidaritaetszuschlag = kapitalertragsteuer * 0.055;
    const total_tax = kapitalertragsteuer + solidaritaetszuschlag;
    
    console.log(`[Anlage KAP] Total income: ${total_income}€, Tax: ${total_tax}€`);
    
    return Response.json({
      tax_year,
      dividends: {
        total: dividends_total,
        count: dividends.length,
        tax_withheld: dividends_tax
      },
      capital_gains: {
        total: capital_gains,
        count: sales.length
      },
      freistellungsauftrag: {
        total: fsa_total,
        used: fsa_used,
        available: fsa_total - fsa_used
      },
      loss_pots: {
        stock: stockLossPot[0]?.amount_available || 0,
        other: otherLossPot[0]?.amount_available || 0
      },
      summary: {
        total_income,
        taxable_income,
        kapitalertragsteuer,
        solidaritaetszuschlag,
        total_tax
      }
    });
  } catch (error) {
    console.error('[Anlage KAP] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});