import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { building_id, years_ahead = 1 } = await req.json();

    console.log(`[FORECAST] Predicting ${years_ahead} years ahead`);

    const currentYear = new Date().getFullYear();
    const historicalYears = 3;

    const historical = await base44.entities.ElsterSubmission.filter({
      tax_year: { $gte: currentYear - historicalYears },
      ...(building_id ? { building_id } : {})
    });

    // Gruppiere nach Jahren
    const yearlyData = {};
    historical.forEach(sub => {
      const year = sub.tax_year;
      if (!yearlyData[year]) {
        yearlyData[year] = { einnahmen: 0, ausgaben: 0 };
      }
      yearlyData[year].einnahmen += parseFloat(sub.form_data?.einnahmen_gesamt || 0);
      yearlyData[year].ausgaben += parseFloat(sub.form_data?.werbungskosten_gesamt || 0);
    });

    const years = Object.keys(yearlyData).sort();
    
    if (years.length < 2) {
      return Response.json({ 
        success: false, 
        error: 'Nicht genug historische Daten für Prognose' 
      });
    }

    // Berechne durchschnittliches Wachstum
    const einnahmenGrowth = [];
    const ausgabenGrowth = [];

    for (let i = 1; i < years.length; i++) {
      const prev = yearlyData[years[i - 1]];
      const curr = yearlyData[years[i]];
      
      if (prev.einnahmen > 0) {
        einnahmenGrowth.push((curr.einnahmen - prev.einnahmen) / prev.einnahmen);
      }
      if (prev.ausgaben > 0) {
        ausgabenGrowth.push((curr.ausgaben - prev.ausgaben) / prev.ausgaben);
      }
    }

    const avgEinnahmenGrowth = einnahmenGrowth.length > 0
      ? einnahmenGrowth.reduce((a, b) => a + b, 0) / einnahmenGrowth.length
      : 0;

    const avgAusgabenGrowth = ausgabenGrowth.length > 0
      ? ausgabenGrowth.reduce((a, b) => a + b, 0) / ausgabenGrowth.length
      : 0;

    // Prognose
    const forecast = [];
    const lastYear = years[years.length - 1];
    let lastEinnahmen = yearlyData[lastYear].einnahmen;
    let lastAusgaben = yearlyData[lastYear].ausgaben;

    for (let i = 1; i <= years_ahead; i++) {
      lastEinnahmen *= (1 + avgEinnahmenGrowth);
      lastAusgaben *= (1 + avgAusgabenGrowth);

      forecast.push({
        year: parseInt(lastYear) + i,
        einnahmen: Math.round(lastEinnahmen),
        ausgaben: Math.round(lastAusgaben),
        nettoertrag: Math.round(lastEinnahmen - lastAusgaben),
        confidence: Math.max(0, 100 - (i * 15)) // Vertrauen sinkt mit jedem Jahr
      });
    }

    console.log(`[FORECAST] Generated ${forecast.length} year predictions`);

    return Response.json({
      success: true,
      historical: yearlyData,
      forecast,
      growth_rates: {
        einnahmen: Math.round(avgEinnahmenGrowth * 100),
        ausgaben: Math.round(avgAusgabenGrowth * 100)
      }
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});