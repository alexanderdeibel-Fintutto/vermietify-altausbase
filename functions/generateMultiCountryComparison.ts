import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taxYear } = await req.json();

    if (!taxYear) {
      return Response.json({ error: 'Missing tax year' }, { status: 400 });
    }

    // Fetch data for all three countries
    const atCalc = await base44.entities.TaxCalculation.filter({ 
      user_email: user.email, country: 'AT', tax_year: taxYear 
    }) || [];
    const chCalc = await base44.entities.TaxCalculation.filter({ 
      user_email: user.email, country: 'CH', tax_year: taxYear 
    }) || [];
    const deCalc = await base44.entities.TaxCalculation.filter({ 
      user_email: user.email, country: 'DE', tax_year: taxYear 
    }) || [];

    const taxAT = atCalc.reduce((sum, c) => sum + (c.total_tax || 0), 0);
    const taxCH = chCalc.reduce((sum, c) => sum + (c.total_tax || 0), 0);
    const taxDE = deCalc.reduce((sum, c) => sum + (c.total_tax || 0), 0);

    // Use LLM to generate comparison
    const comparison = await base44.integrations.Core.InvokeLLM({
      prompt: `Create a detailed multi-country tax comparison for tax year ${taxYear}.

Austria: €${Math.round(taxAT)} total tax
Switzerland: CHF${Math.round(taxCH)} total tax
Germany: €${Math.round(taxDE)} total tax

Generate a comparison including:
1. Ranking by tax burden
2. Effective tax rates
3. Country-specific advantages
4. Opportunities for optimization
5. Risk considerations
6. Recommendations`,
      response_json_schema: {
        type: 'object',
        properties: {
          ranking: { type: 'array', items: { type: 'string' } },
          advantages: { type: 'object', additionalProperties: { type: 'array', items: { type: 'string' } } },
          opportunities: { type: 'array', items: { type: 'string' } },
          risks: { type: 'array', items: { type: 'string' } },
          recommendations: { type: 'array', items: { type: 'string' } }
        }
      }
    });

    return Response.json({
      status: 'success',
      comparison: {
        tax_year: taxYear,
        countries: {
          AT: { total_tax: taxAT, calculations: atCalc.length },
          CH: { total_tax: taxCH, calculations: chCalc.length },
          DE: { total_tax: taxDE, calculations: deCalc.length }
        },
        analysis: comparison
      }
    });
  } catch (error) {
    console.error('Generate comparison error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});