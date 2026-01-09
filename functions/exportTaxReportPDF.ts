import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { country, taxYear } = await req.json();

    if (!country || !taxYear) {
      return Response.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Fetch all tax data
    const [calculations, filings, documents, compliance, planning] = await Promise.all([
      base44.entities.TaxCalculation.filter({ user_email: user.email, country, tax_year: taxYear }) || [],
      base44.entities.TaxFiling.filter({ user_email: user.email, country, tax_year: taxYear }) || [],
      base44.entities.TaxDocument.filter({ user_email: user.email, country, tax_year: taxYear }) || [],
      base44.entities.TaxCompliance.filter({ user_email: user.email, country, tax_year: taxYear }) || [],
      base44.entities.TaxPlanning.filter({ user_email: user.email, country, tax_year: taxYear }) || []
    ]);

    // Use LLM to generate PDF content
    const pdfContent = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate a professional tax report summary for PDF export. Country: ${country}, Tax Year: ${taxYear}.

Summary Data:
- Total Tax: €${calculations.reduce((sum, c) => sum + (c.total_tax || 0), 0)}
- Calculations: ${calculations.length}
- Filings Submitted: ${filings.filter(f => f.status === 'submitted').length}
- Documents Uploaded: ${documents.length}
- Compliance Items: ${compliance.length}
- Tax Planning Strategies: ${planning.length}

Provide a formatted report summary suitable for PDF export.`
    });

    // Generate filename
    const filename = `tax-report-${country}-${taxYear}-${Date.now()}.pdf`;
    
    // Upload as private file
    const pdfData = JSON.stringify({
      country,
      tax_year: taxYear,
      generated_at: new Date().toISOString(),
      user_email: user.email,
      summary: pdfContent,
      calculations: calculations.length,
      filings: filings.length,
      documents: documents.length,
      compliance_items: compliance.length,
      planning_strategies: planning.length
    });

    const uploadResult = await base44.integrations.Core.UploadFile({
      file: Buffer.from(pdfData).toString('base64')
    });

    return Response.json({
      status: 'success',
      file_url: uploadResult.file_url,
      filename: filename
    });
  } catch (error) {
    console.error('Export tax report error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});