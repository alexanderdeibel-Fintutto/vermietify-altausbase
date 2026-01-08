import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { months_ahead = 3 } = await req.json();

    console.log(`[FORECAST] Predicting ${months_ahead} months ahead...`);

    // 1. Hole historische Daten (letzte 12 Monate)
    const twelveMonthsAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
    const historicalTxs = await base44.entities.BankTransaction.filter({
      transaction_date: { $gte: twelveMonthsAgo }
    });

    // 2. Aggregiere nach Kategorie und Monat
    const monthlyData = {};
    
    for (const tx of historicalTxs) {
      const month = tx.transaction_date.substring(0, 7); // YYYY-MM
      if (!monthlyData[month]) monthlyData[month] = {};
      
      const cat = tx.category || 'uncategorized';
      monthlyData[month][cat] = (monthlyData[month][cat] || 0) + Math.abs(tx.amount);
    }

    // 3. Berechne Durchschnitte und Trends
    const trends = {};
    const categories = new Set();

    Object.values(monthlyData).forEach(month => {
      Object.keys(month).forEach(cat => categories.add(cat));
    });

    for (const cat of categories) {
      const values = Object.values(monthlyData)
        .map(m => m[cat] || 0)
        .filter(v => v > 0);

      if (values.length > 0) {
        trends[cat] = {
          average: values.reduce((a, b) => a + b) / values.length,
          max: Math.max(...values),
          min: Math.min(...values),
          trend: values[values.length - 1] - values[0] // Linear trend
        };
      }
    }

    // 4. Generiere Forecast für nächste Monate
    const forecast = [];
    const today = new Date();

    for (let i = 1; i <= months_ahead; i++) {
      const forecastMonth = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const monthStr = forecastMonth.toISOString().substring(0, 7);

      const monthForecast = {
        month: monthStr,
        categories: {}
      };

      for (const [cat, trend] of Object.entries(trends)) {
        monthForecast.categories[cat] = {
          predicted: trend.average + (trend.trend * i * 0.1), // Simple trend extrapolation
          confidence: Math.max(0.5, 1 - i * 0.1), // Confidence decreases further out
          range: {
            low: trend.min,
            high: trend.max
          }
        };
      }

      forecast.push(monthForecast);
    }

    // 5. Berechne Budget-Empfehlungen
    const budgetRecommendations = {};
    
    for (const [cat, trend] of Object.entries(trends)) {
      budgetRecommendations[cat] = {
        recommended: Math.round(trend.average * 1.1), // 10% buffer
        based_on: `${Object.values(monthlyData).filter(m => m[cat]).length} months of data`,
        safety_margin: 1.1
      };
    }

    return Response.json({
      success: true,
      forecast,
      trends,
      budget_recommendations: budgetRecommendations
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});