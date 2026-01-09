import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { country, year_to_date_income, capital_gains, crypto_gains } = await req.json();

    // KI-basierte Real-time Steuerberechnung
    const estimate = await base44.integrations.Core.InvokeLLM({
      prompt: `Berechne die Steuerschuld für ${country} mit aktuellen ${new Date().getFullYear()} Daten:

EINKOMMEN:
- Laufendes Einkommen (YTD): $${year_to_date_income}
- Kapitalerträge: $${capital_gains}
- Kryptowährungen-Gewinne: $${crypto_gains}

Länder-Spezifisch für ${country}:
- Aktuelle Steuersätze
- Sozialversicherung
- Withholding-Taxes
- Abzüge & Freibeträge
- Estimated Quarterly Payments (falls relevant)

Berechne:
1. Federal/National Tax
2. Lokale/Kantonal Taxes (falls zutreffend)
3. Geschätzte Steuerschuld
4. Empfohlene Q-Payments
5. Eventuell fällige Strafzinsen
6. Optimierungsmöglichkeiten`,
      response_json_schema: {
        type: "object",
        properties: {
          country: { type: "string" },
          year_to_date_income: { type: "number" },
          federal_tax: { type: "number" },
          local_tax: { type: "number" },
          total_estimated_tax: { type: "number" },
          quarterly_payment_due: { type: "number" },
          next_payment_date: { type: "string" },
          penalty_if_underpaid: { type: "number" },
          optimization_tips: { type: "array", items: { type: "string" } },
          confidence_score: { type: "number" }
        }
      }
    });

    return Response.json({
      user_email: user.email,
      country,
      calculated_at: new Date().toISOString(),
      ...estimate
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});