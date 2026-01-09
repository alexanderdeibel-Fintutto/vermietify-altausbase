import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Generates cashflow forecast for the next 6 months
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { buildingId = null, months = 6 } = await req.json();

    console.log(`Generating ${months}-month cashflow forecast...`);

    // Fetch historical transactions
    let transactions = await base44.entities.FinancialItem.list('-transaction_date', 500);
    if (buildingId) {
      transactions = transactions.filter(t => t.building_id === buildingId);
    }

    // Analyze historical patterns
    const monthlyData = {};
    const today = new Date();

    transactions.forEach(trans => {
      const date = new Date(trans.transaction_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expenses: 0 };
      }

      if (trans.transaction_type === 'income') {
        monthlyData[monthKey].income += trans.amount || 0;
      } else {
        monthlyData[monthKey].expenses += trans.amount || 0;
      }
    });

    // Calculate averages
    const months_data = Object.values(monthlyData);
    const avgIncome = months_data.length > 0 
      ? months_data.reduce((sum, m) => sum + m.income, 0) / months_data.length 
      : 0;
    const avgExpenses = months_data.length > 0 
      ? months_data.reduce((sum, m) => sum + m.expenses, 0) / months_data.length 
      : 0;

    // Generate forecasts
    const forecasts = [];
    let cumulativeBalance = 0;

    for (let i = 1; i <= months; i++) {
      const forecastDate = new Date(today);
      forecastDate.setMonth(forecastDate.getMonth() + i);
      const monthStr = forecastDate.toISOString().split('T')[0];

      // Add seasonal variation (simplified)
      const seasonalFactor = 1 + (Math.sin(i / 2) * 0.1); // 10% variation
      const projectedIncome = avgIncome * seasonalFactor;
      const projectedExpenses = avgExpenses * seasonalFactor;
      const projectedBalance = projectedIncome - projectedExpenses;
      
      cumulativeBalance += projectedBalance;

      // Determine risk level
      let riskLevel = 'low';
      let potentialBottleneck = false;

      if (cumulativeBalance < 5000) {
        riskLevel = 'high';
        potentialBottleneck = true;
      } else if (cumulativeBalance < 10000) {
        riskLevel = 'medium';
      }

      const forecast = await base44.entities.CashflowForecast.create({
        forecast_month: monthStr,
        projected_income: Math.round(projectedIncome * 100) / 100,
        projected_expenses: Math.round(projectedExpenses * 100) / 100,
        projected_balance: Math.round(projectedBalance * 100) / 100,
        confidence_score: Math.round(Math.max(50, 100 - (months_data.length > 3 ? 0 : 30))),
        risk_level: riskLevel,
        potential_bottleneck: potentialBottleneck,
        building_id: buildingId || null,
        forecast_data: {
          cumulative_balance: Math.round(cumulativeBalance * 100) / 100,
          avg_income: Math.round(avgIncome * 100) / 100,
          avg_expenses: Math.round(avgExpenses * 100) / 100,
          seasonal_factor: Math.round(seasonalFactor * 100) / 100
        }
      });

      forecasts.push(forecast);
    }

    console.log(`Generated ${forecasts.length} forecasts`);

    return Response.json({
      success: true,
      forecast_count: forecasts.length,
      forecasts
    });
  } catch (error) {
    console.error('Error generating cashflow forecast:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});