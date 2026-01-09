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

    // Dividend Optimization für Aktien/Partizipationen
    const optimization = await base44.integrations.Core.InvokeLLM({
      prompt: `Optimiere Dividenden-Strategie für ${user.email} in ${country} (${tax_year}):

LÄNDER-SPEZIFISCHE RULES:
${country === 'CH' ? 'Flat Tax auf Dividenden, Teilbefreiungssystem, Holding-Privilege, Beteiligungsertragsabzug' :
country === 'DE' ? 'Partnerschaftsmodell, Solidaritätszuschlag, Kirchensteuer, Anrechnung Kapitalertragsteuer' :
'Dividend Tax mit FVA, Beteiligungsertragsabzug, Treaty Benefits'}

ANALYSE:
1. Laufende Dividenden vs. Thesaurierung
2. Realisierte Gewinne vs. unrealisierte halten
3. Holding-Periode Optimierung
4. Doppelbesteuerungsabkommen
5. Partnerschaftsanteile vs. Aktien
6. Foreign Dividend Treatment
7. Loss Carryforward Matching
8. Timing: Wann Dividenden nehmen

GEBE KONKRETE HANDLUNGEN:`,
      response_json_schema: {
        type: "object",
        properties: {
          country: { type: "string" },
          current_annual_dividends: { type: "number" },
          current_tax_rate: { type: "number" },
          optimized_tax_rate: { type: "number" },
          estimated_annual_savings: { type: "number" },
          strategies: { type: "array", items: { type: "string" } },
          timing_recommendations: { type: "array", items: { type: "string" } },
          documentation_required: { type: "array", items: { type: "string" } }
        }
      }
    });

    return Response.json({
      user_email: user.email,
      country,
      tax_year,
      dividend_optimization: optimization
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});