import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tax_year } = await req.json();
    const profile = (await base44.entities.TaxProfile.filter({ user_email: user.email }, '-updated_date', 1))[0];

    // Alle relevanten Daten zusammentragen
    const filings = await base44.entities.TaxFiling.filter({ user_email: user.email, tax_year });
    const calculations = await base44.entities.TaxCalculation.filter({ user_email: user.email, tax_year });
    const compliance = await base44.entities.TaxCompliance.filter({ user_email: user.email, tax_year });
    const planning = await base44.entities.TaxPlanning.filter({ user_email: user.email, tax_year });

    // KI-generierter Executive Report für Steuerberater
    const report = await base44.integrations.Core.InvokeLLM({
      prompt: `Erstelle einen umfassenden Executive Tax Report für einen Steuerberater.

STEUERPFLICHTIG:
${user.email}

SITUATION ${tax_year}:
- Länder: ${profile.tax_jurisdictions.join(', ')}
- Profil: ${profile.profile_type}
- Firmenanteile: ${profile.number_of_companies}
- Immobilien: ${profile.number_of_properties}
- Grenzüberschreitend: ${profile.cross_border_transactions}

DATENSTATUS:
- Eingaben: ${filings.length}
- Berechnungen: ${calculations.length}
- Compliance-Checks: ${compliance.length}
- Optimierungsvorschläge: ${planning.length}

Der Report muss enthalten:
1. Executive Summary (max 3 Absätze)
2. Tax Position Overview pro Land
3. Identified Risks & Opportunities
4. Compliance Status
5. Recommendations for Optimization
6. Required Next Steps
7. Timeline for Filing

Format: Professionell, strukturiert, mit Zahlen`,
      response_json_schema: {
        type: "object",
        properties: {
          executive_summary: { type: "string" },
          tax_position_by_country: { type: "object", additionalProperties: { type: "string" } },
          risks_opportunities: { type: "array", items: { type: "string" } },
          compliance_status: { type: "string" },
          recommendations: { type: "array", items: { type: "string" } },
          next_steps: { type: "array", items: { type: "string" } },
          filing_timeline: { type: "array", items: { type: "string" } }
        }
      }
    });

    // PDF-Export vorbereiten
    const reportData = {
      user_email: user.email,
      tax_year,
      generated_date: new Date().toISOString(),
      report
    };

    return Response.json(reportData);

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});