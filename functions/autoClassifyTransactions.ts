import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { transactions } = await req.json();

    // KI-gestützte Klassifizierung
    const classified = await base44.integrations.Core.InvokeLLM({
      prompt: `Du bist ein Buchhaltungs-Experte. Klassifiziere folgende Transaktionen und ordne sie Tax-Kategorien zu.

Transaktionen:
${JSON.stringify(transactions, null, 2)}

Für jede Transaktion gib an:
- Einkommentyp (z.B. Kapitalertrag, Mieteinnahme, Geschäftstätigkeit, sonstige Einkünfte)
- Steuerkategorie
- Meldepflicht (CRS/FATCA/AEoI)
- Relevant für welche Länder
- Besonderheiten`,
      response_json_schema: {
        type: "object",
        properties: {
          classifications: {
            type: "array",
            items: {
              type: "object",
              properties: {
                transaction_id: { type: "string" },
                income_type: { type: "string" },
                tax_category: { type: "string" },
                country: { type: "string" },
                reporting_requirement: { type: "string" },
                confidence: { type: "number" },
                note: { type: "string" }
              }
            }
          }
        }
      }
    });

    return Response.json({
      user_email: user.email,
      classified_transactions: classified.classifications,
      total_classified: classified.classifications.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});