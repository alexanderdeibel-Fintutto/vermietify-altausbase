import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { country, taxYear, scenarioType, parameters } = await req.json();

    if (!country || !taxYear || !scenarioType) {
      return Response.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Fetch base calculation
    const baseCalc = await base44.entities.TaxCalculation.filter(
      { user_email: user.email, country, tax_year: taxYear },
      '-updated_date',
      1
    ).catch(() => [])[0];

    const simulation = await base44.integrations.Core.InvokeLLM({
      prompt: `Simulate tax scenario for ${country}, scenario type: ${scenarioType}, tax year ${taxYear}.

Base Data:
- Current Total Tax: €${baseCalc?.total_tax || 0}
- Current Parameters: ${JSON.stringify(parameters || {})}

Scenario Type: ${scenarioType}
- income_increase: What if income increases by X%?
- deduction_increase: What if deductions increase by X%?
- business_expansion: What if business expands?
- investment_change: What if investment portfolio changes?

Provide:
1. Scenario description
2. Projected tax impact
3. Tax savings/increase percentage
4. Monthly payment impact
5. Risk assessment
6. Implementation feasibility
7. Timeline
8. Alternative strategies`,
      response_json_schema: {
        type: 'object',
        properties: {
          scenario_name: { type: 'string' },
          description: { type: 'string' },
          projected_tax: { type: 'number' },
          tax_change: { type: 'number' },
          percentage_change: { type: 'number' },
          monthly_impact: { type: 'number' },
          feasibility: { type: 'string' },
          risk_level: { type: 'string' },
          advantages: { type: 'array', items: { type: 'string' } },
          disadvantages: { type: 'array', items: { type: 'string' } },
          implementation_steps: { type: 'array', items: { type: 'string' } }
        }
      }
    });

    return Response.json({
      status: 'success',
      simulation: {
        country,
        tax_year: taxYear,
        scenario_type: scenarioType,
        created_at: new Date().toISOString(),
        base_tax: baseCalc?.total_tax || 0,
        result: simulation
      }
    });
  } catch (error) {
    console.error('Simulate tax scenario error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});