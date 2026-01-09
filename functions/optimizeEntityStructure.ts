import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tax_year, countries } = await req.json();

    // Entity Structure Optimization für Multi-Country
    const optimization = await base44.integrations.Core.InvokeLLM({
      prompt: `Optimiere Entity-Struktur für ${user.email} über Länder ${countries.join(', ')} (${tax_year}):

STRUKTUR-OPTIONEN PRO LAND:
- ${countries.includes('CH') ? 'Switzerland: Sole trader, Partnership, AG, Stiftung' : ''}
- ${countries.includes('DE') ? 'Germany: Freelancer, GmbH, AG, Partnership' : ''}
- ${countries.includes('AT') ? 'Austria: Einzelunternehmer, GmbH, Partnerschaft' : ''}

KRITERIEN:
- Einkommensniveaus
- Asset-Struktur
- Grenzüberschreitende Transaktionen
- Liability-Schutz
- Administrative Burden
- Tax Efficiency
- Treaty Benefits

VERGLEICHE:
1. Current vs. Optimal Structure
2. Transition Costs
3. Recurring Tax Savings
4. Payback Period
5. Implementation Timeline
6. Risiken & Compliance

GEBE KONKRETE EMPFEHLUNGEN:`,
      response_json_schema: {
        type: "object",
        properties: {
          current_structure: { type: "string" },
          recommended_structure: { type: "string" },
          estimated_annual_savings: { type: "number" },
          transition_cost: { type: "number" },
          payback_period_months: { type: "number" },
          benefits: { type: "array", items: { type: "string" } },
          risks: { type: "array", items: { type: "string" } },
          implementation_steps: { type: "array", items: { type: "string" } }
        }
      }
    });

    return Response.json({
      user_email: user.email,
      countries,
      tax_year,
      optimization
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});