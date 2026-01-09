import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { country, taxYear, formType } = await req.json();

    if (!country || !taxYear || !formType) {
      return Response.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Fetch relevant data based on form type
    const [documents, calculations, income, investments] = await Promise.all([
      base44.entities.TaxDocument.filter({ user_email: user.email, country, tax_year: taxYear }).catch(() => []),
      base44.entities.TaxCalculation.filter({ user_email: user.email, country, tax_year: taxYear }).catch(() => []),
      base44.entities.OtherIncome.filter({ user_email: user.email }).catch(() => []),
      base44.entities.Investment.filter({ user_email: user.email, country }).catch(() => [])
    ]);

    const guidance = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate detailed step-by-step guidance for completing ${formType} tax form in ${country} for ${taxYear}.

Available Documents: ${documents.length}
Income Sources: ${income.length}
Investments: ${investments.length}

Provide:
1. Form overview and purpose
2. Prerequisites (documents needed)
3. Line-by-line completion guide
4. Common mistakes to avoid
5. Where to find needed information
6. Related forms to file
7. Filing deadline and extensions
8. Electronic filing vs paper
9. Penalties for errors
10. Important due dates
11. Follow-up items needed`,
      response_json_schema: {
        type: 'object',
        properties: {
          form_overview: { type: 'string' },
          prerequisites: { type: 'array', items: { type: 'string' } },
          line_by_line_guide: { type: 'array', items: { type: 'object', additionalProperties: true } },
          common_mistakes: { type: 'array', items: { type: 'string' } },
          required_documents: { type: 'array', items: { type: 'string' } },
          related_forms: { type: 'array', items: { type: 'string' } },
          filing_deadline: { type: 'string' },
          penalties_and_fines: { type: 'array', items: { type: 'string' } },
          follow_up_items: { type: 'array', items: { type: 'string' } }
        }
      }
    });

    return Response.json({
      status: 'success',
      guidance: {
        country,
        tax_year: taxYear,
        form_type: formType,
        generated_at: new Date().toISOString(),
        content: guidance
      }
    });
  } catch (error) {
    console.error('Generate tax form guidance error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});