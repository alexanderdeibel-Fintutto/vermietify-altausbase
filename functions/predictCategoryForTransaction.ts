import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { transaction_id } = await req.json();

    // 1. Hole Transaktion
    const transactions = await base44.entities.BankTransaction.filter({ id: transaction_id });
    if (transactions.length === 0) {
      return Response.json({ error: 'Transaction not found' }, { status: 404 });
    }

    const tx = transactions[0];

    // 2. Hole historische kategorisierte Transaktionen für Muster
    const historicalTxs = await base44.entities.BankTransaction.filter({
      is_categorized: true,
      category: { $ne: null }
    });

    // 3. Benutze Claude für intelligente Vorhersage
    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `Analysiere diese Banktransaktion und sage die beste Kategorie voraus.

Historische Muster (ähnliche Transaktionen):
${JSON.stringify(
  historicalTxs
    .filter(h => 
      h.sender_receiver?.toLowerCase().includes(tx.sender_receiver?.substring(0, 3)?.toLowerCase() || '') ||
      h.description?.toLowerCase().includes(tx.description?.substring(0, 3)?.toLowerCase() || '')
    )
    .slice(0, 10)
    .map(h => ({
      sender: h.sender_receiver,
      description: h.description,
      amount: h.amount,
      category: h.category
    })),
  null,
  2
)}

Zu analysierende Transaktion:
- Sender: ${tx.sender_receiver}
- Beschreibung: ${tx.description}
- Betrag: ${tx.amount}
- Referenz: ${tx.reference}

Verfügbare Kategorien:
- rent_income, other_income (für positive Beträge)
- personnel_wages, personnel_social, room_utilities, room_other, tax_insurance, marketing_travel, maintenance, depreciation_assets, depreciation_minor, other_costs (für negative Beträge)

Antworte nur mit der kategorie und confidence (0-100).`,
      response_json_schema: {
        type: 'object',
        properties: {
          category: { type: 'string' },
          confidence: { type: 'number' },
          reason: { type: 'string' }
        }
      }
    });

    return Response.json({
      success: true,
      prediction: response
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});