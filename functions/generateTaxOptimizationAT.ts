import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { taxYear } = await req.json();

    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    console.log(`Generating AT tax optimization recommendations for ${taxYear}`);

    // Fetch all data
    const [investments, otherIncomes, capitalGains, realEstates] = await Promise.all([
      base44.entities.InvestmentAT.filter({ tax_year: taxYear }) || [],
      base44.entities.OtherIncomeAT.filter({ tax_year: taxYear }) || [],
      base44.entities.CapitalGainAT.filter({ tax_year: taxYear }) || [],
      base44.entities.RealEstate.filter({ tax_year: taxYear }) || []
    ]);

    const recommendations = [];

    // Recommendation 1: Sparer-Allowance
    const totalCapitalIncome = investments.reduce((s, i) => s + (i.gross_income || 0), 0);
    const sparerAllowanceUsed = investments.reduce((s, i) => s + (i.sparer_allowance_used || 0), 0);
    if (totalCapitalIncome > 730 && sparerAllowanceUsed === 0) {
      recommendations.push({
        id: 'sparer_allowance',
        title: 'Sparerfreibetrag nutzen',
        description: 'Sie könnten €730 Sparerfreibetrag pro Person nutzen',
        priority: 'high',
        potentialSavings: Math.min(730, totalCapitalIncome) * 0.275, // KESt rate
        recommendation: 'Beantragen Sie den Sparerfreibetrag bei Ihrer Bank',
        impact: 'Steuerersparnis'
      });
    }

    // Recommendation 2: Tax-Loss Harvesting
    const capitalGainTotal = capitalGains.reduce((s, cg) => s + (cg.gain_loss || 0), 0);
    if (capitalGainTotal > 0 && investments.length > 1) {
      recommendations.push({
        id: 'tax_loss_harvesting',
        title: 'Steueroptimierte Desinvestments',
        description: 'Prüfen Sie die Realisierung von Verlusten zur Gewinnneutralisation',
        priority: 'medium',
        potentialSavings: Math.min(capitalGainTotal * 0.10, 5000), // Conservative estimate
        recommendation: 'Überprüfen Sie Ihre Wertpapiere auf Verlustpotenziale',
        impact: 'Kapitalertragsteuer-Optimierung'
      });
    }

    // Recommendation 3: Rental Property Depreciation
    const underutilizedDepreciation = realEstates.filter(
      re => !re.depreciation || re.depreciation === 0
    ).length;
    if (underutilizedDepreciation > 0) {
      recommendations.push({
        id: 'rental_depreciation',
        title: 'Abschreibungen bei Mietobjekten prüfen',
        description: `Sie haben ${underutilizedDepreciation} Mietobjekt(e) ohne Abschreibungen`,
        priority: 'high',
        potentialSavings: underutilizedDepreciation * 2000 * 0.30, // Est. €2000/year per property
        recommendation: 'Lassen Sie die Gebäudewerte auf Abschreibungsmöglichkeiten prüfen',
        impact: 'E1c Optimierung'
      });
    }

    // Recommendation 4: Werbungskosten
    const hasOtherIncomes = otherIncomes.length > 0;
    const totalWithoutDeductions = otherIncomes.filter(
      oi => !oi.deductible_expenses || oi.deductible_expenses === 0
    ).length;
    if (totalWithoutDeductions > 0) {
      recommendations.push({
        id: 'deductible_expenses',
        title: 'Werbungskosten vollständig erfassen',
        description: `${totalWithoutDeductions} Einkunftsposition(en) ohne Werbungskostenabzug`,
        priority: 'medium',
        potentialSavings: totalWithoutDeductions * 500 * 0.30, // Est. €500/item
        recommendation: 'Dokumentieren Sie alle beruflichen Aufwendungen und Kosten',
        impact: 'Sonstige Einkünfte Optimierung'
      });
    }

    // Recommendation 5: Church Tax Assessment
    const churchTaxTotal = investments.reduce((s, i) => s + (i.church_tax || 0), 0);
    if (churchTaxTotal > 0 && !user.church_tax_exempt) {
      recommendations.push({
        id: 'church_tax_exemption',
        title: 'Kirchensteuer-Befreiung prüfen',
        description: 'Sie zahlen Kirchensteuer - Überprüfen Sie Befreiungsmöglichkeiten',
        priority: 'low',
        potentialSavings: churchTaxTotal,
        recommendation: 'Erkundigen Sie sich bei Ihrer Kirchengemeinde über Befreiungsmöglichkeiten',
        impact: 'Kirchensteuer-Ersparnis'
      });
    }

    const totalPotentialSavings = recommendations.reduce((s, r) => s + r.potentialSavings, 0);

    return Response.json({
      success: true,
      taxYear,
      recommendations: recommendations.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3);
      }),
      summary: {
        totalRecommendations: recommendations.length,
        totalPotentialSavings: Math.round(totalPotentialSavings),
        highPriority: recommendations.filter(r => r.priority === 'high').length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Optimization error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});