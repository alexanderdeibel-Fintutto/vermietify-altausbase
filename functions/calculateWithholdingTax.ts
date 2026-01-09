import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { country, incomeType, amount, investmentType } = await req.json();

    if (!country || !incomeType || !amount) {
      return Response.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const calculation = await base44.integrations.Core.InvokeLLM({
      prompt: `Calculate withholding tax for ${country}.

Income Type: ${incomeType}
Amount: €${Math.round(amount)}
Investment Type: ${investmentType || 'N/A'}

Provide:
1. Applicable withholding tax rate
2. Tax withheld amount
3. Net amount after withholding
4. Recovery mechanisms
5. Treaty benefits if applicable
6. Form requirements
7. Filing deadlines
8. Documentation needed`,
      response_json_schema: {
        type: 'object',
        properties: {
          withholding_rate: { type: 'number' },
          tax_withheld: { type: 'number' },
          net_amount: { type: 'number' },
          treaty_benefits: { type: 'object', additionalProperties: true },
          recovery_options: { type: 'array', items: { type: 'string' } },
          required_forms: { type: 'array', items: { type: 'string' } },
          deadlines: { type: 'array', items: { type: 'string' } }
        }
      }
    });

    return Response.json({
      status: 'success',
      calculation: {
        country,
        income_type: incomeType,
        gross_amount: amount,
        generated_at: new Date().toISOString(),
        content: calculation
      }
    });
  } catch (error) {
    console.error('Calculate withholding tax error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});