import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tax_year, home_country, operating_countries, business_model } = await req.json();

    // PE (Permanent Establishment) Risk Analysis
    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt: `Analysiere Permanent Establishment (PE) Risiken für ${user.email}:

HOME COUNTRY: ${home_country}
OPERATING IN: ${operating_countries.join(', ')}
BUSINESS MODEL: ${business_model}

PE DEFINITION NACH OECD:
- Fixed Place of Business?
- Dependent Agent?
- Construction Site (> 6 months)?
- Services Personnel?

ANALYSIERE:
1. Current Structure → PE Risk?
2. Applicable Tax Treaties
3. Safe Harbor Planning
4. Documentation Requirements
5. Nexus Approach (Pillar One)
6. Transfer Pricing Risk
7. Withholding Tax Implications
8. Mitigation Strategies

RISK LEVELS:
- Green: No PE Expected
- Yellow: Requires Review
- Red: Likely PE Exists`,
      response_json_schema: {
        type: "object",
        properties: {
          home_country: { type: "string" },
          operating_countries: { type: "array", items: { type: "string" } },
          pe_risk_level: { type: "string", enum: ["green", "yellow", "red"] },
          identified_pe_risks: { type: "array", items: { type: "string" } },
          applicable_treaties: { type: "array", items: { type: "string" } },
          mitigation_strategies: { type: "array", items: { type: "string" } },
          documentation_required: { type: "array", items: { type: "string" } }
        }
      }
    });

    return Response.json({
      user_email: user.email,
      tax_year,
      pe_analysis: analysis
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});