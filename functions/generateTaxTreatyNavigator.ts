import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { country1, country2, income_type } = await req.json();

    // Tax Treaty Navigator für Double Taxation Avoidance
    const treaty = await base44.integrations.Core.InvokeLLM({
      prompt: `Navigiere Tax Treaty zwischen ${country1} und ${country2}:

EINKOMMEN TYP: ${income_type}

ANALYSIERE:
1. Treaty Status (aktiv, year signed)
2. Applicable Article (Salaries, Business Profits, Dividends, etc.)
3. Tax Rates in each country
4. Relief Methods (Foreign Tax Credit, Exemption)
5. Withholding Tax Limits
6. PE (Permanent Establishment) Thresholds
7. Beneficial Owner Requirements
8. Documentation (Form W-8BEN, Certificates of Residency)

GEBE:
- Optimal tax position
- Required forms
- Timing considerations
- Compliance checklist`,
      response_json_schema: {
        type: "object",
        properties: {
          countries: { type: "array", items: { type: "string" } },
          treaty_signed: { type: "string" },
          applicable_article: { type: "string" },
          tax_rate_country1: { type: "number" },
          tax_rate_country2: { type: "number" },
          relief_method: { type: "string" },
          withholding_tax_limit: { type: "number" },
          required_documentation: { type: "array", items: { type: "string" } },
          effective_tax_rate: { type: "number" }
        }
      }
    });

    return Response.json({
      user_email: user.email,
      country1,
      country2,
      income_type,
      treaty_analysis: treaty
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});