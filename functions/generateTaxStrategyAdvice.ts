import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { country, taxYear, question } = await req.json();

    if (!country || !taxYear || !question) {
      return Response.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Fetch user context
    const [filings, calculations, investments, income] = await Promise.all([
      base44.entities.TaxFiling.filter({ user_email: user.email, country, tax_year: taxYear }).catch(() => []),
      base44.entities.TaxCalculation.filter({ user_email: user.email, country, tax_year: taxYear }).catch(() => []),
      base44.entities.Investment.filter({ user_email: user.email, country }).catch(() => []),
      base44.entities.OtherIncome.filter({ user_email: user.email }).catch(() => [])
    ]);

    const totalTax = calculations.reduce((sum, c) => sum + (c.total_tax || 0), 0);

    const advice = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert tax advisor for ${country}. Answer the following tax question:

User Question: "${question}"

User Context:
- Total Tax: €${Math.round(totalTax)}
- Investment Count: ${investments.length}
- Income Sources: ${income.length}
- Tax Year: ${taxYear}

Provide:
1. Direct answer to the question
2. Relevant laws/regulations
3. Practical implementation steps
4. Potential tax savings/costs
5. Compliance considerations
6. Related opportunities`,
      response_json_schema: {
        type: 'object',
        properties: {
          answer: { type: 'string' },
          explanation: { type: 'string' },
          relevant_regulations: { type: 'array', items: { type: 'string' } },
          implementation_steps: { type: 'array', items: { type: 'string' } },
          estimated_impact: { type: 'object', additionalProperties: true },
          compliance_notes: { type: 'array', items: { type: 'string' } },
          related_opportunities: { type: 'array', items: { type: 'string' } }
        }
      }
    });

    return Response.json({
      status: 'success',
      advice: {
        question,
        country,
        tax_year: taxYear,
        answered_at: new Date().toISOString(),
        content: advice
      }
    });
  } catch (error) {
    console.error('Generate tax strategy advice error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});