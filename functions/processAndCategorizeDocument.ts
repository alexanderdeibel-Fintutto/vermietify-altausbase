import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fileUrl, country, taxYear } = await req.json();

    if (!fileUrl || !country || !taxYear) {
      return Response.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Use InvokeLLM to analyze document
    const analysisResult = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze this tax document and extract key information. Determine:
1. Document type (bank_statement, investment_confirmation, dividend_slip, tax_certificate, expense_receipt, mortgage_agreement, rental_agreement, insurance_policy, trading_log, other)
2. Key amounts and values
3. Date of document
4. Account/Reference numbers
5. Relevant tax category
6. Any red flags or issues

Return as JSON with fields: document_type, amounts (array), document_date, reference_numbers (array), tax_category, issues (array)`,
      file_urls: [fileUrl],
      response_json_schema: {
        type: 'object',
        properties: {
          document_type: { type: 'string' },
          amounts: { type: 'array', items: { type: 'object' } },
          document_date: { type: 'string' },
          reference_numbers: { type: 'array', items: { type: 'string' } },
          tax_category: { type: 'string' },
          issues: { type: 'array', items: { type: 'string' } }
        }
      }
    });

    // Save analyzed document
    const documentRecord = await base44.entities.TaxDocument.create({
      user_email: user.email,
      country,
      tax_year: taxYear,
      document_type: analysisResult.document_type,
      file_url: fileUrl,
      title: `${analysisResult.document_type.replace(/_/g, ' ')} - ${analysisResult.document_date}`,
      description: `Automatically processed and categorized`,
      extracted_data: analysisResult,
      status: 'processed',
      tags: [analysisResult.tax_category],
      uploaded_at: new Date().toISOString(),
      notes: analysisResult.issues?.length > 0 ? `Issues found: ${analysisResult.issues.join(', ')}` : ''
    });

    // Create alerts if issues detected
    if (analysisResult.issues?.length > 0) {
      for (const issue of analysisResult.issues) {
        await base44.entities.TaxAlert.create({
          user_email: user.email,
          country,
          alert_type: 'document_issue',
          title: 'Document Processing Issue',
          message: `Issue detected in document: ${issue}`,
          severity: 'warning',
          related_entity: documentRecord.id,
          action_url: `/tax/documents/${documentRecord.id}`,
          priority: 'medium'
        });
      }
    }

    return Response.json({
      status: 'success',
      document_id: documentRecord.id,
      analysis: analysisResult,
      message: 'Document processed and categorized successfully'
    });
  } catch (error) {
    console.error('Document processing error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});