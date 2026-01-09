import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { userId, taxYear, canton } = await req.json();

    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const investments = await base44.entities.InvestmentCH.filter({ tax_year: taxYear, canton }) || [];
    const realEstates = await base44.entities.RealEstateCH.filter({ tax_year: taxYear, canton }) || [];

    const recommendations = [];
    let potentialSavings = 0;

    // Check 1: Withholding tax recovery
    const totalWithholding = investments.reduce((sum, inv) => sum + (inv.withholding_tax_paid || 0), 0);
    if (totalWithholding > 500) {
      recommendations.push({
        id: 'withholding_recovery',
        title: 'Verrechnungssteuer-Rückforderung',
        description: `Bezahlte Verrechnungssteuer: CHF ${totalWithholding.toFixed(0)}. Dies kann teilweise zurückgefordert werden.`,
        savings: totalWithholding * 0.5,
        priority: 'high',
        action: 'Reichen Sie eine Rückforderung bei der Steueramt ein.'
      });
      potentialSavings += totalWithholding * 0.5;
    }

    // Check 2: Mortgage interest deduction for real estate
    const totalMortgageInterest = realEstates.reduce((sum, re) => sum + (re.mortgage_interest_deductible || 0), 0);
    if (totalMortgageInterest > 1000) {
      recommendations.push({
        id: 'mortgage_interest',
        title: 'Hypothekarzins-Abzug optimieren',
        description: `Abzugsberechtigte Hypothekarzinsen: CHF ${totalMortgageInterest.toFixed(0)}. Diese sind vollständig vom steuerbaren Einkommen abzugsfähig.`,
        savings: totalMortgageInterest * 0.25, // average tax rate
        priority: 'high',
        action: 'Stellen Sie sicher, dass alle Hypothekarzinsen dokumentiert sind.'
      });
      potentialSavings += totalMortgageInterest * 0.25;
    }

    // Check 3: Diversification to reduce wealth tax
    const totalWealth = investments.reduce((sum, inv) => sum + (inv.quantity * inv.current_value), 0) +
                        realEstates.reduce((sum, re) => sum + re.current_market_value, 0);
    if (totalWealth > 500000) {
      recommendations.push({
        id: 'wealth_diversification',
        title: 'Vermögensstrukturierung für Kantonssteuer',
        description: `Gesamtvermögen: CHF ${totalWealth.toFixed(0)}. Eine strategische Diversifizierung kann Vermögenssteuer sparen.`,
        savings: (totalWealth * 0.01) * 0.05, // estimate
        priority: 'medium',
        action: 'Beraten Sie sich mit einem Steuerberater zur optimalen Struktur.'
      });
    }

    // Check 4: Tax-loss harvesting opportunities
    const unrealizedLosses = investments.filter(inv => (inv.quantity * inv.current_value) < (inv.quantity * inv.acquisition_price));
    if (unrealizedLosses.length > 0) {
      const totalLosses = unrealizedLosses.reduce((sum, inv) => 
        sum + ((inv.quantity * inv.acquisition_price) - (inv.quantity * inv.current_value)), 0);
      recommendations.push({
        id: 'tax_loss_harvesting',
        title: 'Tax-Loss Harvesting',
        description: `${unrealizedLosses.length} Positionen mit Kursverlusten: CHF ${totalLosses.toFixed(0)}. Realisierte Verluste senken steuerbares Einkommen.`,
        savings: totalLosses * 0.3, // average cantonal rate
        priority: 'medium',
        action: 'Realisieren Sie Verluste vor Jahresende für Steueroptimierung.'
      });
      potentialSavings += totalLosses * 0.3;
    }

    return Response.json({
      success: true,
      country: 'CH',
      canton,
      taxYear,
      recommendations: recommendations.sort((a, b) => 
        (b.priority === 'high' ? 3 : b.priority === 'medium' ? 2 : 1) - 
        (a.priority === 'high' ? 3 : a.priority === 'medium' ? 2 : 1)
      ),
      summary: {
        totalRecommendations: recommendations.length,
        estimatedSavings: potentialSavings.toFixed(2),
        currency: 'CHF'
      }
    });

  } catch (error) {
    console.error('CH tax optimization error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});