import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tax_year } = await req.json();

    // Multi-year Tax Performance Analyse
    const calculations = await base44.entities.TaxCalculation.filter({
      user_email: user.email,
      tax_year: { $gte: tax_year - 2 }
    }, '-tax_year');

    const performance = await base44.integrations.Core.InvokeLLM({
      prompt: `Analysiere Tax Performance für ${user.email} über letzte 3 Jahre:

HISTORISCHE DATEN:
${JSON.stringify(calculations, null, 2)}

BERECHNE:
1. Tax burden trend (steigt/sinkt/stabil)
2. Effective tax rate Entwicklung
3. Year-over-year Vergleich
4. Optimierungspotential identifiziert
5. Benchmark vs. Profile-Durchschnitt
6. Prediction für nächstes Jahr
7. Key performance indicators`,
      response_json_schema: {
        type: "object",
        properties: {
          tax_burden_trend: { type: "string" },
          average_effective_rate: { type: "number" },
          current_year_burden: { type: "number" },
          improvement_opportunities: { type: "array", items: { type: "string" } },
          forecast_next_year: { type: "number" },
          benchmark_comparison: { type: "string" },
          kpis: { type: "object", additionalProperties: { type: "number" } }
        }
      }
    });

    return Response.json({
      user_email: user.email,
      tax_year,
      performance_analysis: performance,
      historical_data: calculations
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});