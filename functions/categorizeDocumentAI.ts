import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    const { documentUrl, documentName } = await req.json();

    try {
        const user = await base44.auth.me();
        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        const response = await base44.integrations.Core.InvokeLLM({
            prompt: `Analysiere dieses Dokument und kategorisiere es automatisch.
Dateiname: ${documentName}

Mögliche Kategorien:
- LEASE_CONTRACT: Mietverträge
- OPERATING_COSTS: Betriebskostenabrechnungen
- INVOICE: Rechnungen
- REPAIR_REQUEST: Reparaturanfragen
- PAYMENT_CONFIRMATION: Zahlungsbestätigungen
- INSPECTION_REPORT: Inspektionsberichte
- HANDOVER_PROTOCOL: Übergabeprotokolle
- OTHER: Sonstiges

Antworte im JSON-Format:
{
  "category": "KATEGORIEN",
  "confidence": 0.95,
  "summary": "Kurze Zusammenfassung",
  "tags": ["tag1", "tag2"]
}`,
            file_urls: [documentUrl],
            response_json_schema: {
                type: 'object',
                properties: {
                    category: { type: 'string' },
                    confidence: { type: 'number' },
                    summary: { type: 'string' },
                    tags: { type: 'array', items: { type: 'string' } }
                }
            }
        });

        return new Response(JSON.stringify({
            success: true,
            classification: response
        }), { status: 200 });

    } catch (error) {
        console.error('Document categorization error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});