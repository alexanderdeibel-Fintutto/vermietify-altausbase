import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { portfolio_metrics_id, region } = await req.json();
    const metrics = await base44.asServiceRole.entities.PortfolioMetrics.read(portfolio_metrics_id);

    // Get benchmark data for region
    const currentYear = new Date().getFullYear();
    const benchmarks = await base44.asServiceRole.entities.IndustryBenchmark.filter({ 
      region, 
      year: currentYear 
    });

    if (benchmarks.length === 0) {
      return Response.json({ error: 'No benchmark data available for this region' }, { status: 404 });
    }

    const benchmark = benchmarks[0];

    const comparison = {
      vacancy_rate: {
        yours: metrics.vacancy_rate,
        industry: benchmark.avg_vacancy_rate,
        difference: metrics.vacancy_rate - benchmark.avg_vacancy_rate,
        performance: metrics.vacancy_rate < benchmark.avg_vacancy_rate ? 'better' : 'worse'
      },
      roi: {
        yours: metrics.avg_roi,
        industry: benchmark.avg_net_yield,
        difference: metrics.avg_roi - benchmark.avg_net_yield,
        performance: metrics.avg_roi > benchmark.avg_net_yield ? 'better' : 'worse'
      },
      overall_score: 0
    };

    // Calculate overall performance score
    let score = 50; // Start at neutral
    if (comparison.vacancy_rate.performance === 'better') score += 25;
    if (comparison.roi.performance === 'better') score += 25;
    comparison.overall_score = score;

    return Response.json({ success: true, comparison, benchmark });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});