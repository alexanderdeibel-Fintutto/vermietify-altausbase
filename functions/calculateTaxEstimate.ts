import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      einnahmen, 
      werbungskosten, 
      afa, 
      tax_rate = 0.30 
    } = await req.json();

    if (einnahmen === undefined) {
      return Response.json({ error: 'einnahmen required' }, { status: 400 });
    }

    console.log(`[TAX-ESTIMATE] Calculating for einnahmen: ${einnahmen}`);

    const totalEinnahmen = parseFloat(einnahmen) || 0;
    const totalWerbungskosten = parseFloat(werbungskosten) || 0;
    const totalAfa = parseFloat(afa) || 0;

    // Berechnung
    const gesamtWerbungskosten = totalWerbungskosten + totalAfa;
    const ueberschuss = totalEinnahmen - gesamtWerbungskosten;
    const estimatedTax = Math.max(0, ueberschuss * tax_rate);

    // Optimierungsvorschläge
    const suggestions = [];

    if (totalWerbungskosten / totalEinnahmen < 0.2) {
      suggestions.push({
        type: 'werbungskosten',
        message: 'Werbungskosten erscheinen niedrig. Prüfen Sie alle absetzbaren Kosten.',
        potential_saving: Math.round((totalEinnahmen * 0.1) * tax_rate)
      });
    }

    if (totalAfa === 0) {
      suggestions.push({
        type: 'afa',
        message: 'Keine AfA erfasst. Bei Immobilien meist 2% p.a. absetzbar.',
        potential_saving: Math.round((totalEinnahmen * 0.02) * tax_rate)
      });
    }

    const breakdown = {
      einnahmen: totalEinnahmen,
      werbungskosten: totalWerbungskosten,
      afa: totalAfa,
      gesamt_werbungskosten: gesamtWerbungskosten,
      ueberschuss,
      estimated_tax: Math.round(estimatedTax),
      tax_rate: tax_rate * 100,
      net_income: Math.round(ueberschuss - estimatedTax)
    };

    const result = {
      breakdown,
      suggestions,
      total_potential_saving: suggestions.reduce((sum, s) => sum + s.potential_saving, 0)
    };

    console.log(`[TAX-ESTIMATE] Estimated tax: ${breakdown.estimated_tax}€`);

    return Response.json({
      success: true,
      result
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});