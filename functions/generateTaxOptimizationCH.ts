import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { taxYear, canton } = await req.json();

    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    console.log(`Generating CH tax optimization recommendations for ${taxYear} in canton ${canton}`);

    // Fetch all data
    const [investments, realEstates, otherIncomes, cantonConfigs] = await Promise.all([
      base44.entities.InvestmentCH.filter({ tax_year: taxYear, canton }) || [],
      base44.entities.RealEstateCH.filter({ tax_year: taxYear, canton }) || [],
      base44.entities.OtherIncomeCH.filter({ tax_year: taxYear, canton }) || [],
      base44.entities.CantonConfig.filter({ canton_code: canton }) || []
    ]);

    const cantonConfig = cantonConfigs[0];
    const recommendations = [];

    // Recommendation 1: Mortgage Interest Deduction
    const totalMortgageInterest = realEstates.reduce((s, re) => s + (re.mortgage_interest_deductible || 0), 0);
    const underutilizedProperties = realEstates.filter(
      re => re.mortgage_debt > 0 && (!re.mortgage_interest_deductible || re.mortgage_interest_deductible === 0)
    );
    if (underutilizedProperties.length > 0) {
      const estimatedSavings = underutilizedProperties.reduce((s, p) => {
        const interest = (p.mortgage_debt || 0) * 0.02; // 2% average rate
        return s + interest;
      }, 0);
      recommendations.push({
        id: 'mortgage_deduction',
        title: 'Hypothekarzinsen vollständig abziehen',
        description: `${underutilizedProperties.length} Immobilie(n) ohne Zinsabzug`,
        priority: 'high',
        potentialSavings: estimatedSavings * (0.077 + (cantonConfig?.cantonal_income_tax_rate || 0.08)),
        recommendation: 'Dokumentieren Sie alle Hypothekarzinsen der steuerpflichtigen Immobilien',
        impact: 'Immobiliensteuern-Optimierung'
      });
    }

    // Recommendation 2: Wealth Tax Threshold
    const totalWealth = investments.reduce((s, i) => s + (i.current_value * i.quantity), 0) +
                        realEstates.reduce((s, r) => s + (r.current_market_value || 0), 0);
    const wealthThreshold = cantonConfig?.wealth_tax_threshold || 100000;
    if (totalWealth > wealthThreshold && totalWealth < wealthThreshold * 1.15) {
      recommendations.push({
        id: 'wealth_threshold',
        title: 'Vermögenssteuer-Schwellenwert prüfen',
        description: 'Ihr Vermögen liegt nahe dem kantonalen Steuerschwellenwert',
        priority: 'medium',
        potentialSavings: (totalWealth - wealthThreshold) * (cantonConfig?.wealth_tax_rate || 0.001),
        recommendation: 'Prüfen Sie Strategien zur Vermögensoptimierung um den Schwellenwert',
        impact: 'Vermögenssteuer-Reduktion'
      });
    }

    // Recommendation 3: Property Tax Optimization
    const totalPropertyTax = realEstates.reduce((s, r) => s + (r.property_tax || 0), 0);
    const propertiesWithoutTax = realEstates.filter(r => !r.property_tax || r.property_tax === 0).length;
    if (propertiesWithoutTax > 0) {
      recommendations.push({
        id: 'property_tax',
        title: 'Liegenschaftssteuer erfassen',
        description: `${propertiesWithoutTax} Immobilie(n) ohne erfasste Liegenschaftssteuer`,
        priority: 'medium',
        potentialSavings: propertiesWithoutTax * 1000 * (cantonConfig?.cantonal_income_tax_rate || 0.08),
        recommendation: 'Ermitteln und dokumentieren Sie die kantonale Liegenschaftssteuer',
        impact: 'Kostenabzug optimierung'
      });
    }

    // Recommendation 4: Withholding Tax Credit
    const withholdingTaxPaid = investments.reduce((s, i) => s + (i.withholding_tax_paid || 0), 0);
    if (withholdingTaxPaid === 0 && investments.length > 0 && investments.some(i => i.dividend_income > 0)) {
      recommendations.push({
        id: 'withholding_credit',
        title: 'Verrechnungssteuer nicht geltend gemacht',
        description: 'Sie haben Dividendeneinkommen, aber keine Verrechnungssteuer verbucht',
        priority: 'high',
        potentialSavings: investments.reduce((s, i) => s + ((i.dividend_income || 0) * 0.35 * 0.5), 0),
        recommendation: 'Erfassen Sie die bezahlte Verrechnungssteuer für Kreditanrechnung',
        impact: 'Steuergutschrift'
      });
    }

    // Recommendation 5: Imputed Rent Liability
    const primaryResidences = realEstates.filter(r => r.is_primary_residence);
    const hasImputedRentTaxation = cantonConfig?.imputed_rent_taxable || false;
    if (primaryResidences.length > 0 && hasImputedRentTaxation) {
      recommendations.push({
        id: 'imputed_rent',
        title: 'Eigenmietwert-Besteuerung prüfen',
        description: `Ihr Kanton besteuert Eigenmietwert (${primaryResidences.length} Hauptwohnsitz)`,
        priority: 'low',
        potentialSavings: 0, // Just informational
        recommendation: 'Informieren Sie sich über kantonale Regelungen zum Eigenmietwert',
        impact: 'Informativ'
      });
    }

    const totalPotentialSavings = recommendations.reduce((s, r) => s + r.potentialSavings, 0);

    return Response.json({
      success: true,
      taxYear,
      canton,
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