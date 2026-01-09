import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { finapi_user_id } = await req.json();

    // Note: FinAPI doesn't directly expose GmbH data
    // This function would integrate with company registries or allow manual entry
    // For now, use LLM to classify and suggest entities

    const classification = await base44.integrations.Core.InvokeLLM({
      prompt: `Basierend auf FinAPI Kontodaten für User ${user.email}:

Erkenne potentielle Business Entity Struktur:
1. Separate Firmen-Konten (Business Account Indicator)
2. Kapitalgesellschaften vs. Einzelunternehmen
3. Multi-Country Presence

GEBE Klassifikation für GmbH, AG, Partnership, Sole Trader, etc.

Dies hilft später für:
- Transfer Pricing Analyse
- Permanent Establishment Check
- Grenzüberschreitende Betriebsstätten`,
      response_json_schema: {
        type: "object",
        properties: {
          detected_entities: {
            type: "array",
            items: {
              type: "object",
              properties: {
                entity_type: { type: "string" },
                likely_country: { type: "string" },
                confidence: { type: "number" }
              }
            }
          },
          recommended_actions: { type: "array", items: { type: "string" } }
        }
      }
    });

    // Log the detection for manual review
    await base44.asServiceRole.entities.FinAPISync.create({
      user_email: user.email,
      finapi_user_id,
      sync_status: 'entity_detection_pending',
      metadata: JSON.stringify(classification),
      last_sync: new Date().toISOString()
    });

    return Response.json({
      user_email: user.email,
      detected_entities: classification.detected_entities,
      status: 'pending_review'
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});