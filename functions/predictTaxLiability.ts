import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { building_id, target_year } = await req.json();

    if (!target_year) {
      return Response.json({ error: 'target_year required' }, { status: 400 });
    }

    console.log(`[TAX-PREDICT] Predicting for year ${target_year}`);

    // Hole historische Daten
    const historicalSubmissions = await base44.entities.ElsterSubmission.filter({
      ...(building_id ? { building_id } : {}),
      tax_year: { $lt: target_year }
    }, '-tax_year', 5);

    if (historicalSubmissions.length === 0) {
      return Response.json({ 
        error: 'Keine historischen Daten für Vorhersage' 
      }, { status: 400 });
    }

    // Berechne Trends
    const yearlyData = historicalSubmissions.map(sub => ({
      year: sub.tax_year,
      einnahmen: parseFloat(sub.form_data?.einnahmen_gesamt || 0),
      ausgaben: parseFloat(sub.form_data?.werbungskosten_gesamt || 0)
    }));

    // Lineare Regression für Vorhersage
    const avgEinnahmenGrowth = yearlyData.length > 1
      ? (yearlyData[0].einnahmen - yearlyData[yearlyData.length - 1].einnahmen) / (yearlyData.length - 1)
      : 0;

    const avgAusgabenGrowth = yearlyData.length > 1
      ? (yearlyData[0].ausgaben - yearlyData[yearlyData.length - 1].ausgaben) / (yearlyData.length - 1)
      : 0;

    const lastYear = yearlyData[0];
    const yearsDiff = target_year - lastYear.year;

    const predicted = {
      year: target_year,
      einnahmen: Math.round(lastYear.einnahmen + (avgEinnahmenGrowth * yearsDiff)),
      ausgaben: Math.round(lastYear.ausgaben + (avgAusgabenGrowth * yearsDiff))
    };

    predicted.einkuenfte = predicted.einnahmen - predicted.ausgaben;
    predicted.geschaetzte_steuerlast = Math.round(predicted.einkuenfte * 0.42);

    console.log(`[TAX-PREDICT] Predicted tax: €${predicted.geschaetzte_steuerlast}`);

    return Response.json({
      success: true,
      prediction: predicted,
      confidence: historicalSubmissions.length >= 3 ? 'high' : 'medium',
      based_on_years: yearlyData.map(d => d.year)
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});