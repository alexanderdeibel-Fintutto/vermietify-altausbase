import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    console.log('[BACKUP] Starting automated backup');

    const submissions = await base44.asServiceRole.entities.ElsterSubmission.filter({
      status: { $in: ['VALIDATED', 'SUBMITTED', 'ACCEPTED'] }
    });

    const backups = [];

    for (const sub of submissions) {
      const backup = {
        submission_id: sub.id,
        backup_date: new Date().toISOString(),
        form_data: sub.form_data,
        xml_data: sub.xml_data,
        status: sub.status,
        validation_errors: sub.validation_errors,
        elster_response: sub.elster_response
      };

      // Speichere als File
      const fileName = `elster_backup_${sub.id}_${Date.now()}.json`;
      const fileContent = JSON.stringify(backup, null, 2);
      
      // Upload als private file
      const blob = new Blob([fileContent], { type: 'application/json' });
      const file = new File([blob], fileName);
      
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      
      backups.push({ submission_id: sub.id, file_uri });
    }

    console.log(`[BACKUP] Created ${backups.length} backups`);

    return Response.json({ success: true, backups_created: backups.length, backups });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});