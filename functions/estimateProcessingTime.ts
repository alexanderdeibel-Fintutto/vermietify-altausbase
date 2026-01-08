import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { form_type, complexity = 'medium' } = await req.json();

    if (!form_type) {
      return Response.json({ error: 'form_type required' }, { status: 400 });
    }

    console.log(`[TIME-ESTIMATE] Calculating for ${form_type} (${complexity})`);

    // Hole historische Verarbeitungszeiten
    const activities = await base44.entities.ActivityLog.filter({
      entity_type: 'ElsterSubmission',
      action: { $in: ['created', 'submitted'] }
    }, '-created_date', 100);

    const processingTimes = [];
    const submissionMap = {};

    activities.forEach(act => {
      const id = act.entity_id;
      if (!submissionMap[id]) {
        submissionMap[id] = {};
      }
      
      if (act.action === 'created') {
        submissionMap[id].created = new Date(act.created_date);
      } else if (act.action === 'submitted') {
        submissionMap[id].submitted = new Date(act.created_date);
      }
    });

    Object.values(submissionMap).forEach(times => {
      if (times.created && times.submitted) {
        const duration = (times.submitted - times.created) / (1000 * 60); // minutes
        if (duration > 0 && duration < 10080) { // max 1 week
          processingTimes.push(duration);
        }
      }
    });

    const avgTime = processingTimes.length > 0
      ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length
      : 30; // default 30 minutes

    // Adjust for complexity
    const complexityFactors = {
      simple: 0.5,
      medium: 1.0,
      complex: 1.5
    };

    const estimatedMinutes = Math.round(avgTime * (complexityFactors[complexity] || 1.0));

    const estimate = {
      estimated_minutes: estimatedMinutes,
      estimated_hours: Math.round(estimatedMinutes / 60 * 10) / 10,
      complexity,
      based_on_samples: processingTimes.length,
      confidence: processingTimes.length >= 10 ? 'high' : 
                   processingTimes.length >= 5 ? 'medium' : 'low'
    };

    console.log(`[TIME-ESTIMATE] Estimated ${estimatedMinutes} minutes`);

    return Response.json({
      success: true,
      estimate
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});