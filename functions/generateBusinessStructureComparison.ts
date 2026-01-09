import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { country, annualIncome, employees } = await req.json();

    const comparison = await base44.integrations.Core.InvokeLLM({
      prompt: `Compare business structures for ${country}, annual income €${Math.round(annualIncome || 0)}, ${employees || 0} employees.

Provide structured comparison of:
1. Sole Proprietor
2. Limited Partnership
3. Corporation/Limited Liability Company
4. Cooperative
5. Holding Structure (if applicable)

For each structure include:
- Income tax rates
- Corporate tax rates
- Social contributions
- Liability considerations
- Administrative burden
- Estimated annual tax cost
- Advantages
- Disadvantages
- Transition complexity`,
      response_json_schema: {
        type: 'object',
        properties: {
          structures: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                tax_cost: { type: 'number' },
                liability: { type: 'string' },
                advantages: { type: 'array', items: { type: 'string' } },
                disadvantages: { type: 'array', items: { type: 'string' } },
                complexity: { type: 'string' }
              },
              additionalProperties: true
            }
          },
          recommended: { type: 'string' },
          transition_costs: { type: 'number' }
        }
      }
    });

    return Response.json({
      status: 'success',
      comparison: {
        country,
        annual_income: annualIncome,
        employees,
        generated_at: new Date().toISOString(),
        content: comparison
      }
    });
  } catch (error) {
    console.error('Generate business structure comparison error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});