import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submission_id } = await req.json();

    if (!submission_id) {
      return Response.json({ error: 'submission_id required' }, { status: 400 });
    }

    console.log(`[SMART-PREFILL] Processing ${submission_id}`);

    const submission = await base44.entities.ElsterSubmission.filter({ id: submission_id });
    
    if (submission.length === 0) {
      return Response.json({ error: 'Submission not found' }, { status: 404 });
    }

    const sub = submission[0];

    // Hole historische Daten
    const historicalSubmissions = await base44.entities.ElsterSubmission.filter({
      building_id: sub.building_id,
      tax_form_type: sub.tax_form_type,
      status: { $in: ['ACCEPTED', 'SUBMITTED'] }
    });

    // Hole Finanzdaten
    let financialData = {};
    if (sub.building_id) {
      const financialItems = await base44.entities.FinancialItem.filter({
        building_id: sub.building_id
      });

      const relevantItems = financialItems.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate.getFullYear() === sub.tax_year;
      });

      // Aggregiere Einnahmen/Ausgaben
      financialData = relevantItems.reduce((acc, item) => {
        const amount = parseFloat(item.amount || 0);
        if (item.type === 'INCOME') {
          acc.total_income = (acc.total_income || 0) + amount;
        } else if (item.type === 'EXPENSE') {
          acc.total_expenses = (acc.total_expenses || 0) + amount;
        }
        return acc;
      }, {});
    }

    // Berechne Durchschnittswerte aus historischen Daten
    const avgValues = {};
    if (historicalSubmissions.length > 0) {
      historicalSubmissions.forEach(hist => {
        Object.entries(hist.form_data || {}).forEach(([key, value]) => {
          const num = parseFloat(value);
          if (!isNaN(num)) {
            if (!avgValues[key]) avgValues[key] = [];
            avgValues[key].push(num);
          }
        });
      });

      Object.keys(avgValues).forEach(key => {
        const values = avgValues[key];
        avgValues[key] = values.reduce((a, b) => a + b, 0) / values.length;
      });
    }

    // Erstelle intelligente Vorschläge
    const suggestions = {
      from_financial_data: {},
      from_historical_avg: {},
      confidence_scores: {}
    };

    // Vorschläge aus Finanzdaten
    if (financialData.total_income > 0) {
      suggestions.from_financial_data.einnahmen_gesamt = financialData.total_income;
      suggestions.confidence_scores.einnahmen_gesamt = 90;
    }
    if (financialData.total_expenses > 0) {
      suggestions.from_financial_data.ausgaben_gesamt = financialData.total_expenses;
      suggestions.confidence_scores.ausgaben_gesamt = 90;
    }

    // Vorschläge aus historischen Daten
    Object.entries(avgValues).forEach(([key, value]) => {
      if (!suggestions.from_financial_data[key]) {
        suggestions.from_historical_avg[key] = Math.round(value);
        suggestions.confidence_scores[key] = 60;
      }
    });

    // Update Submission mit Vorschlägen
    const updatedFormData = {
      ...sub.form_data,
      ...suggestions.from_financial_data,
      ...Object.fromEntries(
        Object.entries(suggestions.from_historical_avg).filter(
          ([key]) => !sub.form_data?.[key]
        )
      )
    };

    await base44.asServiceRole.entities.ElsterSubmission.update(submission_id, {
      form_data: updatedFormData,
      status: 'AI_PROCESSED'
    });

    console.log('[SMART-PREFILL] Complete');

    return Response.json({
      success: true,
      suggestions,
      updated_submission: { ...sub, form_data: updatedFormData }
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});