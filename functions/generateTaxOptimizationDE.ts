import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taxYear } = await req.json();

    if (!taxYear) {
      return Response.json({ error: 'Missing taxYear' }, { status: 400 });
    }

    const investments = await base44.entities.InvestmentAT.filter({ tax_year: taxYear }) || [];
    const otherIncomes = await base44.entities.OtherIncomeAT.filter({ tax_year: taxYear }) || [];
    const capitalGains = await base44.entities.CapitalGainAT.filter({ tax_year: taxYear }) || [];

    const recommendations = [];

    // 1. Sparerpauschbetrag Optimierung (€801 für Einzelne)
    const totalWithholding = investments.reduce((s, i) => s + (i.withheld_tax_kest || 0), 0);
    const allowanceUsed = investments.reduce((s, i) => s + (i.sparer_allowance_used || 0), 0);
    if (allowanceUsed < 801) {
      recommendations.push({
        id: 'sparer_allowance',
        title: 'Sparerpauschbetrag ausschöpfen',
        description: `Sie nutzen nur €${allowanceUsed} des €801 Sparerpauschbetrags.`,
        priority: 'high',
        potentialSavings: (801 - allowanceUsed) * 0.26,
        recommendation: `Verteilen Sie Ihre Kapitalerträge auf mehrere Konten oder nutzen Sie die volle Freibetrag durch geschickte Planung.`,
        impact: `Spart bis zu €${((801 - allowanceUsed) * 0.26).toLocaleString('de-DE')} Abgeltungssteuer`
      });
    }

    // 2. Verlustverrechnung
    const totalLosses = Math.abs(capitalGains.filter(c => (c.gain_loss || 0) < 0).reduce((s, c) => s + (c.gain_loss || 0), 0));
    if (totalLosses > 0) {
      recommendations.push({
        id: 'loss_offset',
        title: 'Verlustverrechnung optimieren',
        description: `Sie haben €${totalLosses.toLocaleString('de-DE')} Veräußerungsverluste.`,
        priority: 'high',
        potentialSavings: totalLosses * 0.42,
        recommendation: 'Nutzen Sie die Verluste zur Verrechnung mit Gewinnen oder zur Minimierung zu versteuernder Einkünfte.',
        impact: `Spart bis zu €${(totalLosses * 0.42).toLocaleString('de-DE')} Einkommensteuer`
      });
    }

    // 3. Kirchensteuer Überprüfung
    const churchTax = investments.reduce((s, i) => s + (i.church_tax || 0), 0);
    if (churchTax > 0) {
      recommendations.push({
        id: 'church_tax',
        title: 'Kirchensteuer überprüfen',
        description: `Sie zahlen €${churchTax.toLocaleString('de-DE')} Kirchensteuer pro Jahr.`,
        priority: 'medium',
        potentialSavings: churchTax,
        recommendation: 'Falls nicht religiös motiviert, könnte Austritt aus der Kirche erhebliche Ersparnisse bringen.',
        impact: `Ersparnis: €${churchTax.toLocaleString('de-DE')} pro Jahr`
      });
    }

    // 4. Werbungskosten bei Kapitalanlagen
    recommendations.push({
      id: 'werbungskosten',
      title: 'Werbungskosten bei Kapitalanlage',
      description: 'Investmentgebühren und Beratungskosten können teilweise abzugsfähig sein.',
      priority: 'medium',
      potentialSavings: (investments.length * 200) * 0.26,
      recommendation: 'Dokumentieren Sie alle Verwaltungsgebühren und Beratungskosten - diese können als Werbungskosten geltend gemacht werden.',
      impact: `Potenzielle Ersparnis: €${((investments.length * 200) * 0.26).toLocaleString('de-DE')}`
    });

    // 5. Gewinne realisieren vs. unrealisierte Gewinne
    recommendations.push({
      id: 'gain_timing',
      title: 'Gewinnrealisierung über Jahre verteilen',
      description: 'Größere Veräußerungsgewinne können in mehreren Jahren realisiert werden.',
      priority: 'medium',
      potentialSavings: 0,
      recommendation: 'Überprüfen Sie, ob die Realisierung größerer Veräußerungsgewinne in mehreren Steuerjahren sinnvoll ist.',
      impact: 'Kann progressive Steuerersparnis ermöglichen'
    });

    const summary = {
      totalRecommendations: recommendations.length,
      highPriority: recommendations.filter(r => r.priority === 'high').length,
      totalPotentialSavings: recommendations.reduce((s, r) => s + (r.potentialSavings || 0), 0)
    };

    return Response.json({
      recommendations: recommendations.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }),
      summary
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});