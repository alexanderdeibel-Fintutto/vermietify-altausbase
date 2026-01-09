import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { country, taxYear, canton } = await req.json();

    if (!country || !taxYear) {
      return Response.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const recommendations = [];

    // Austria Recommendations
    if (country === 'AT') {
      const investments = await base44.entities.InvestmentAT.filter({ tax_year: taxYear }) || [];
      const otherIncomes = await base44.entities.OtherIncomeAT.filter({ tax_year: taxYear }) || [];
      const capitalGains = await base44.entities.CapitalGainAT.filter({ tax_year: taxYear }) || [];

      const grossIncome = investments.reduce((s, i) => s + (i.gross_income || 0), 0);
      const kestPaid = investments.reduce((s, i) => s + (i.withheld_tax_kest || 0), 0);
      const losses = capitalGains.filter(c => c.gain_loss < 0).reduce((s, c) => s + Math.abs(c.gain_loss || 0), 0);

      // 1. KESt Optimization
      if (grossIncome > 0 && kestPaid / grossIncome > 0.25) {
        recommendations.push({
          planning_type: 'deduction_strategy',
          title: '🎯 KESt-Optimierung durch Sparerfreibetrag',
          description: 'Der Sparerfreibetrag von €730 pro Person kann zur Reduzierung der KESt genutzt werden. Übertragen Sie Investitionen auf den Partner, wenn dieser unter dem Freibetrag liegt.',
          estimated_savings: Math.min(730 * 0.27, kestPaid),
          implementation_effort: 'low',
          risk_level: 'low',
          deadline: `${taxYear}-05-31`
        });
      }

      // 2. Loss Harvesting
      if (losses > 100) {
        recommendations.push({
          planning_type: 'loss_harvesting',
          title: '📊 Steuerverlustausgleich',
          description: 'Sie haben Kursverluste von €' + losses.toLocaleString('de-DE') + '. Diese können zur Reduzierung anderer Kapitalerträge eingesetzt werden.',
          estimated_savings: losses * 0.42,
          implementation_effort: 'medium',
          risk_level: 'low',
          deadline: `${taxYear}-12-31`
        });
      }

      // 3. Income Deferral
      if (grossIncome > 5000) {
        recommendations.push({
          planning_type: 'timing_strategy',
          title: '⏳ Einkommensaufschub in nächstes Jahr',
          description: 'Verschieben Sie erwartete Dividendenzahlungen ins nächste Jahr, um Ihre Progression zu reduzieren.',
          estimated_savings: grossIncome * 0.15,
          implementation_effort: 'medium',
          risk_level: 'medium',
          deadline: `${taxYear}-12-15`
        });
      }

      // 4. Church Tax Exemption
      recommendations.push({
        planning_type: 'deduction_strategy',
        title: '⛪ Kirchensteuererklärung',
        description: 'Wenn Sie aus der Kirche austreten, sparen Sie die Kirchensteuer (bis 8-9% KESt). Prüfen Sie die lokalen Fristen.',
        estimated_savings: kestPaid * 0.08,
        implementation_effort: 'high',
        risk_level: 'low',
        deadline: `${taxYear}-06-30`
      });
    }

    // Switzerland Recommendations
    if (country === 'CH') {
      const securities = await base44.entities.InvestmentCH.filter({ tax_year: taxYear, canton }) || [];
      const realEstate = await base44.entities.RealEstateCH.filter({ tax_year: taxYear, canton }) || [];

      const totalWealth = securities.reduce((s, inv) => s + (inv.current_value || 0) * (inv.quantity || 1), 0) +
                         realEstate.reduce((s, re) => s + (re.current_market_value || 0), 0);
      
      const mortgageDebt = realEstate.reduce((s, re) => s + (re.mortgage_debt || 0), 0);
      const mortgageInterest = realEstate.reduce((s, re) => s + (re.mortgage_interest_deductible || 0), 0);

      // 1. Mortgage Interest Optimization
      if (mortgageDebt > 100000) {
        const estimatedSavings = mortgageDebt * 0.02 * 0.22; // 2% interest rate * 22% avg tax rate
        recommendations.push({
          planning_type: 'deduction_strategy',
          title: '🏦 Hypothekarzinsen maximieren',
          description: 'Erhöhen Sie die Hypothek bei niedrigen Zinsen. Die Zinsen sind vollständig abzugsfähig.',
          estimated_savings: estimatedSavings,
          implementation_effort: 'medium',
          risk_level: 'medium',
          deadline: `${taxYear}-12-31`
        });
      }

      // 2. Wealth Tax Threshold
      const wealthTaxThreshold = 500000; // Typical for ZH
      if (totalWealth > wealthTaxThreshold) {
        recommendations.push({
          planning_type: 'wealth_tax_reduction',
          title: '💼 Vermögenssteuer-Optimierung',
          description: 'Ihr Vermögen übersteigt den Freibetrag. Erwägen Sie strategische Spenden oder Schenkungen.',
          estimated_savings: (totalWealth - wealthTaxThreshold) * 0.03 * 0.5,
          implementation_effort: 'high',
          risk_level: 'low',
          deadline: `${taxYear}-12-31`
        });
      }

      // 3. Capital Gains Planning
      recommendations.push({
        planning_type: 'capital_gains_planning',
        title: '📈 Veräußerungstiming',
        description: 'In der Schweiz sind kurzfristige Veräußerungsgewinne in den Kanton steuerpflichtig. Überprüfen Sie die Zeitpunkte vor dem Verkauf.',
        estimated_savings: totalWealth * 0.03 * 0.2,
        implementation_effort: 'medium',
        risk_level: 'low',
        deadline: `${taxYear}-12-31`
      });

      // 4. Pillar 3a Contribution
      recommendations.push({
        planning_type: 'deduction_strategy',
        title: '🎯 Säule 3a Beitrag',
        description: 'Maximale Säule 3a Beiträge (CHF 7\'056 für 2024) erhalten einen Steuerabzug und Vermögensschutz.',
        estimated_savings: 7056 * 0.22,
        implementation_effort: 'low',
        risk_level: 'low',
        deadline: `${taxYear}-12-31`
      });
    }

    // Germany Recommendations
    if (country === 'DE') {
      const investments = await base44.entities.InvestmentAT.filter({ tax_year: taxYear }) || [];
      const gains = investments.reduce((s, i) => s + Math.max(0, (i.gross_income || 0) - (i.withheld_tax || 0)), 0);

      // 1. Saver Allowance
      const saverAllowance = 801; // €801 Sparerpauschbetrag
      const usedAllowance = investments.reduce((s, i) => s + (i.allowance_used || 0), 0);
      
      if (usedAllowance < saverAllowance) {
        recommendations.push({
          planning_type: 'deduction_strategy',
          title: '💰 Sparerpauschbetrag maximieren',
          description: `Sie nutzen nur €${usedAllowance} des Sparerpauschbetrags von €${saverAllowance}. Transferieren Sie Wertpapiere auf Partner.`,
          estimated_savings: (saverAllowance - usedAllowance) * 0.42,
          implementation_effort: 'low',
          risk_level: 'low',
          deadline: `${taxYear}-12-31`
        });
      }

      // 2. Partial Withdrawal
      if (gains > 5000) {
        recommendations.push({
          planning_type: 'timing_strategy',
          title: '📊 Gestaffelte Realisierung',
          description: 'Verteilen Sie Gewinne auf mehrere Jahre, um die Progression zu reduzieren.',
          estimated_savings: gains * 0.15,
          implementation_effort: 'medium',
          risk_level: 'low',
          deadline: `${taxYear}-12-31`
        });
      }

      // 3. Loss Harvesting
      recommendations.push({
        planning_type: 'loss_harvesting',
        title: '🎯 Steuerverlustausgleich',
        description: 'Realisieren Sie Kursverluste zur Reduzierung von Kursgewinnen. Beachten Sie die 30-Tage-Frist (Spekulationsfrist).',
        estimated_savings: gains * 0.42 * 0.3,
        implementation_effort: 'medium',
        risk_level: 'medium',
        deadline: `${taxYear}-12-10`
      });

      // 4. Church Tax Reduction
      recommendations.push({
        planning_type: 'deduction_strategy',
        title: '⛪ Kirchensteuer vermeiden',
        description: 'Ein Kirchenaustritt spart Kirchensteuer (8-9% auf KESt). Beachten Sie lokale Kündigungsfristen.',
        estimated_savings: gains * 0.42 * 0.08,
        implementation_effort: 'high',
        risk_level: 'low',
        deadline: `${taxYear}-06-30`
      });
    }

    return Response.json({
      status: 'success',
      country,
      tax_year: taxYear,
      recommendations: recommendations.sort((a, b) => (b.estimated_savings || 0) - (a.estimated_savings || 0)),
      total_estimated_savings: recommendations.reduce((s, r) => s + (r.estimated_savings || 0), 0)
    });
  } catch (error) {
    console.error('Tax optimization error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});