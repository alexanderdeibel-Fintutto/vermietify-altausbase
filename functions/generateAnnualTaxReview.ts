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

    // Fetch year-over-year data
    const prevYear = taxYear - 1;
    const [currentCalc, prevCalc, currentCompliance, prevCompliance] = await Promise.all([
      base44.entities.TaxCalculation.filter({ user_email: user.email, country, tax_year: taxYear }).catch(() => []),
      base44.entities.TaxCalculation.filter({ user_email: user.email, country, tax_year: prevYear }).catch(() => []),
      base44.entities.TaxCompliance.filter({ user_email: user.email, country, tax_year: taxYear }).catch(() => []),
      base44.entities.TaxCompliance.filter({ user_email: user.email, country, tax_year: prevYear }).catch(() => [])
    ]);

    const currentTax = currentCalc.reduce((sum, c) => sum + (c.total_tax || 0), 0);
    const prevTax = prevCalc.reduce((sum, c) => sum + (c.total_tax || 0), 0);
    const taxChange = currentTax - prevTax;

    const review = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate comprehensive annual tax review for ${country}, comparing ${prevYear} and ${taxYear}.

Year-over-Year Comparison:
- ${prevYear} Tax: €${Math.round(prevTax)}
- ${taxYear} Tax: €${Math.round(currentTax)}
- Change: €${Math.round(taxChange)} (${taxChange >= 0 ? '+' : ''}${((taxChange / prevTax) * 100).toFixed(1)}%)

Compliance:
- ${prevYear}: ${prevCompliance.length} items
- ${taxYear}: ${currentCompliance.length} items

Provide comprehensive annual review with:
1. Executive summary of tax position
2. Year-over-year tax comparison
3. Compliance improvements/issues
4. Key achievements
5. Areas for improvement
6. Recommendations for next year
7. Long-term tax strategy adjustments
8. Risk assessment`,
      response_json_schema: {
        type: 'object',
        properties: {
          executive_summary: { type: 'string' },
          yoy_comparison: { type: 'object', additionalProperties: true },
          key_achievements: { type: 'array', items: { type: 'string' } },
          areas_for_improvement: { type: 'array', items: { type: 'string' } },
          recommendations: { type: 'array', items: { type: 'string' } },
          strategic_outlook: { type: 'string' },
          next_year_priorities: { type: 'array', items: { type: 'string' } }
        }
      }
    });

    return Response.json({
      status: 'success',
      review: {
        country,
        tax_year: taxYear,
        comparison_year: prevYear,
        generated_at: new Date().toISOString(),
        tax_comparison: {
          previous_year: prevTax,
          current_year: currentTax,
          change: taxChange,
          percentage_change: Math.round((taxChange / prevTax) * 100 * 100) / 100
        },
        content: review
      }
    });
  } catch (error) {
    console.error('Generate annual review error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});