import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submission_id } = await req.json();

    const submission = await base44.asServiceRole.entities.ElsterSubmission.get(submission_id);
    
    if (!submission) {
      return Response.json({ error: 'Submission not found' }, { status: 404 });
    }

    // GoBD-konforme Archivierung
    const archiveData = {
      submission_id: submission.id,
      tax_form_type: submission.tax_form_type,
      tax_year: submission.tax_year,
      form_data: submission.form_data,
      xml_data: submission.xml_data,
      elster_response: submission.elster_response,
      transfer_ticket: submission.transfer_ticket,
      archived_at: new Date().toISOString(),
      archived_by: user.email
    };

    // Als unveränderliche Datei speichern
    const blob = new Blob([JSON.stringify(archiveData, null, 2)], { type: 'application/json' });
    const file = new File([blob], `elster_archive_${submission.id}.json`);

    const uploadResult = await base44.integrations.Core.UploadPrivateFile({ file });

    // Submission aktualisieren
    await base44.asServiceRole.entities.ElsterSubmission.update(submission_id, {
      status: 'ARCHIVED',
      archived_at: new Date().toISOString()
    });

    return Response.json({
      success: true,
      archive_uri: uploadResult.file_uri,
      message: 'Erfolgreich archiviert (10 Jahre aufbewahrungspflichtig)'
    });

  } catch (error) {
    console.error('Error archiving submission:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});