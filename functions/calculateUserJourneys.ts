import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { test_account_ids, session_id } = body;

    console.log('Calculating user journeys:', { test_account_ids, session_id });

    // Fetch activities
    const query = session_id 
      ? { session_id }
      : { test_account_id: { $in: test_account_ids } };

    const activities = await base44.asServiceRole.entities.TesterActivity.filter(
      query,
      'timestamp',
      2000
    );

    console.log('Fetched activities:', activities.length);

    // Group by session
    const sessions = {};
    activities.forEach(a => {
      if (!sessions[a.session_id]) {
        sessions[a.session_id] = [];
      }
      sessions[a.session_id].push(a);
    });

    // Build journeys from page visits
    const journeys = [];
    const pathFrequency = {};

    Object.entries(sessions).forEach(([sessionId, acts]) => {
      const pageVisits = acts
        .filter(a => a.activity_type === 'page_visit')
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      if (pageVisits.length > 0) {
        const pathSequence = pageVisits.map(p => p.page_url || 'unknown');
        const pathKey = pathSequence.join(' -> ');

        // Track path frequency
        pathFrequency[pathKey] = (pathFrequency[pathKey] || 0) + 1;

        const journey = {
          test_account_id: pageVisits[0].test_account_id,
          journey_id: `journey_${sessionId}`,
          start_page: pathSequence[0],
          end_page: pathSequence[pathSequence.length - 1],
          path_sequence: pathSequence,
          total_duration: Math.round((new Date(pageVisits[pageVisits.length - 1].timestamp) - new Date(pageVisits[0].timestamp)) / 1000),
          completed: pageVisits.length >= 3,
          problem_encountered: acts.some(a => a.activity_type === 'problem_report')
        };

        journeys.push(journey);
      }
    });

    // Find common paths and dropouts
    const commonPaths = Object.entries(pathFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([path, count]) => ({
        path: path.split(' -> '),
        frequency: count
      }));

    console.log('Found journeys:', journeys.length);
    console.log('Common paths:', commonPaths.length);

    return Response.json({
      success: true,
      journeys,
      common_paths: commonPaths,
      total_journeys: journeys.length
    });
  } catch (error) {
    console.error('Journey calculation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});