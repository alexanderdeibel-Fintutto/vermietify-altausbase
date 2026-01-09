import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { user_id, scenario_type, parameters } = await req.json();

    const user = await base44.auth.me();
    if (!user || user.id !== user_id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get portfolio
    const assets = await base44.entities.AssetPortfolio.filter({
      user_id: user_id,
      status: 'active'
    });

    const currentValue = assets.reduce((sum, a) => sum + (a.quantity * a.current_value), 0);

    // Simulate different scenarios
    const simulations = [];

    if (scenario_type === 'monte_carlo') {
      // Simple Monte Carlo simulation
      const months = parameters.months || 12;
      const volatility = parameters.volatility || 0.15; // 15% annual volatility
      const annualReturn = parameters.annual_return || 0.08; // 8% annual return

      const monthlyReturn = annualReturn / 12;
      const monthlyVolatility = volatility / Math.sqrt(12);

      let value = currentValue;
      const path = [{ month: 0, value: currentValue }];

      for (let i = 1; i <= months; i++) {
        // Random normal distribution
        const random = Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random() - 3;
        const monthReturn = monthlyReturn + random * monthlyVolatility;
        value = value * (1 + monthReturn);
        path.push({ month: i, value: Math.max(0, value) });
      }

      simulations.push({
        scenario: 'Base Case',
        final_value: value,
        gain: value - currentValue,
        gain_percent: ((value - currentValue) / currentValue) * 100,
        path
      });

      // Worst case (volatility * -1)
      let worstValue = currentValue;
      const worstPath = [{ month: 0, value: currentValue }];
      for (let i = 1; i <= months; i++) {
        const monthReturn = monthlyReturn - volatility / Math.sqrt(12);
        worstValue = worstValue * (1 + monthReturn);
        worstPath.push({ month: i, value: Math.max(0, worstValue) });
      }

      simulations.push({
        scenario: 'Worst Case (-1σ)',
        final_value: worstValue,
        gain: worstValue - currentValue,
        gain_percent: ((worstValue - currentValue) / currentValue) * 100,
        path: worstPath
      });

      // Best case
      let bestValue = currentValue;
      const bestPath = [{ month: 0, value: currentValue }];
      for (let i = 1; i <= months; i++) {
        const monthReturn = monthlyReturn + volatility / Math.sqrt(12);
        bestValue = bestValue * (1 + monthReturn);
        bestPath.push({ month: i, value: bestValue });
      }

      simulations.push({
        scenario: 'Best Case (+1σ)',
        final_value: bestValue,
        gain: bestValue - currentValue,
        gain_percent: ((bestValue - currentValue) / currentValue) * 100,
        path: bestPath
      });
    }

    return Response.json({
      success: true,
      current_value: currentValue,
      simulations,
      disclaimer: 'Simulationen sind Prognosen ohne Gewähr. Tatsächliche Ergebnisse können abweichen.'
    });
  } catch (error) {
    console.error('portfolioSimulation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});