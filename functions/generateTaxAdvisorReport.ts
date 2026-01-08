import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tax_year, include_all_buildings = false } = await req.json();
    const year = tax_year || new Date().getFullYear() - 1;

    console.log(`[REPORT] Generating tax advisor report for ${year}`);

    // Hole alle Submissions für das Jahr
    const submissions = await base44.entities.ElsterSubmission.filter({
      tax_year: year,
      created_by: user.email
    });

    // Hole Gebäude-Informationen
    const buildingIds = [...new Set(submissions.map(s => s.building_id).filter(Boolean))];
    const buildings = await Promise.all(
      buildingIds.map(id => base44.entities.Building.filter({ id }))
    );
    const buildingsMap = Object.fromEntries(
      buildings.flat().map(b => [b.id, b])
    );

    // Berechne Gesamt-Statistiken
    const totalIncome = submissions.reduce((sum, s) => sum + (s.form_data?.income_rent || 0), 0);
    const totalExpenses = submissions.reduce((sum, s) => {
      return sum + Object.entries(s.form_data || {})
        .filter(([key]) => key.startsWith('expense_'))
        .reduce((expSum, [_, value]) => expSum + value, 0);
    }, 0);
    const totalAfa = submissions.reduce((sum, s) => sum + (s.form_data?.afa_amount || 0), 0);
    const netResult = totalIncome - totalExpenses - totalAfa;

    // Gruppiere nach Status
    const byStatus = submissions.reduce((acc, s) => {
      acc[s.status] = (acc[s.status] || 0) + 1;
      return acc;
    }, {});

    // Top Ausgaben-Kategorien
    const expenseCategories = {};
    submissions.forEach(s => {
      Object.entries(s.form_data || {})
        .filter(([key]) => key.startsWith('expense_'))
        .forEach(([key, value]) => {
          expenseCategories[key] = (expenseCategories[key] || 0) + value;
        });
    });

    // Sortiere Kategorien
    const topExpenses = Object.entries(expenseCategories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Erstelle detaillierte Gebäude-Übersicht
    const buildingDetails = submissions.map(s => {
      const building = buildingsMap[s.building_id];
      return {
        submission_id: s.id,
        building_name: building?.name || building?.address || 'Unbekannt',
        form_type: s.tax_form_type,
        status: s.status,
        income: s.form_data?.income_rent || 0,
        expenses: Object.entries(s.form_data || {})
          .filter(([key]) => key.startsWith('expense_'))
          .reduce((sum, [_, value]) => sum + value, 0),
        afa: s.form_data?.afa_amount || 0,
        result: (s.form_data?.income_rent || 0) - 
                Object.entries(s.form_data || {})
                  .filter(([key]) => key.startsWith('expense_'))
                  .reduce((sum, [_, value]) => sum + value, 0) - 
                (s.form_data?.afa_amount || 0),
        confidence_score: s.ai_confidence_score || 0
      };
    });

    // Berechne Steuer-Schätzung (vereinfacht)
    const estimatedTaxRate = 0.25; // 25% durchschnittlicher Steuersatz
    const estimatedTaxSavings = netResult < 0 ? Math.abs(netResult) * estimatedTaxRate : 0;

    const report = {
      meta: {
        year,
        generated_at: new Date().toISOString(),
        generated_by: user.email,
        user_name: user.full_name
      },
      summary: {
        total_submissions: submissions.length,
        total_income: Math.round(totalIncome * 100) / 100,
        total_expenses: Math.round(totalExpenses * 100) / 100,
        total_afa: Math.round(totalAfa * 100) / 100,
        net_result: Math.round(netResult * 100) / 100,
        estimated_tax_savings: Math.round(estimatedTaxSavings * 100) / 100
      },
      status_breakdown: byStatus,
      top_expenses: topExpenses.map(([category, amount]) => ({
        category: category.replace('expense_', '').replace(/_/g, ' '),
        amount: Math.round(amount * 100) / 100
      })),
      buildings: buildingDetails,
      recommendations: []
    };

    // Automatische Empfehlungen
    if (totalExpenses / totalIncome < 0.3 && totalIncome > 10000) {
      report.recommendations.push({
        type: 'optimization',
        message: 'Die Werbungskosten sind relativ niedrig. Prüfen Sie, ob alle absetzbaren Kosten erfasst sind.',
        priority: 'medium'
      });
    }

    if (submissions.some(s => !s.form_data?.afa_amount || s.form_data.afa_amount === 0)) {
      report.recommendations.push({
        type: 'missing_afa',
        message: 'Bei einigen Objekten fehlt die AfA-Berechnung. Dies ist eine wichtige Steuerersparnis.',
        priority: 'high'
      });
    }

    if (submissions.filter(s => s.status === 'DRAFT').length > 0) {
      report.recommendations.push({
        type: 'incomplete',
        message: `${submissions.filter(s => s.status === 'DRAFT').length} Submissions sind noch nicht übermittelt.`,
        priority: 'high'
      });
    }

    console.log(`[SUCCESS] Report generated with ${submissions.length} submissions`);

    return Response.json({
      success: true,
      report
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});