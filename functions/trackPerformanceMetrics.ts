import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { days = 30 } = await req.json();

    console.log(`[PERFORMANCE] Tracking last ${days} days`);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const submissions = await base44.entities.ElsterSubmission.filter({
      created_date: { $gte: startDate.toISOString() }
    });

    const activities = await base44.entities.ActivityLog.filter({
      entity_type: 'ElsterSubmission',
      created_date: { $gte: startDate.toISOString() }
    });

    const metrics = {
      period_days: days,
      submissions: {
        total: submissions.length,
        per_day: Math.round((submissions.length / days) * 10) / 10,
        by_status: {},
        by_form_type: {}
      },
      processing: {
        avg_time_minutes: 0,
        fastest_minutes: Infinity,
        slowest_minutes: 0
      },
      quality: {
        avg_confidence: 0,
        error_rate: 0
      },
      activity: {
        total_actions: activities.length,
        actions_per_day: Math.round((activities.length / days) * 10) / 10,
        by_action: {}
      }
    };

    // Status & Form Type Distribution
    submissions.forEach(sub => {
      metrics.submissions.by_status[sub.status] = 
        (metrics.submissions.by_status[sub.status] || 0) + 1;
      metrics.submissions.by_form_type[sub.tax_form_type] = 
        (metrics.submissions.by_form_type[sub.tax_form_type] || 0) + 1;
    });

    // Processing Times
    const processingTimes = [];
    const submissionMap = {};

    activities.forEach(act => {
      const id = act.entity_id;
      if (!submissionMap[id]) submissionMap[id] = {};
      
      if (act.action === 'created') {
        submissionMap[id].created = new Date(act.created_date);
      } else if (act.action === 'submitted') {
        submissionMap[id].submitted = new Date(act.created_date);
      }
    });

    Object.values(submissionMap).forEach(times => {
      if (times.created && times.submitted) {
        const duration = (times.submitted - times.created) / (1000 * 60);
        if (duration > 0 && duration < 10080) {
          processingTimes.push(duration);
        }
      }
    });

    if (processingTimes.length > 0) {
      metrics.processing.avg_time_minutes = Math.round(
        processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length
      );
      metrics.processing.fastest_minutes = Math.round(Math.min(...processingTimes));
      metrics.processing.slowest_minutes = Math.round(Math.max(...processingTimes));
    }

    // Quality Metrics
    const confidenceScores = submissions
      .filter(s => s.ai_confidence_score)
      .map(s => s.ai_confidence_score);

    if (confidenceScores.length > 0) {
      metrics.quality.avg_confidence = Math.round(
        confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length
      );
    }

    const errorsCount = submissions.filter(s => 
      s.validation_errors && s.validation_errors.length > 0
    ).length;
    metrics.quality.error_rate = submissions.length > 0
      ? Math.round((errorsCount / submissions.length) * 100)
      : 0;

    // Activities
    activities.forEach(act => {
      metrics.activity.by_action[act.action] = 
        (metrics.activity.by_action[act.action] || 0) + 1;
    });

    console.log(`[PERFORMANCE] Tracked ${submissions.length} submissions`);

    return Response.json({
      success: true,
      metrics
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});