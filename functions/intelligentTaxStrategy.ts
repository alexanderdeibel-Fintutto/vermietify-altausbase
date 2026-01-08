import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { building_id, years = 3 } = await req.json();

    console.log(`[TAX-STRATEGY] Analyzing ${years} years for building ${building_id}`);

    const submissions = await base44.entities.ElsterSubmission.filter({
      building_id,
      status: { $in: ['VALIDATED', 'ACCEPTED'] }
    }, '-tax_year', years * 2);

    const strategy = {
      trends: {},
      recommendations: [],
      optimization_potential: 0,
      risk_assessment: 'low'
    };

    // Analysiere Trends
    const yearlyData = {};
    submissions.forEach(sub => {
      if (!yearlyData[sub.tax_year]) {
        yearlyData[sub.tax_year] = { einnahmen: 0, ausgaben: 0, count: 0 };
      }
      yearlyData[sub.tax_year].einnahmen += parseFloat(sub.form_data?.einnahmen_gesamt || 0);
      yearlyData[sub.tax_year].ausgaben += parseFloat(sub.form_data?.werbungskosten_gesamt || 0);
      yearlyData[sub.tax_year].count++;
    });

    // Erkenne Muster
    const years_arr = Object.keys(yearlyData).map(Number).sort();
    if (years_arr.length >= 2) {
      const latestYear = years_arr[years_arr.length - 1];
      const prevYear = years_arr[years_arr.length - 2];
      
      const einnahmenTrend = ((yearlyData[latestYear].einnahmen - yearlyData[prevYear].einnahmen) / yearlyData[prevYear].einnahmen) * 100;
      const ausgabenTrend = ((yearlyData[latestYear].ausgaben - yearlyData[prevYear].ausgaben) / yearlyData[prevYear].ausgaben) * 100;

      strategy.trends = {
        einnahmen_change: Math.round(einnahmenTrend),
        ausgaben_change: Math.round(ausgabenTrend),
        direction: einnahmenTrend > ausgabenTrend ? 'improving' : 'declining'
      };

      // Empfehlungen
      if (ausgabenTrend > einnahmenTrend + 10) {
        strategy.recommendations.push({
          type: 'cost_control',
          priority: 'high',
          message: 'Ausgaben steigen schneller als Einnahmen - Kostenoptimierung empfohlen'
        });
      }

      if (yearlyData[latestYear].ausgaben / yearlyData[latestYear].einnahmen > 0.8) {
        strategy.recommendations.push({
          type: 'margin_improvement',
          priority: 'medium',
          message: 'Niedrige Gewinnmarge - prüfen Sie Mieterhöhungspotenzial'
        });
      }
    }

    return Response.json({ success: true, strategy });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});