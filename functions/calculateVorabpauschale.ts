import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { assetId, taxYear } = body;

    const asset = await base44.asServiceRole.entities.Asset.read(assetId);

    // Vorabpauschale = base_value * (base_interest_rate + administration_margin - performance_margin)
    // Vereinfacht: 30% des Indexzins als Vorabpauschale
    const baseInterestRate = 0.0; // Dynamisch aus Bundesbank-Daten
    const baseValue = asset.current_value;
    const administrationMargin = 0.005; // 0,5%
    
    const vorabpauschale = baseValue * (baseInterestRate + administrationMargin);

    return Response.json({
      baseValue,
      baseInterestRate,
      vorabpauschale,
      taxableIncome: vorabpauschale,
      tax: vorabpauschale * 0.25 // 25% KapErtSt
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});