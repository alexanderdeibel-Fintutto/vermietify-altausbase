import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taxYear, income, countries = ['AT', 'CH', 'DE'] } = await req.json();

    if (!taxYear || !income) {
      return Response.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const comparison = await base44.integrations.Core.InvokeLLM({
      prompt: `Compare tax burden for income of €${income} across countries: ${countries.join(', ')} for tax year ${taxYear}.

Analyze:
1. Income tax rates and brackets
2. Wealth tax/asset tax considerations
3. Deduction opportunities
4. Social contributions
5. Total effective tax rates
6. Advantages/disadvantages per country
7. Relocation considerations`,
      response_json_schema: {
        type: 'object',
        properties: {
          countries: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                country: { type: 'string' },
                income_tax: { type: 'number' },
                wealth_tax: { type: 'number' },
                social_contributions: { type: 'number' },
                deductions: { type: 'number' },
                effective_rate: { type: 'number' },
                net_income: { type: 'number' },
                advantages: { type: 'array', items: { type: 'string' } },
                disadvantages: { type: 'array', items: { type: 'string' } }
              }
            }
          },
          most_favorable: { type: 'string' },
          savings_potential: { type: 'number' },
          recommendations: { type: 'array', items: { type: 'string' } }
        }
      }
    });

    return Response.json({
      status: 'success',
      comparison: {
        tax_year: taxYear,
        annual_income: income,
        countries: countries,
        analysis: comparison
      }
    });
  } catch (error) {
    console.error('Generate comparison error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});