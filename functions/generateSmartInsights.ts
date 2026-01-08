import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { year, building_id } = await req.json();

    console.log(`[INSIGHTS] Generating for year ${year}`);

    const submissions = await base44.entities.ElsterSubmission.filter({
      tax_year: year,
      ...(building_id ? { building_id } : {})
    });

    const insights = {
      overview: {},
      recommendations: [],
      warnings: [],
      opportunities: []
    };

    if (submissions.length === 0) {
      return Response.json({ 
        success: true, 
        insights: { message: 'Keine Daten für Insights' } 
      });
    }

    // Berechne Kennzahlen
    const totalEinnahmen = submissions.reduce((sum, sub) => 
      sum + parseFloat(sub.form_data?.einnahmen_gesamt || 0), 0
    );
    const totalAusgaben = submissions.reduce((sum, sub) => 
      sum + parseFloat(sub.form_data?.werbungskosten_gesamt || 0), 0
    );

    insights.overview = {
      total_einnahmen: totalEinnahmen,
      total_ausgaben: totalAusgaben,
      nettoertrag: totalEinnahmen - totalAusgaben,
      kostenquote: totalEinnahmen > 0 ? Math.round((totalAusgaben / totalEinnahmen) * 100) : 0,
      submission_count: submissions.length
    };

    // Empfehlungen
    if (insights.overview.kostenquote > 80) {
      insights.recommendations.push({
        type: 'cost_optimization',
        priority: 'high',
        message: 'Kostenquote über 80% - Prüfen Sie Optimierungspotenziale'
      });
    }

    if (submissions.some(s => s.ai_confidence_score < 70)) {
      insights.warnings.push({
        type: 'low_confidence',
        message: 'Einige Submissions haben niedrige KI-Vertrauenswerte'
      });
    }

    // Vergleich mit Vorjahr
    const lastYear = await base44.entities.ElsterSubmission.filter({
      tax_year: year - 1,
      ...(building_id ? { building_id } : {})
    });

    if (lastYear.length > 0) {
      const lastYearEinnahmen = lastYear.reduce((sum, sub) => 
        sum + parseFloat(sub.form_data?.einnahmen_gesamt || 0), 0
      );
      
      const growth = totalEinnahmen > 0 
        ? Math.round(((totalEinnahmen - lastYearEinnahmen) / lastYearEinnahmen) * 100)
        : 0;

      insights.overview.yoy_growth = growth;

      if (growth > 10) {
        insights.opportunities.push({
          type: 'growth',
          message: `Starkes Wachstum: +${growth}% gegenüber Vorjahr`
        });
      }
    }

    console.log(`[INSIGHTS] Generated ${insights.recommendations.length} recommendations`);

    return Response.json({
      success: true,
      insights
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});