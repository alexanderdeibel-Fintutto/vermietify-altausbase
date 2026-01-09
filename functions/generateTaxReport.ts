import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { country, taxYear, reportType } = await req.json();

    if (!country || !taxYear || !reportType) {
      return Response.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Fetch related data
    const calculations = await base44.entities.TaxCalculation.filter({
      user_email: user.email,
      country,
      tax_year: taxYear
    }) || [];

    const filings = await base44.entities.TaxFiling.filter({
      user_email: user.email,
      country,
      tax_year: taxYear
    }) || [];

    const plannings = await base44.entities.TaxPlanning.filter({
      user_email: user.email,
      country,
      tax_year: taxYear
    }) || [];

    const compliance = await base44.entities.TaxCompliance.filter({
      user_email: user.email,
      country,
      tax_year: taxYear
    }) || [];

    // Generate report content
    const reportData = {
      user_name: user.full_name,
      user_email: user.email,
      country,
      tax_year: taxYear,
      report_type: reportType,
      generated_at: new Date().toISOString(),
      summary: {
        total_tax: calculations.reduce((sum, c) => sum + (c.total_tax || 0), 0),
        total_filings: filings.length,
        total_optimizations: plannings.length,
        compliance_score: compliance.length > 0 
          ? Math.round((compliance.filter(c => c.status === 'completed').length / compliance.length) * 100)
          : 0,
        pending_actions: compliance.filter(c => c.status === 'pending' || c.status === 'at_risk').length
      },
      calculations: calculations.map(c => ({
        calculation_type: c.calculation_type,
        total_tax: c.total_tax,
        status: c.status,
        calculated_at: c.calculated_at
      })),
      filings: filings.map(f => ({
        filing_type: f.filing_type,
        status: f.status,
        submission_date: f.submission_date,
        completion_percentage: f.completion_percentage
      })),
      optimizations: plannings.map(p => ({
        title: p.title,
        planning_type: p.planning_type,
        estimated_savings: p.estimated_savings,
        status: p.status
      })),
      compliance_overview: {
        total_requirements: compliance.length,
        completed: compliance.filter(c => c.status === 'completed').length,
        pending: compliance.filter(c => c.status === 'pending').length,
        at_risk: compliance.filter(c => c.status === 'at_risk').length,
        overdue: compliance.filter(c => c.status === 'overdue').length
      }
    };

    // Generate report text for PDF using AI
    const reportPrompt = `
      Generate a professional tax report for ${user.full_name} in ${country} for tax year ${taxYear}.
      
      Summary:
      - Total Tax: ${reportData.summary.total_tax.toLocaleString()} ${country === 'AT' || country === 'DE' ? '€' : 'CHF'}
      - Compliance Score: ${reportData.summary.compliance_score}%
      - Pending Actions: ${reportData.summary.pending_actions}
      
      Create a comprehensive German-language executive summary including:
      1. Überblick über Steuersituation
      2. Implementierte Optimierungen
      3. Recommendations für nächstes Jahr
      4. Compliance Status
      5. Next Steps
      
      Return ONLY the report text, no markdown formatting.
    `;

    const { data: reportText } = await base44.integrations.Core.InvokeLLM({
      prompt: reportPrompt
    });

    // Create PDF (simplified - in production use a real PDF library)
    const pdfContent = `
TAX REPORT ${taxYear} - ${country}
Generated: ${new Date().toLocaleDateString('de-DE')}
For: ${user.full_name}

${reportText || 'Tax Report'}

SUMMARY
-------
Total Tax: ${reportData.summary.total_tax.toLocaleString()} ${country === 'AT' || country === 'DE' ? '€' : 'CHF'}
Compliance Score: ${reportData.summary.compliance_score}%
Pending Actions: ${reportData.summary.pending_actions}

FILINGS: ${reportData.summary.total_filings}
OPTIMIZATIONS: ${reportData.summary.total_optimizations}
    `;

    // Upload as file
    const { file_url } = await base44.integrations.Core.UploadFile({
      file: pdfContent
    });

    return Response.json({
      status: 'success',
      report_type: reportType,
      file_url,
      summary: reportData.summary,
      generated_at: reportData.generated_at
    });
  } catch (error) {
    console.error('Report generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});