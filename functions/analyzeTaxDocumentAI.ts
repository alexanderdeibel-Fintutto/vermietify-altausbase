import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Analyze uploaded tax documents (receipts, invoices, etc.) for deductions/credits
 */
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { file_url, document_type, country } = await req.json();

        if (!file_url) {
            return Response.json({ error: 'file_url required' }, { status: 400 });
        }

        // Analyze document with vision + tax knowledge
        const analysis = await base44.integrations.Core.InvokeLLM({
            prompt: `Du bist ein Steuerexperte. Analysiere dieses Dokument für steuerliche Relevanz.

DOKUMENT-TYP: ${document_type || 'Unbekannt'}
LAND: ${country || 'DE'}

ANALYSIERE:
1. Art des Dokuments
2. Mögliche steuerliche Kategorien
3. Empfohlene Abzugsarten
4. Wichtige Details (Datum, Betrag, Anbieter)
5. Fehlende kritische Informationen

GEBE STRUKTURIERTE JSON ANTWORT:
{
  "document_type": "...",
  "identified_amount": 0,
  "currency": "EUR",
  "deduction_categories": ["..."],
  "tax_credits_eligible": ["..."],
  "confidence_score": 0.95,
  "recommendations": "...",
  "warnings": "..."
}`,
            file_urls: [file_url],
            response_json_schema: {
                type: 'object',
                properties: {
                    document_type: { type: 'string' },
                    identified_amount: { type: 'number' },
                    currency: { type: 'string' },
                    deduction_categories: { type: 'array', items: { type: 'string' } },
                    tax_credits_eligible: { type: 'array', items: { type: 'string' } },
                    confidence_score: { type: 'number' },
                    recommendations: { type: 'string' },
                    warnings: { type: 'string' }
                }
            }
        });

        return Response.json({
            success: true,
            analysis
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});