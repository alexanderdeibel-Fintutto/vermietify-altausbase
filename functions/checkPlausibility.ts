import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { form_data, building_id, tax_year } = await req.json();

    console.log('[PLAUSIBILITY] Checking form data');

    const issues = [];
    const warnings = [];
    const benchmarks = {};

    // Branchendurchschnitte für Wohnimmobilien (pro qm/Jahr)
    const industryBenchmarks = {
      income_per_sqm: { min: 60, max: 180, avg: 100 },
      maintenance_per_sqm: { min: 5, max: 30, avg: 15 },
      management_per_sqm: { min: 10, max: 40, avg: 20 },
      total_costs_ratio: { min: 0.15, max: 0.40, avg: 0.25 } // von Einnahmen
    };

    // Hole Gebäude-Daten
    let buildingArea = null;
    if (building_id) {
      const buildings = await base44.entities.Building.filter({ id: building_id });
      if (buildings.length > 0) {
        buildingArea = buildings[0].total_area || buildings[0].living_area;
      }
    }

    // 1. Einnahmen-Plausibilität
    const income = form_data.income_rent || 0;
    if (income <= 0) {
      issues.push({
        severity: 'error',
        field: 'income_rent',
        message: 'Keine Mieteinnahmen erfasst',
        suggestion: 'Prüfen Sie die Buchungen für dieses Jahr'
      });
    } else if (buildingArea) {
      const incomePerSqm = income / buildingArea;
      benchmarks.income_per_sqm = incomePerSqm;

      if (incomePerSqm < industryBenchmarks.income_per_sqm.min) {
        warnings.push({
          severity: 'warning',
          field: 'income_rent',
          message: `Einnahmen pro qm sehr niedrig (${incomePerSqm.toFixed(2)} €/qm)`,
          suggestion: `Branchendurchschnitt: ${industryBenchmarks.income_per_sqm.avg} €/qm. Prüfen Sie auf fehlende Einnahmen oder Leerstand.`,
          benchmark: industryBenchmarks.income_per_sqm.avg
        });
      } else if (incomePerSqm > industryBenchmarks.income_per_sqm.max) {
        warnings.push({
          severity: 'info',
          field: 'income_rent',
          message: `Einnahmen pro qm sehr hoch (${incomePerSqm.toFixed(2)} €/qm)`,
          suggestion: 'Überdurchschnittliche Mieten - bitte prüfen Sie die Richtigkeit'
        });
      }
    }

    // 2. Ausgaben-Plausibilität
    const expenses = Object.entries(form_data)
      .filter(([key]) => key.startsWith('expense_'))
      .reduce((sum, [_, value]) => sum + (value || 0), 0);

    if (expenses === 0 && income > 0) {
      warnings.push({
        severity: 'warning',
        field: 'expenses',
        message: 'Keine Werbungskosten erfasst',
        suggestion: 'Immobilien verursachen normalerweise Kosten (Instandhaltung, Verwaltung, etc.)'
      });
    }

    // 3. Kostenquote
    if (income > 0) {
      const costRatio = expenses / income;
      benchmarks.cost_ratio = costRatio;

      if (costRatio < industryBenchmarks.total_costs_ratio.min) {
        warnings.push({
          severity: 'info',
          field: 'expenses',
          message: `Kostenquote sehr niedrig (${(costRatio * 100).toFixed(1)}%)`,
          suggestion: `Typisch sind ${(industryBenchmarks.total_costs_ratio.avg * 100).toFixed(0)}%. Prüfen Sie auf fehlende Ausgaben.`
        });
      } else if (costRatio > industryBenchmarks.total_costs_ratio.max) {
        warnings.push({
          severity: 'warning',
          field: 'expenses',
          message: `Kostenquote sehr hoch (${(costRatio * 100).toFixed(1)}%)`,
          suggestion: 'Hohe Kosten im Vergleich zu Einnahmen - bitte prüfen'
        });
      }
    }

    // 4. Schuldzinsen vs. Einkommen
    const interestExpense = form_data.expense_interest || 0;
    if (interestExpense > income * 0.8) {
      warnings.push({
        severity: 'warning',
        field: 'expense_interest',
        message: 'Schuldzinsen überschreiten 80% der Einnahmen',
        suggestion: 'Ungewöhnlich hohe Zinsbelastung - bitte prüfen'
      });
    }

    // 5. AfA-Plausibilität
    const afa = form_data.afa_amount || 0;
    if (afa > 0 && income > 0) {
      if (afa > income * 0.5) {
        warnings.push({
          severity: 'info',
          field: 'afa_amount',
          message: 'AfA übersteigt 50% der Einnahmen',
          suggestion: 'Bei hochwertigen Immobilien kann dies normal sein'
        });
      }
    }

    // 6. Negatives Ergebnis über mehrere Jahre
    if (building_id) {
      const historicalSubmissions = await base44.entities.ElsterSubmission.filter({
        building_id,
        tax_year: { $gte: tax_year - 3, $lt: tax_year }
      });

      const negativeYears = historicalSubmissions.filter(s => {
        const hist_income = s.form_data?.income_rent || 0;
        const hist_expenses = Object.entries(s.form_data || {})
          .filter(([key]) => key.startsWith('expense_'))
          .reduce((sum, [_, value]) => sum + (value || 0), 0);
        return hist_income < hist_expenses;
      }).length;

      const currentResult = income - expenses - afa;
      if (currentResult < 0 && negativeYears >= 2) {
        warnings.push({
          severity: 'warning',
          field: 'general',
          message: `${negativeYears + 1}. Jahr mit Verlust in Folge`,
          suggestion: 'Bei dauerhaften Verlusten könnte das Finanzamt Liebhaberei unterstellen'
        });
      }
    }

    // 7. Fehlende wichtige Positionen
    if (!form_data.expense_maintenance && income > 10000) {
      warnings.push({
        severity: 'info',
        field: 'expense_maintenance',
        message: 'Keine Instandhaltungskosten erfasst',
        suggestion: 'Auch ohne größere Reparaturen fallen oft kleinere Kosten an'
      });
    }

    // 8. Ungewöhnlich hohe Einzelpositionen
    Object.entries(form_data).forEach(([key, value]) => {
      if (key.startsWith('expense_') && value > income) {
        warnings.push({
          severity: 'warning',
          field: key,
          message: `${key} übersteigt die Gesamteinnahmen`,
          suggestion: 'Bitte prüfen Sie diesen Wert'
        });
      }
    });

    const isValid = issues.length === 0;
    const score = Math.max(0, 100 - (issues.length * 20) - (warnings.length * 5));

    console.log(`[PLAUSIBILITY] Score: ${score}%, Issues: ${issues.length}, Warnings: ${warnings.length}`);

    return Response.json({
      success: true,
      is_valid: isValid,
      plausibility_score: score,
      issues,
      warnings,
      benchmarks,
      industry_benchmarks: industryBenchmarks,
      summary: isValid 
        ? `Formular erscheint plausibel (Score: ${score}%)`
        : `${issues.length} kritische Probleme gefunden`
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});