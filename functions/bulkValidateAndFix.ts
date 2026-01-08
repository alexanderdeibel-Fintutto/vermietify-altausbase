import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submission_ids, auto_fix = false } = await req.json();

    console.log(`[BULK-VALIDATE] Processing ${submission_ids.length} submissions`);

    const results = {
      validated: 0,
      fixed: 0,
      failed: 0,
      details: []
    };

    for (const id of submission_ids) {
      try {
        const subs = await base44.entities.ElsterSubmission.filter({ id });
        if (subs.length === 0) continue;

        const sub = subs[0];
        const detail = { id, status: 'validated', issues: [] };

        // Basic validation
        if (!sub.form_data || Object.keys(sub.form_data).length < 3) {
          detail.issues.push('Unvollständige Daten');
        }

        if (!sub.xml_data && sub.status !== 'DRAFT') {
          detail.issues.push('XML fehlt');
        }

        if (sub.validation_errors?.length > 0) {
          detail.issues.push(`${sub.validation_errors.length} Validierungsfehler`);

          if (auto_fix) {
            // Versuche automatische Korrekturen
            const fixResponse = await base44.functions.invoke('autoCorrectErrors', {
              submission_id: id
            });

            if (fixResponse.data.success && fixResponse.data.corrections_applied > 0) {
              detail.status = 'fixed';
              detail.corrections = fixResponse.data.corrections_applied;
              results.fixed++;
            }
          }
        }

        if (detail.issues.length === 0) {
          detail.status = 'ok';
        }

        results.details.push(detail);
        results.validated++;

      } catch (error) {
        results.failed++;
        results.details.push({
          id,
          status: 'error',
          error: error.message
        });
      }
    }

    console.log(`[BULK-VALIDATE] Complete: ${results.validated}/${submission_ids.length}`);

    return Response.json({ success: true, results });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});