import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { years_old = 2, only_accepted = true } = await req.json();

    console.log(`[ARCHIVE] Archiving submissions older than ${years_old} years`);

    const cutoffDate = new Date();
    cutoffDate.setFullYear(cutoffDate.getFullYear() - years_old);

    const allSubmissions = await base44.asServiceRole.entities.ElsterSubmission.list('-created_date', 1000);

    const toArchive = allSubmissions.filter(sub => {
      const created = new Date(sub.created_date);
      const isOld = created < cutoffDate;
      const canArchive = only_accepted ? sub.status === 'ACCEPTED' : true;
      return isOld && canArchive && sub.status !== 'ARCHIVED';
    });

    const archived = [];
    const failed = [];

    for (const sub of toArchive) {
      try {
        await base44.asServiceRole.entities.ElsterSubmission.update(sub.id, {
          status: 'ARCHIVED',
          archived_at: new Date().toISOString()
        });

        // Backup erstellen
        await base44.functions.invoke('automatedBackupElster', {
          submission_id: sub.id
        });

        archived.push(sub.id);
      } catch (error) {
        failed.push({ submission_id: sub.id, error: error.message });
      }
    }

    return Response.json({ 
      success: true, 
      archived_count: archived.length,
      failed_count: failed.length,
      failed
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});