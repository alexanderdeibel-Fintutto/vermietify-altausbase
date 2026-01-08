import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { building_id, form_type, tax_year } = await req.json();

    if (!building_id || !form_type || !tax_year) {
      return Response.json({ error: 'building_id, form_type, and tax_year required' }, { status: 400 });
    }

    console.log(`[SMART PRE-FILL] Building: ${building_id}, Form: ${form_type}, Year: ${tax_year}`);

    // Hole historische Submissions für dieses Gebäude
    const historicalSubmissions = await base44.entities.ElsterSubmission.filter({
      building_id,
      tax_form_type: form_type,
      tax_year: { $lt: tax_year }
    });

    // Sortiere nach Jahr (neueste zuerst)
    historicalSubmissions.sort((a, b) => b.tax_year - a.tax_year);

    const prefillData = {};
    const suggestions = [];
    const confidence = {};

    if (historicalSubmissions.length > 0) {
      const lastSubmission = historicalSubmissions[0];
      const lastYearData = lastSubmission.form_data || {};

      // Kopiere statische Felder (ändern sich selten)
      const staticFields = [
        'building_address',
        'building_type',
        'ownership_percentage',
        'land_value',
        'building_value',
        'construction_year'
      ];

      staticFields.forEach(field => {
        if (lastYearData[field] !== undefined) {
          prefillData[field] = lastYearData[field];
          confidence[field] = 95;
          suggestions.push({
            field,
            value: lastYearData[field],
            reason: 'Übernommen aus Vorjahr (statische Daten)',
            confidence: 95
          });
        }
      });

      // Berechne durchschnittliche Werte für dynamische Felder
      const dynamicFields = ['income_rent', 'expense_maintenance', 'expense_interest'];
      
      dynamicFields.forEach(field => {
        const values = historicalSubmissions
          .map(s => s.form_data?.[field])
          .filter(v => v !== undefined && v !== null);

        if (values.length > 0) {
          // Berechne Durchschnitt und Trend
          const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
          const trend = values.length > 1 ? (values[0] - values[values.length - 1]) / values.length : 0;
          const predicted = values[0] + trend;

          prefillData[field] = Math.round(predicted * 100) / 100;
          confidence[field] = 70;
          
          suggestions.push({
            field,
            value: prefillData[field],
            reason: `Geschätzt basierend auf ${values.length} Vorjahren (Trend: ${trend > 0 ? '+' : ''}${Math.round(trend)} €/Jahr)`,
            confidence: 70,
            historical_values: values.slice(0, 3)
          });
        }
      });

      // AfA bleibt meist gleich
      if (lastYearData.afa_amount) {
        prefillData.afa_amount = lastYearData.afa_amount;
        confidence.afa_amount = 90;
        suggestions.push({
          field: 'afa_amount',
          value: lastYearData.afa_amount,
          reason: 'AfA bleibt in der Regel konstant',
          confidence: 90
        });
      }
    }

    // Hole aktuelle Finanz-Daten für das Jahr
    const yearStart = new Date(tax_year, 0, 1);
    const yearEnd = new Date(tax_year, 11, 31);

    const financialItems = await base44.entities.FinancialItem.filter({
      building_id,
      date: { $gte: yearStart.toISOString(), $lte: yearEnd.toISOString() }
    });

    if (financialItems.length > 0) {
      // Berechne tatsächliche Einnahmen und Ausgaben
      const actualIncome = financialItems
        .filter(f => f.type === 'income')
        .reduce((sum, f) => sum + (f.amount || 0), 0);

      const actualExpenses = financialItems
        .filter(f => f.type === 'expense')
        .reduce((sum, f) => sum + Math.abs(f.amount || 0), 0);

      if (actualIncome > 0) {
        prefillData.income_rent = actualIncome;
        confidence.income_rent = 100;
        suggestions.push({
          field: 'income_rent',
          value: actualIncome,
          reason: `Berechnet aus ${financialItems.filter(f => f.type === 'income').length} tatsächlichen Einnahmen`,
          confidence: 100,
          override: true // Überschreibt Schätzung
        });
      }

      if (actualExpenses > 0) {
        prefillData.expense_total = actualExpenses;
        confidence.expense_total = 100;
        suggestions.push({
          field: 'expense_total',
          value: actualExpenses,
          reason: `Berechnet aus ${financialItems.filter(f => f.type === 'expense').length} tatsächlichen Ausgaben`,
          confidence: 100,
          override: true
        });
      }
    }

    // Hole Gebäude-Daten für zusätzliche Felder
    const buildings = await base44.entities.Building.filter({ id: building_id });
    if (buildings.length > 0) {
      const building = buildings[0];

      if (building.address && !prefillData.building_address) {
        prefillData.building_address = building.address;
        confidence.building_address = 100;
        suggestions.push({
          field: 'building_address',
          value: building.address,
          reason: 'Aus Gebäude-Stammdaten',
          confidence: 100
        });
      }

      if (building.construction_year && !prefillData.construction_year) {
        prefillData.construction_year = building.construction_year;
        confidence.construction_year = 100;
      }

      // Berechne AfA wenn nicht vorhanden
      if (!prefillData.afa_amount && building.purchase_price) {
        const landValue = building.land_value || building.purchase_price * 0.2;
        const buildingValue = building.purchase_price - landValue;
        const afaAmount = buildingValue * 0.02;

        prefillData.afa_amount = Math.round(afaAmount);
        confidence.afa_amount = 85;
        suggestions.push({
          field: 'afa_amount',
          value: Math.round(afaAmount),
          reason: `Berechnet: 2% von ${buildingValue.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}`,
          confidence: 85
        });
      }
    }

    const avgConfidence = Object.values(confidence).length > 0
      ? Math.round(Object.values(confidence).reduce((sum, c) => sum + c, 0) / Object.values(confidence).length)
      : 0;

    console.log(`[SUCCESS] Pre-filled ${Object.keys(prefillData).length} fields with ${avgConfidence}% avg confidence`);

    return Response.json({
      success: true,
      prefill_data: prefillData,
      suggestions: suggestions.sort((a, b) => b.confidence - a.confidence),
      confidence_scores: confidence,
      average_confidence: avgConfidence,
      data_sources: {
        historical_submissions: historicalSubmissions.length,
        financial_items: financialItems.length,
        building_data: buildings.length > 0
      }
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});