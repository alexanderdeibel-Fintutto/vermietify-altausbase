import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { template_id, company_id, form_data } = await req.json();

    // Get template
    const templates = await base44.entities.DocumentTemplate.filter({ id: template_id });
    if (templates.length === 0) {
      return Response.json({ error: 'Template not found' }, { status: 404 });
    }
    const template = templates[0];

    // Get company
    const companies = await base44.entities.Company.filter({ id: company_id });
    if (companies.length === 0) {
      return Response.json({ error: 'Company not found' }, { status: 404 });
    }
    const company = companies[0];

    // Prepare placeholder values
    const placeholderValues = {
      company_name: company.name,
      address: company.address,
      tax_id: company.tax_id || '',
      registration_number: company.registration_number || '',
      founded_date: company.founding_date || '',
      legal_form: company.legal_form || '',
      ...form_data
    };

    // Download template
    const templateResponse = await fetch(template.template_url);
    const templateBuffer = await templateResponse.arrayBuffer();

    // Process template (simple text replacement for now)
    let processedContent = new TextDecoder().decode(templateBuffer);
    
    // Replace all placeholders
    Object.entries(placeholderValues).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      processedContent = processedContent.replace(
        new RegExp(placeholder, 'g'),
        value || ''
      );
    });

    // Upload processed document
    const fileName = `${template.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    const uploadResult = await base44.integrations.Core.UploadFile({
      file: new Blob([processedContent], { type: 'application/pdf' })
    });

    // Create document version record
    await base44.entities.DocumentVersion.create({
      document_id: `${company_id}_${template_id}`,
      company_id: company_id,
      file_url: uploadResult.file_url,
      version_number: 1,
      file_name: fileName,
      file_size: processedContent.length,
      uploaded_by: user.email,
      change_notes: `Generated from template: ${template.name}`,
      is_current: true
    });

    // Update template usage count
    await base44.entities.DocumentTemplate.update(template_id, {
      usage_count: (template.usage_count || 0) + 1
    });

    return Response.json({
      success: true,
      file_url: uploadResult.file_url,
      file_name: fileName
    });
  } catch (error) {
    console.error('Document generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});