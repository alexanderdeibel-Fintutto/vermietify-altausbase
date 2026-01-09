import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { countries = ['AT', 'CH', 'DE'], taxYear } = await req.json();

    if (!taxYear) {
      return Response.json({ error: 'Missing taxYear' }, { status: 400 });
    }

    // Fetch data for each country
    const countryData = await Promise.all(
      countries.map(async (country) => {
        const filings = await base44.entities.TaxFiling.filter({ country, tax_year: taxYear }).catch(() => []);
        const calculations = await base44.entities.TaxCalculation.filter({ country, tax_year: taxYear }).catch(() => []);
        
        return {
          country,
          filing_count: filings.length,
          total_tax: calculations.reduce((sum, c) => sum + (c.total_tax || 0), 0)
        };
      })
    );

    const report = await base44.integrations.Core.InvokeLLM({
      prompt: `Create comprehensive multi-country tax report for ${countries.join(', ')}, year ${taxYear}.

Data per country:
${JSON.stringify(countryData, null, 2)}

Generate report with:
1. Summary by country
2. Comparative analysis
3. Optimization opportunities across countries
4. Compliance status per jurisdiction
5. Action items
6. Risk assessment`,
      response_json_schema: {
        type: 'object',
        properties: {
          report_title: { type: 'string' },
          summary_by_country: { type: 'array', items: { type: 'object', additionalProperties: true } },
          comparative_analysis: { type: 'string' },
          optimization_opportunities: { type: 'array', items: { type: 'string' } },
          compliance_summary: { type: 'object', additionalProperties: { type: 'string' } },
          action_items: { type: 'array', items: { type: 'string' } },
          risk_assessment: { type: 'string' }
        }
      }
    });

    return Response.json({
      status: 'success',
      report: {
        countries,
        tax_year: taxYear,
        generated_at: new Date().toISOString(),
        analysis: report
      }
    });
  } catch (error) {
    console.error('Generate multi-country report error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});