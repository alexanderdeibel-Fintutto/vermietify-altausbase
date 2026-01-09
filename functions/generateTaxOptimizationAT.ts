import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { userId, taxYear } = await req.json();

    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch data
    const investments = await base44.entities.InvestmentAT.filter({ tax_year: taxYear }) || [];
    const otherIncomes = await base44.entities.OtherIncomeAT.filter({ tax_year: taxYear }) || [];
    const capitalGains = await base44.entities.CapitalGainAT.filter({ tax_year: taxYear }) || [];

    const recommendations = [];
    let potentialSavings = 0;

    // Check 1: Sparerfreibetrag fully utilized?
    const totalInvestmentIncome = investments.reduce((sum, inv) => sum + inv.gross_income, 0);
    const sparerAllowance = 730;
    if (totalInvestmentIncome > sparerAllowance) {
      const unusedAllowance = sparerAllowance - (investments[0]?.sparer_allowance_used || 0);
      if (unusedAllowance > 0) {
        recommendations.push({
          id: 'sparer_allowance',
          title: 'Sparerfreibetrag optimieren',
          description: `Sie nutzen den Sparerfreibetrag von €${sparerAllowance} noch nicht vollständig. €${unusedAllowance} können steuerfrei veranlagt werden.`,
          savings: unusedAllowance * 0.275, // 27.5% KESt
          priority: 'high',
          action: 'Überprüfen Sie, ob weitere Sparkonten/Fonds unter dem Sparerfreibetrag liegen.'
        });
        potentialSavings += unusedAllowance * 0.275;
      }
    }

    // Check 2: Spekulationsfristen bei Veräußerungen
    const unrealizedGains = capitalGains.filter(cg => cg.holding_period_years < 1);
    if (unrealizedGains.length > 0) {
      recommendations.push({
        id: 'holding_period',
        title: 'Spekulationsfrist beachten',
        description: `${unrealizedGains.length} Veräußerungen liegen unter der 1-Jahres-Frist und könnten steuerpflichtig sein.`,
        savings: unrealizedGains.reduce((sum, g) => sum + g.gain_loss * 0.42, 0), // Top tax rate
        priority: 'medium',
        action: 'Erwägen Sie, Verkäufe zu verschieben oder Verluste gegenzurechnen.'
      });
    }

    // Check 3: Kirchensteuer minimieren
    const churchTax = investments.reduce((sum, inv) => sum + (inv.church_tax || 0), 0);
    if (churchTax > 50) {
      recommendations.push({
        id: 'church_tax',
        title: 'Kirchensteuer reduzieren',
        description: `Aktuelle Kirchensteuer: €${churchTax.toFixed(2)}. Austritt könnte Ersparnisse bringen.`,
        savings: churchTax,
        priority: 'low',
        action: 'Überprüfen Sie persönliche Optionen.'
      });
    }

    // Check 4: Werbungskosten bei Kapitalanlagen
    const totalInvestments = investments.length;
    if (totalInvestments > 5) {
      recommendations.push({
        id: 'advertising_costs',
        title: 'Verwaltungsgebühren als Werbungskosten',
        description: `Bei ${totalInvestments} Anlagen können Verwaltungsgebühren als Werbungskosten geltend gemacht werden.`,
        savings: totalInvestments * 50, // estimate
        priority: 'medium',
        action: 'Sammeln Sie Kontoauszüge mit ausgewiesenen Gebühren.'
      });
      potentialSavings += totalInvestments * 50 * 0.42;
    }

    return Response.json({
      success: true,
      country: 'AT',
      taxYear,
      recommendations: recommendations.sort((a, b) => 
        (b.priority === 'high' ? 3 : b.priority === 'medium' ? 2 : 1) - 
        (a.priority === 'high' ? 3 : a.priority === 'medium' ? 2 : 1)
      ),
      summary: {
        totalRecommendations: recommendations.length,
        estimatedSavings: potentialSavings.toFixed(2),
        currency: 'EUR'
      }
    });

  } catch (error) {
    console.error('Tax optimization error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});