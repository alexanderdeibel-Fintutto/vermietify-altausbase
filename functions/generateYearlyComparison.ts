import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { building_id, years } = await req.json();

    if (!years || years.length < 2) {
      return Response.json({ error: 'At least 2 years required' }, { status: 400 });
    }

    console.log(`[YEARLY-COMPARISON] Comparing years ${years.join(', ')}`);

    const comparison = {
      years,
      building_id,
      data: [],
      trends: {},
      recommendations: []
    };

    for (const year of years) {
      const submissions = await base44.entities.ElsterSubmission.filter({
        tax_year: year,
        ...(building_id ? { building_id } : {})
      });

      const yearData = {
        year,
        submission_count: submissions.length,
        total_einnahmen: 0,
        total_ausgaben: 0,
        avg_confidence: 0
      };

      submissions.forEach(sub => {
        const formData = sub.form_data || {};
        yearData.total_einnahmen += parseFloat(formData.einnahmen_gesamt || 0);
        yearData.total_ausgaben += parseFloat(formData.werbungskosten_gesamt || 0);
        
        if (sub.ai_confidence_score) {
          yearData.avg_confidence += sub.ai_confidence_score;
        }
      });

      if (submissions.length > 0) {
        yearData.avg_confidence = Math.round(yearData.avg_confidence / submissions.length);
      }

      yearData.nettoertrag = yearData.total_einnahmen - yearData.total_ausgaben;
      
      comparison.data.push(yearData);
    }

    // Berechne Trends
    if (comparison.data.length >= 2) {
      const sorted = comparison.data.sort((a, b) => a.year - b.year);
      const first = sorted[0];
      const last = sorted[sorted.length - 1];

      comparison.trends = {
        einnahmen_trend: last.total_einnahmen > first.total_einnahmen ? 'STEIGEND' : 'FALLEND',
        einnahmen_change_percent: first.total_einnahmen > 0 
          ? Math.round(((last.total_einnahmen - first.total_einnahmen) / first.total_einnahmen) * 100)
          : 0,
        ausgaben_trend: last.total_ausgaben > first.total_ausgaben ? 'STEIGEND' : 'FALLEND',
        ausgaben_change_percent: first.total_ausgaben > 0
          ? Math.round(((last.total_ausgaben - first.total_ausgaben) / first.total_ausgaben) * 100)
          : 0
      };

      // Generiere Empfehlungen
      if (comparison.trends.ausgaben_change_percent > 20) {
        comparison.recommendations.push(
          'Ausgaben sind deutlich gestiegen (+' + comparison.trends.ausgaben_change_percent + '%). Prüfen Sie Optimierungspotenziale.'
        );
      }

      if (comparison.trends.einnahmen_trend === 'FALLEND') {
        comparison.recommendations.push(
          'Einnahmen sind rückläufig. Erwägen Sie Mietanpassungen oder neue Vermarktungsstrategien.'
        );
      }
    }

    console.log(`[YEARLY-COMPARISON] Generated for ${comparison.data.length} years`);

    return Response.json({
      success: true,
      comparison
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});