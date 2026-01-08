import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { year, building_id } = await req.json();

    console.log(`[COST-ANALYSIS] Analyzing for ${year}`);

    const submissions = await base44.entities.ElsterSubmission.filter({
      tax_year: year,
      ...(building_id ? { building_id } : {})
    });

    const costBreakdown = {
      categories: {},
      total: 0,
      deductible: 0,
      non_deductible: 0
    };

    submissions.forEach(sub => {
      if (!sub.form_data) return;

      // Analysiere Werbungskosten
      Object.entries(sub.form_data).forEach(([field, value]) => {
        if (field.includes('werbungskosten') || field.includes('kosten')) {
          const amount = parseFloat(value) || 0;
          
          // Kategorisierung
          let category = 'Sonstige';
          if (field.includes('zinsen')) category = 'Finanzierungskosten';
          else if (field.includes('verwaltung')) category = 'Verwaltungskosten';
          else if (field.includes('instandhaltung')) category = 'Instandhaltung';
          else if (field.includes('afa')) category = 'AfA';
          else if (field.includes('nebenkosten')) category = 'Nebenkosten';

          if (!costBreakdown.categories[category]) {
            costBreakdown.categories[category] = 0;
          }
          costBreakdown.categories[category] += amount;
          costBreakdown.total += amount;
        }
      });
    });

    // Berechne Prozentsätze
    const categoryDetails = Object.entries(costBreakdown.categories).map(([name, amount]) => ({
      name,
      amount,
      percentage: costBreakdown.total > 0 ? Math.round((amount / costBreakdown.total) * 100) : 0
    })).sort((a, b) => b.amount - a.amount);

    const analysis = {
      year,
      total_costs: costBreakdown.total,
      categories: categoryDetails,
      insights: [],
      optimization_potential: 0
    };

    // Insights generieren
    const topCategory = categoryDetails[0];
    if (topCategory && topCategory.percentage > 40) {
      analysis.insights.push({
        type: 'concentration',
        message: `${topCategory.name} macht ${topCategory.percentage}% der Gesamtkosten aus`
      });
    }

    // Vergleich mit Vorjahr
    const lastYear = await base44.entities.ElsterSubmission.filter({
      tax_year: year - 1,
      ...(building_id ? { building_id } : {})
    });

    if (lastYear.length > 0) {
      let lastYearTotal = 0;
      lastYear.forEach(sub => {
        if (sub.form_data) {
          Object.entries(sub.form_data).forEach(([field, value]) => {
            if (field.includes('werbungskosten') || field.includes('kosten')) {
              lastYearTotal += parseFloat(value) || 0;
            }
          });
        }
      });

      const change = lastYearTotal > 0 
        ? Math.round(((costBreakdown.total - lastYearTotal) / lastYearTotal) * 100)
        : 0;

      analysis.yoy_change = change;
      
      if (Math.abs(change) > 15) {
        analysis.insights.push({
          type: 'trend',
          message: `Kosten ${change > 0 ? 'gestiegen' : 'gesunken'} um ${Math.abs(change)}% gegenüber Vorjahr`
        });
      }
    }

    console.log(`[COST-ANALYSIS] Total: €${costBreakdown.total.toLocaleString('de-DE')}`);

    return Response.json({
      success: true,
      analysis
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});