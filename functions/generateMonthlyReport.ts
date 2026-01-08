import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { year, month } = await req.json();

    if (!year || !month) {
      return Response.json({ error: 'year and month required' }, { status: 400 });
    }

    console.log(`[MONTHLY-REPORT] Generating for ${year}-${month}`);

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // Submissions in diesem Monat
    const submissions = await base44.entities.ElsterSubmission.filter({
      created_date: {
        $gte: startDate.toISOString(),
        $lte: endDate.toISOString()
      }
    });

    // Activity Logs
    const activities = await base44.entities.ActivityLog.filter({
      entity_type: 'ElsterSubmission',
      created_date: {
        $gte: startDate.toISOString(),
        $lte: endDate.toISOString()
      }
    });

    const report = {
      period: `${year}-${String(month).padStart(2, '0')}`,
      submissions: {
        total: submissions.length,
        by_status: {},
        by_form_type: {}
      },
      activities: {
        total: activities.length,
        by_action: {}
      },
      performance: {
        avg_processing_time: 0,
        submissions_per_day: Math.round(submissions.length / new Date(year, month, 0).getDate())
      }
    };

    // Group by status
    submissions.forEach(sub => {
      report.submissions.by_status[sub.status] = (report.submissions.by_status[sub.status] || 0) + 1;
      report.submissions.by_form_type[sub.tax_form_type] = (report.submissions.by_form_type[sub.tax_form_type] || 0) + 1;
    });

    // Group activities
    activities.forEach(act => {
      report.activities.by_action[act.action] = (report.activities.by_action[act.action] || 0) + 1;
    });

    console.log(`[MONTHLY-REPORT] Generated: ${report.submissions.total} submissions`);

    return Response.json({
      success: true,
      report
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});