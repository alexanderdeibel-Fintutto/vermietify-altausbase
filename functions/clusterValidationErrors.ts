import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { year, form_type } = await req.json();

    console.log(`[CLUSTER] Analyzing errors for ${form_type} ${year}`);

    const submissions = await base44.entities.ElsterSubmission.filter({
      ...(year ? { tax_year: year } : {}),
      ...(form_type ? { tax_form_type: form_type } : {})
    });

    const errorClusters = {};

    submissions.forEach(sub => {
      if (!sub.validation_errors || sub.validation_errors.length === 0) return;

      sub.validation_errors.forEach(error => {
        const key = `${error.field || 'unknown'}_${error.type || error.code || 'unknown'}`;
        
        if (!errorClusters[key]) {
          errorClusters[key] = {
            field: error.field || 'unknown',
            type: error.type || error.code || 'unknown',
            message: error.message || 'Kein Fehlertext',
            count: 0,
            submissions: [],
            examples: []
          };
        }

        errorClusters[key].count++;
        errorClusters[key].submissions.push(sub.id);
        
        if (errorClusters[key].examples.length < 3) {
          errorClusters[key].examples.push({
            submission_id: sub.id,
            value: sub.form_data?.[error.field]
          });
        }
      });
    });

    const clustered = Object.values(errorClusters)
      .sort((a, b) => b.count - a.count)
      .map(cluster => ({
        ...cluster,
        percentage: Math.round((cluster.count / submissions.length) * 100)
      }));

    const insights = {
      total_submissions: submissions.length,
      submissions_with_errors: submissions.filter(s => s.validation_errors?.length > 0).length,
      error_clusters: clustered,
      top_errors: clustered.slice(0, 5),
      recommendations: []
    };

    // Empfehlungen generieren
    clustered.slice(0, 3).forEach(cluster => {
      if (cluster.percentage > 20) {
        insights.recommendations.push({
          type: 'high_frequency',
          message: `${cluster.field}: Fehler tritt in ${cluster.percentage}% der Fälle auf - prüfen Sie die Datenquelle`
        });
      }
    });

    console.log(`[CLUSTER] Identified ${clustered.length} error patterns`);

    return Response.json({
      success: true,
      insights
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});