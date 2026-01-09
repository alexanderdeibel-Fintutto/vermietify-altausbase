import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tax_year, country } = await req.json();
    const profile = (await base44.entities.TaxProfile.filter({ user_email: user.email }, '-updated_date', 1))[0];
    const calculation = (await base44.entities.TaxCalculation.filter({ user_email: user.email, country, tax_year }, '-updated_date', 1))[0];

    // Deduction Maximization Engine
    const optimization = await base44.integrations.Core.InvokeLLM({
      prompt: `Analysiere Deduction Maximization Optionen für ${user.email} in ${country} (${tax_year}):

CURRENT TAX DATA:
${JSON.stringify(calculation?.calculation_data || {}, null, 2)}

LÄNDER-SPEZIFISCHE DEDUCTIONS:
${country === 'DE' ? 'Werbekosten, Homeoffice, Fahrtkosten, Vorsorgaufwendungen, Unterhaltsleistungen' :
country === 'CH' ? 'Berufsauslagen, Unterhaltskosten, Pensionsbeiträge, Schuldzinsen' :
'Professional expenses, medical deductions, charitable contributions'}

ANALYSIERE:
1. Currently Claimed Deductions
2. Missing/Overlooked Deductions
3. Documentation Requirements pro Deduction
4. Timing Strategies (current vs. next year)
5. Bunching Opportunities
6. Carryforward/Carryback Options
7. AGI Phase-out Impact
8. Estimated Savings

GEBE KONKRETE RECOMMENDATIONS MIT DOLLARBETRÄGEN:`,
      response_json_schema: {
        type: "object",
        properties: {
          country: { type: "string" },
          current_deductions: { type: "number" },
          identified_missed_deductions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                deduction_type: { type: "string" },
                estimated_amount: { type: "number" },
                effort_to_claim: { type: "string" }
              }
            }
          },
          total_additional_deductions: { type: "number" },
          estimated_tax_savings: { type: "number" },
          implementation_timeline: { type: "string" }
        }
      }
    });

    return Response.json({
      user_email: user.email,
      country,
      tax_year,
      deduction_optimization: optimization
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});