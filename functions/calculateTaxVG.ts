import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { userId, taxYear } = await req.json();

    console.log(`Calculating Anlage VG for ${userId}, year ${taxYear}`);

    // Get all capital gains for this year
    const capitalGains = await base44.asServiceRole.entities.CapitalGain.filter({
      created_by: userId,
      tax_year: taxYear
    });

    const FREIGRENZE = 600; // EUR for private gains

    // Process each capital gain
    const gainDetails = capitalGains.map(gain => {
      const acquisitionDate = new Date(gain.acquisition_date);
      const saleDate = new Date(gain.sale_date);
      const yearsHeld = (saleDate - acquisitionDate) / (365.25 * 24 * 60 * 60 * 1000);

      const grossGain = gain.sale_price - gain.acquisition_costs - (gain.improvement_costs || 0) - (gain.selling_costs || 0);
      
      // Determine if exempt
      let isExempt = gain.is_tax_exempt || false;
      let exemptReason = gain.exemption_reason || 'none';

      if (gain.asset_type === 'immobilie' && yearsHeld >= 10) {
        isExempt = true;
        exemptReason = '10_jahre_regel';
      }

      return {
        id: gain.id,
        description: gain.description,
        assetType: gain.asset_type,
        saleDate: gain.sale_date,
        acquisitionDate: gain.acquisition_date,
        yearsHeld: Math.round(yearsHeld * 10) / 10,
        grossGain,
        isExempt,
        exemptionReason: exemptReason,
        taxableGain: isExempt ? 0 : grossGain
      };
    });

    // Summary
    const totalGain = gainDetails.reduce((sum, g) => sum + g.grossGain, 0);
    const totalExempt = gainDetails.reduce((sum, g) => sum + (g.isExempt ? g.grossGain : 0), 0);
    const totalTaxableBeforeThreshold = gainDetails.reduce((sum, g) => sum + g.taxableGain, 0);
    
    // Apply 600€ threshold
    const totalTaxable = Math.max(0, totalTaxableBeforeThreshold - FREIGRENZE);

    const result = {
      taxYear,
      gains: gainDetails,
      totals: {
        totalGain,
        exemptGains: totalExempt,
        taxableBeforeThreshold: totalTaxableBeforeThreshold,
        taxableAfterThreshold: totalTaxable
      },
      threshold: {
        freigrenze: FREIGRENZE,
        applied: totalTaxableBeforeThreshold > FREIGRENZE,
        reduction: Math.min(totalTaxableBeforeThreshold, FREIGRENZE)
      }
    };

    return Response.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Tax VG calculation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});