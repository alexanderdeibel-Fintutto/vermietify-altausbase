import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { portfolioId, userId, scenarioType, timeHorizon } = await req.json();

    console.log(`Running scenario ${scenarioType} for ${portfolioId}`);

    // Get portfolio data
    const assets = await base44.asServiceRole.entities.AssetPortfolio.filter({
      id: portfolioId
    });

    if (!assets || assets.length === 0) {
      return Response.json({ error: 'Portfolio not found' }, { status: 404 });
    }

    const asset = assets[0];
    const initialValue = asset.quantity * asset.current_value;

    // Define scenario parameters
    const scenarios = {
      bull_market: { drift: 0.20 / 12, volatility: 0.08 },
      bear_market: { drift: -0.20 / 12, volatility: 0.15 },
      stagflation: { drift: 0.02 / 12, volatility: 0.20 },
      recession: { drift: -0.10 / 12, volatility: 0.12 },
      crash: { drift: -0.30 / 12, volatility: 0.35 }
    };

    const params = scenarios[scenarioType];
    const iterations = 10000;
    const paths = [];

    // Monte Carlo simulation
    for (let i = 0; i < iterations; i++) {
      let value = initialValue;
      for (let month = 0; month < timeHorizon; month++) {
        const z = Math.random() * 2 - 1;
        const drift = params.drift * value;
        const diffusion = params.volatility * Math.sqrt(1/12) * z * value;
        value = value + drift + diffusion;
        value = Math.max(value, 0);
      }
      paths.push(value);
    }

    paths.sort((a, b) => a - b);
    const median = paths[Math.floor(iterations / 2)];
    const p5 = paths[Math.floor(iterations * 0.05)];
    const p95 = paths[Math.floor(iterations * 0.95)];
    const maxLoss = Math.min(...paths);
    const var95 = ((p5 - initialValue) / initialValue) * 100;

    // Create simulation record
    const simulation = await base44.asServiceRole.entities.ScenarioSimulation.create({
      portfolio_id: portfolioId,
      user_id: userId,
      scenario_name: scenarioType,
      scenario_type: scenarioType,
      time_horizon: timeHorizon,
      iterations,
      results: {
        median,
        p5,
        p95,
        max_loss: maxLoss,
        var: var95,
        best_case: p95,
        worst_case: p5
      },
      status: 'completed',
      created_at: new Date().toISOString()
    });

    console.log(`Simulation completed: median=${median}, VaR=${var95.toFixed(2)}%`);

    return Response.json({
      success: true,
      simulation_id: simulation.id,
      results: {
        median,
        p5,
        p95,
        max_loss: maxLoss,
        var: var95
      }
    });
  } catch (error) {
    console.error('Scenario simulation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});