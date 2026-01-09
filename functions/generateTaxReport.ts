import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { country, tax_year, report_type } = await req.json();

    if (!country || !tax_year) {
      return Response.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate a comprehensive ${report_type} tax report for ${country} for tax year ${tax_year}. Include:
      - Executive Summary
      - Tax Calculation Details
      - Deductions & Credits
      - Compliance Status
      - Optimization Opportunities
      - Next Steps
      Format as a professional report with sections and clear recommendations.`,
      response_json_schema: {
        type: 'object',
        properties: {
          report_title: { type: 'string' },
          executive_summary: { type: 'string' },
          sections: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                content: { type: 'string' }
              }
            }
          },
          key_metrics: {
            type: 'object',
            additionalProperties: { type: 'string' }
          },
          recommendations: { type: 'array', items: { type: 'string' } },
          generated_at: { type: 'string' }
        }
      }
    });

    return Response.json({
      success: true,
      report: response,
      country,
      tax_year,
      report_type,
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});