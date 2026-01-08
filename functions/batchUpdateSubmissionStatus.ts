import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { submission_ids, new_status, reason } = await req.json();

    if (!submission_ids || !Array.isArray(submission_ids) || !new_status) {
      return Response.json({ error: 'submission_ids array and new_status required' }, { status: 400 });
    }

    console.log(`[BATCH UPDATE] Updating ${submission_ids.length} submissions to ${new_status}`);

    const results = [];

    for (const id of submission_ids) {
      try {
        const submissions = await base44.entities.ElsterSubmission.filter({ id });
        
        if (!submissions || submissions.length === 0) {
          results.push({ id, success: false, error: 'Not found' });
          continue;
        }

        const submission = submissions[0];
        const oldStatus = submission.status;

        // Update status
        await base44.entities.ElsterSubmission.update(id, {
          status: new_status,
          metadata: {
            ...submission.metadata,
            status_history: [
              ...(submission.metadata?.status_history || []),
              {
                from: oldStatus,
                to: new_status,
                timestamp: new Date().toISOString(),
                user: user.email,
                reason: reason || 'Batch update'
              }
            ]
          }
        });

        // Log audit event
        await base44.functions.invoke('logElsterAuditEvent', {
          submission_id: id,
          event_type: 'STATUS_CHANGED',
          details: `Status changed from ${oldStatus} to ${new_status}: ${reason || 'Batch update'}`,
          metadata: { batch_operation: true }
        });

        // Send notification if status is ACCEPTED or REJECTED
        if (['ACCEPTED', 'REJECTED'].includes(new_status)) {
          await base44.functions.invoke('sendElsterNotification', {
            user_email: submission.created_by,
            notification_type: new_status === 'ACCEPTED' ? 'SUBMISSION_ACCEPTED' : 'SUBMISSION_REJECTED',
            submission_id: id,
            data: {
              form_type: submission.tax_form_type,
              tax_year: submission.tax_year,
              transfer_ticket: submission.transfer_ticket,
              error_message: reason
            }
          });
        }

        results.push({ id, success: true, old_status: oldStatus, new_status });
        console.log(`[SUCCESS] Updated ${id}: ${oldStatus} → ${new_status}`);

      } catch (error) {
        results.push({ id, success: false, error: error.message });
        console.error(`[ERROR] Failed to update ${id}:`, error.message);
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log(`[BATCH COMPLETE] ${successCount} successful, ${failCount} failed`);

    return Response.json({
      success: true,
      total: submission_ids.length,
      success_count: successCount,
      fail_count: failCount,
      results
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});