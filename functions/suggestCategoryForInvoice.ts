import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { recipient, description, amount, type } = await req.json();

    // Fetch existing invoices for pattern matching
    const invoices = await base44.asServiceRole.entities.Invoice?.list?.('-created_date', 100) || [];
    const costTypes = await base44.asServiceRole.entities.CostType?.list?.() || [];

    // Find invoices from same recipient
    const recipientInvoices = invoices.filter(inv => inv.recipient === recipient);
    const lastCategory = recipientInvoices[0]?.cost_type_id;

    // If we have a recent invoice from same recipient, suggest that category
    if (lastCategory && costTypes.find(ct => ct.id === lastCategory)) {
      return Response.json({
        suggested_cost_type_id: lastCategory,
        confidence: 0.9,
        reasoning: `Zuletzt für "${recipient}" verwendet`,
        source: 'recipient_history'
      });
    }

    // Otherwise use AI for smarter suggestions
    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `Analysiere diese Rechnungsinformation und schlage die passendste Kostenart vor.

Rechnungsdetails:
- Empfänger: ${recipient}
- Beschreibung: ${description}
- Betrag: ${amount}€
- Typ: ${type === 'expense' ? 'Ausgabe' : 'Einnahme'}

Verfügbare Kostenarten:
${costTypes.map(ct => `- ID: ${ct.id}, Hauptkategorie: ${ct.main_category}, Kategorie: ${ct.sub_category}`).join('\n')}

Analysiere und gib die ID der am besten passenden Kostenart zurück.`,
      response_json_schema: {
        type: "object",
        properties: {
          suggested_cost_type_id: { type: "string" },
          confidence: { type: "number" },
          reasoning: { type: "string" }
        }
      }
    });

    return Response.json(response);
  } catch (error) {
    console.error('Suggestion error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});