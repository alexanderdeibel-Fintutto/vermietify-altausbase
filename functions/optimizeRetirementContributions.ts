import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tax_year, country, annual_income } = await req.json();

    // Pension/Retirement Contribution Optimization
    const optimization = await base44.integrations.Core.InvokeLLM({
      prompt: `Optimiere Retirement Contributions für ${user.email} in ${country} (${tax_year}):

EINKOMMEN: $${annual_income}

VERFÜGBARE OPTIONEN nach ${country} Gesetz:
${country === 'CH' ? '- Säule 3a (CHF 7\'106 max), Säule 3b (unbegrenzt), Firmenrentner' :
country === 'DE' ? '- Riester (max €2.100), Rürup (selbstständig), Betriebsrente, Pensionsfonds' :
'- Pensionsbeiträge (selbstständig), Lebensversicherung, Altersvorsorge (max €30.1k)'}

ANALYSE:
1. Maximum deductible contributions
2. Tax-Free Growth periods
3. Employer Matching opportunities
4. Withdrawal Rules & Penalties
5. Inter-country portability
6. Withholding Tax bei Auszahlung
7. Early Withdrawal Scenarios

BERECHNE:
- Optimal contribution amount
- Tax savings this year
- Impact on next year
- Projection to retirement`,
      response_json_schema: {
        type: "object",
        properties: {
          country: { type: "string" },
          optimal_contribution: { type: "number" },
          tax_deduction: { type: "number" },
          estimated_savings: { type: "number" },
          contribution_types: { type: "array", items: { type: "string" } },
          deadline: { type: "string" },
          retirement_projection: { type: "number" }
        }
      }
    });

    return Response.json({
      user_email: user.email,
      country,
      tax_year,
      retirement_optimization: optimization
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});