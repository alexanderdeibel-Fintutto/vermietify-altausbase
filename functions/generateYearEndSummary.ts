import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tax_year } = await req.json();
    const year = tax_year || new Date().getFullYear() - 1;

    console.log(`[YEAR END SUMMARY] Generating for year ${year}`);

    // Hole alle Submissions für das Jahr
    const submissions = await base44.entities.ElsterSubmission.filter({ tax_year: year });

    // Hole alle Buildings
    const buildings = await base44.entities.Building.list();

    // Statistiken
    const stats = {
      total_submissions: submissions.length,
      by_status: {},
      by_form_type: {},
      avg_confidence: 0,
      total_income: 0,
      total_expenses: 0,
      total_afa: 0,
      net_result: 0
    };

    submissions.forEach(sub => {
      // Status count
      stats.by_status[sub.status] = (stats.by_status[sub.status] || 0) + 1;
      
      // Form type count
      stats.by_form_type[sub.tax_form_type] = (stats.by_form_type[sub.tax_form_type] || 0) + 1;

      // Confidence
      if (sub.ai_confidence_score) {
        stats.avg_confidence += sub.ai_confidence_score;
      }

      // Financials
      if (sub.form_data) {
        stats.total_income += sub.form_data.income_rent || 0;
        
        const expenses = Object.entries(sub.form_data)
          .filter(([key]) => key.startsWith('expense_'))
          .reduce((sum, [_, value]) => sum + (value || 0), 0);
        
        stats.total_expenses += expenses;
        stats.total_afa += sub.form_data.afa_amount || 0;
      }
    });

    if (submissions.length > 0) {
      stats.avg_confidence = Math.round(stats.avg_confidence / submissions.length);
    }

    stats.net_result = stats.total_income - stats.total_expenses - stats.total_afa;

    // Per-Building Breakdown
    const buildingBreakdown = buildings.map(building => {
      const buildingSubmissions = submissions.filter(s => s.building_id === building.id);
      
      if (buildingSubmissions.length === 0) {
        return {
          building_id: building.id,
          building_name: building.name || building.address,
          status: 'no_submission',
          submissions: []
        };
      }

      const buildingStats = {
        building_id: building.id,
        building_name: building.name || building.address,
        submissions_count: buildingSubmissions.length,
        income: 0,
        expenses: 0,
        afa: 0,
        net_result: 0,
        submissions: buildingSubmissions.map(sub => ({
          id: sub.id,
          form_type: sub.tax_form_type,
          status: sub.status,
          confidence: sub.ai_confidence_score
        }))
      };

      buildingSubmissions.forEach(sub => {
        if (sub.form_data) {
          buildingStats.income += sub.form_data.income_rent || 0;
          
          const expenses = Object.entries(sub.form_data)
            .filter(([key]) => key.startsWith('expense_'))
            .reduce((sum, [_, value]) => sum + (value || 0), 0);
          
          buildingStats.expenses += expenses;
          buildingStats.afa += sub.form_data.afa_amount || 0;
        }
      });

      buildingStats.net_result = buildingStats.income - buildingStats.expenses - buildingStats.afa;

      return buildingStats;
    });

    // Recommendations
    const recommendations = [];

    // Missing submissions
    const buildingsWithoutSubmission = buildingBreakdown.filter(b => b.status === 'no_submission');
    if (buildingsWithoutSubmission.length > 0) {
      recommendations.push({
        priority: 'high',
        title: 'Fehlende Submissions',
        description: `${buildingsWithoutSubmission.length} Gebäude ohne Submission für ${year}`,
        action: 'Erstellen Sie Submissions für alle Gebäude',
        buildings: buildingsWithoutSubmission.map(b => b.building_name)
      });
    }

    // Low confidence
    const lowConfidenceSubmissions = submissions.filter(s => s.ai_confidence_score < 70);
    if (lowConfidenceSubmissions.length > 0) {
      recommendations.push({
        priority: 'medium',
        title: 'Niedrige KI-Vertrauen',
        description: `${lowConfidenceSubmissions.length} Submissions mit < 70% Vertrauen`,
        action: 'Manuelle Überprüfung empfohlen'
      });
    }

    // Draft submissions
    const draftSubmissions = submissions.filter(s => s.status === 'DRAFT');
    if (draftSubmissions.length > 0) {
      recommendations.push({
        priority: 'medium',
        title: 'Entwürfe vorhanden',
        description: `${draftSubmissions.length} Submissions noch im Entwurf-Status`,
        action: 'Validieren und einreichen'
      });
    }

    console.log('[SUCCESS] Year-end summary generated');

    return Response.json({
      success: true,
      tax_year: year,
      generated_at: new Date().toISOString(),
      summary: stats,
      building_breakdown: buildingBreakdown,
      recommendations
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});