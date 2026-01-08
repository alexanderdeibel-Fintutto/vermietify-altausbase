import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submission_id, template_name, description } = await req.json();

    if (!submission_id || !template_name) {
      return Response.json({ 
        error: 'submission_id and template_name required' 
      }, { status: 400 });
    }

    console.log(`[SAVE-TEMPLATE] Creating template "${template_name}" from ${submission_id}`);

    const submission = await base44.entities.ElsterSubmission.filter({ id: submission_id });
    
    if (submission.length === 0) {
      return Response.json({ error: 'Submission not found' }, { status: 404 });
    }

    const sub = submission[0];

    // Erstelle Template-Entity (verwenden wir ElsterFormTemplate)
    const template = await base44.entities.ElsterFormTemplate.create({
      form_type: sub.tax_form_type,
      legal_form: sub.legal_form,
      year: sub.tax_year,
      description: description || `Template erstellt aus Submission ${sub.tax_year}`,
      version: '1.0',
      is_active: true,
      xml_template: sub.xml_data || '',
      field_mappings: sub.form_data || {},
      validation_rules: []
    });

    // Log
    await base44.asServiceRole.entities.ActivityLog.create({
      entity_type: 'ElsterFormTemplate',
      entity_id: template.id,
      action: 'template_created',
      user_id: user.id,
      metadata: {
        source_submission_id: submission_id,
        template_name,
        form_type: sub.tax_form_type
      }
    });

    console.log(`[SAVE-TEMPLATE] Created template ${template.id}`);

    return Response.json({
      success: true,
      template
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});