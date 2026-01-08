import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    // Service-role call for scheduled task
    const base44 = createClientFromRequest(req);

    console.log('[AUTO-SUBMIT] Checking for forms ready to submit');

    // Hole alle VALIDATED Submissions
    const submissions = await base44.asServiceRole.entities.ElsterSubmission.filter();
    const readyToSubmit = submissions.filter(s => 
      s.status === 'VALIDATED' && 
      s.ai_confidence_score >= 85 &&
      !s.submission_date
    );

    console.log(`Found ${readyToSubmit.length} forms ready for auto-submission`);

    let submitted = 0;
    let failed = 0;

    for (const submission of readyToSubmit) {
      try {
        // Auto-submit via ERiC
        const response = await base44.asServiceRole.functions.invoke('ericMicroserviceSubmit', {
          submission_id: submission.id,
          test_mode: submission.submission_mode === 'TEST'
        });

        if (response.data.success) {
          submitted++;
          
          // Notifikation an User
          const users = await base44.asServiceRole.entities.User.filter({
            id: submission.created_by
          });
          
          if (users?.length > 0) {
            await base44.integrations.Core.SendEmail({
              to: users[0].email,
              subject: `✓ ${submission.tax_form_type} automatisch übermittelt`,
              body: `Ihr Formular ${submission.tax_form_type} für ${submission.tax_year} wurde automatisch an ELSTER übermittelt. Transfer-ID: ${response.data.transfer_ticket}`
            });
          }
        } else {
          failed++;
        }
      } catch (error) {
        failed++;
        console.log('Auto-submit failed for', submission.id, error.message);
      }
    }

    return Response.json({ 
      success: true, 
      checked: readyToSubmit.length,
      submitted,
      failed
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});