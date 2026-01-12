import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { asset_id, tax_year } = await req.json();

    const asset = await base44.entities.Asset.get(asset_id);
    if (!asset) {
      return Response.json({ error: 'Asset nicht gefunden' }, { status: 404 });
    }

    // Nur für ETFs berechnen
    if (!['ETF', 'MUTUAL_FUND'].includes(asset.asset_class)) {
      return Response.json({ vorabpauschale: 0, message: 'Nur für ETFs/Fonds relevant' });
    }

    // Wert am 1. Januar
    const jan_1_valuations = await base44.entities.AssetValuation.filter(
      {
        asset_id,
        valuation_date: `${tax_year}-01-01`,
      },
      null,
      1
    );

    if (!jan_1_valuations || jan_1_valuations.length === 0) {
      return Response.json({ vorabpauschale: 0, message: 'Kein Wert am 1. Januar verfügbar' });
    }

    const start_value = jan_1_valuations[0].price * asset.quantity;
    const basiszins = 0.019; // 2025: 1,9% (BMF)
    const vorabpauschale = start_value * basiszins * 0.7;

    // Prüfe Ausschüttungen im Jahr
    const distributions = await base44.entities.Dividend.filter(
      {
        asset_id,
        tax_year,
        dividend_type: 'ETF_DISTRIBUTION',
      }
    );

    const total_distributions = distributions.reduce((sum, d) => sum + d.amount_gross, 0);

    // Vorabpauschale nur ansetzen wenn > Ausschüttungen
    const taxable_vorabpauschale = Math.max(0, vorabpauschale - total_distributions);

    console.log(`[Vorabpauschale] Asset: ${asset.name}, Year: ${tax_year}, Amount: ${taxable_vorabpauschale}€`);

    return Response.json({
      vorabpauschale: taxable_vorabpauschale,
      calculation: {
        start_value,
        basiszins,
        gross_vorabpauschale: vorabpauschale,
        distributions: total_distributions,
      },
    });
  } catch (error) {
    console.error('[Vorabpauschale] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});