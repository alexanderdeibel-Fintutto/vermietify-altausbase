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

    // Fetch tax calculation and planning data
    const [calculations, planning, documents] = await Promise.all([
      base44.entities.TaxCalculation.filter({ user_email: user.email, country, tax_year: taxYear }) || [],
      base44.entities.TaxPlanning.filter({ user_email: user.email, country, tax_year: taxYear }) || [],
      base44.entities.TaxDocument.filter({ user_email: user.email, country, tax_year: taxYear }) || []
    ]);

    const totalTax = calculations.reduce((sum, c) => sum + (c.total_tax || 0), 0);
    const existingPlans = planning.length;
    const docCount = documents.length;

    const optimization = await base44.integrations.Core.InvokeLLM({
      prompt: `Optimize tax deductions for ${country} taxpayer, tax year ${taxYear}.

Current Status:
- Total Tax: €${Math.round(totalTax)}
- Tax Plans: ${existingPlans}
- Documents: ${docCount}

Identify and prioritize:
1. Missed deduction opportunities
2. Timing-based deductions
3. Non-obvious deductions
4. Deduction documentation gaps
5. Country-specific allowances
6. Estimated tax savings per deduction
7. Implementation complexity
8. Risk level of each deduction`,
      response_json_schema: {
        type: 'object',
        properties: {
          current_deduction_rate: { type: 'number' },
          optimization_potential: { type: 'number' },
          deductions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                description: { type: 'string' },
                estimated_savings: { type: 'number' },
                priority: { type: 'string' },
                complexity: { type: 'string' },
                risk_level: { type: 'string' },
                documentation_needed: { type: 'array', items: { type: 'string' } },
                timeline: { type: 'string' }
              }
            }
          },
          total_potential_savings: { type: 'number' },
          implementation_steps: { type: 'array', items: { type: 'string' } }
        }
      }
    });

    return Response.json({
      status: 'success',
      optimization: {
        country,
        tax_year: taxYear,
        generated_at: new Date().toISOString(),
        analysis: optimization
      }
    });
  } catch (error) {
    console.error('Optimize deductions error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});