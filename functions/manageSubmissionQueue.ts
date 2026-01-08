import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    console.log('[QUEUE] Managing submission queue');

    const queue = {
      ready_for_validation: [],
      ready_for_submission: [],
      priority_items: [],
      stalled_items: []
    };

    const allSubs = await base44.asServiceRole.entities.ElsterSubmission.list('-created_date', 200);

    // Kategorisiere Submissions
    for (const sub of allSubs) {
      const age = Date.now() - new Date(sub.created_date).getTime();
      const daysOld = Math.floor(age / (1000 * 60 * 60 * 24));

      if (sub.status === 'AI_PROCESSED' && !sub.validation_errors?.length) {
        queue.ready_for_validation.push({ id: sub.id, building_id: sub.building_id });
      }

      if (sub.status === 'VALIDATED' && !sub.submission_date) {
        queue.ready_for_submission.push({ id: sub.id, building_id: sub.building_id });
      }

      // Priority: nahe Deadline
      const currentYear = new Date().getFullYear();
      if (sub.tax_year === currentYear - 1 && sub.status === 'DRAFT') {
        const daysUntilDeadline = Math.floor((new Date(currentYear, 6, 31) - new Date()) / (1000 * 60 * 60 * 24));
        if (daysUntilDeadline < 30 && daysUntilDeadline > 0) {
          queue.priority_items.push({ 
            id: sub.id, 
            building_id: sub.building_id,
            days_until_deadline: daysUntilDeadline 
          });
        }
      }

      // Stalled: alte Drafts
      if (sub.status === 'DRAFT' && daysOld > 60) {
        queue.stalled_items.push({ id: sub.id, building_id: sub.building_id, days_old: daysOld });
      }
    }

    return Response.json({ success: true, queue });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});