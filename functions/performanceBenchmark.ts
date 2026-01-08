import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    console.log('[BENCHMARK] Running performance tests');

    const metrics = {};

    // Test: List Query Performance
    const listStart = Date.now();
    await base44.asServiceRole.entities.ElsterSubmission.list('-created_date', 100);
    metrics.list_query_ms = Date.now() - listStart;

    // Test: Filter Query Performance
    const filterStart = Date.now();
    await base44.asServiceRole.entities.ElsterSubmission.filter({ status: 'ACCEPTED' });
    metrics.filter_query_ms = Date.now() - filterStart;

    // Test: Complex aggregation
    const aggStart = Date.now();
    const allSubs = await base44.asServiceRole.entities.ElsterSubmission.list('-created_date', 500);
    const byYear = allSubs.reduce((acc, sub) => {
      acc[sub.tax_year] = (acc[sub.tax_year] || 0) + 1;
      return acc;
    }, {});
    metrics.aggregation_ms = Date.now() - aggStart;

    // Gesamtstatistiken
    metrics.total_submissions = allSubs.length;
    metrics.avg_processing_time = metrics.list_query_ms / allSubs.length;

    // Performance-Rating
    const totalTime = metrics.list_query_ms + metrics.filter_query_ms + metrics.aggregation_ms;
    metrics.performance_rating = totalTime < 1000 ? 'excellent' : totalTime < 3000 ? 'good' : 'needs_optimization';

    return Response.json({ success: true, metrics });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});