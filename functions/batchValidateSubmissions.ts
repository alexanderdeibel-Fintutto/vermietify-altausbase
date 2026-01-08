import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submission_ids } = await req.json();

    if (!submission_ids || submission_ids.length === 0) {
      return Response.json({ error: 'No submission IDs provided' }, { status: 400 });
    }

    const results = [];

    for (const id of submission_ids) {
      try {
        const submission = await base44.asServiceRole.entities.ElsterSubmission.get(id);
        
        if (!submission) {
          results.push({ id, success: false, error: 'Not found' });
          continue;
        }

        // Plausibilitätsprüfung
        const validation = await base44.asServiceRole.functions.invoke('validateFormPlausibility', {
          form_data: submission.form_data,
          form_type: submission.tax_form_type,
          building_id: submission.building_id
        });

        if (validation.data.is_valid) {
          await base44.asServiceRole.entities.ElsterSubmission.update(id, {
            status: 'VALIDATED',
            validation_errors: [],
            validation_warnings: validation.data.warnings || []
          });

          results.push({ 
            id, 
            success: true, 
            status: 'VALIDATED',
            warnings: validation.data.warnings?.length || 0
          });
        } else {
          await base44.asServiceRole.entities.ElsterSubmission.update(id, {
            validation_errors: validation.data.errors,
            validation_warnings: validation.data.warnings || []
          });

          results.push({ 
            id, 
            success: false, 
            errors: validation.data.errors.length,
            warnings: validation.data.warnings?.length || 0
          });
        }
      } catch (error) {
        results.push({ id, success: false, error: error.message });
      }
    }

    const successCount = results.filter(r => r.success).length;

    return Response.json({
      success: true,
      validated: successCount,
      total: results.length,
      results
    });

  } catch (error) {
    console.error('Batch validation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});