import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    const { invoiceUrl } = await req.json();

    try {
        const user = await base44.auth.me();
        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        const response = await base44.integrations.Core.InvokeLLM({
            prompt: `Extrahiere alle relevanten Daten aus dieser Rechnung/Beleg:
- Anbieter/Lieferant
- Rechnungsnummer
- Rechnungsdatum
- Betrag
- Steuersatz
- Kategorie (Versicherung, Reparatur, Versorgung, Wartung, Sonstiges)
- Kurzbeschreibung

Antworte im JSON-Format:
{
  "vendor": "Name",
  "invoice_number": "Nr.",
  "invoice_date": "YYYY-MM-DD",
  "amount": 0.00,
  "tax_rate": 0.0,
  "currency": "EUR",
  "category": "VERSICHERUNG|REPARATUR|VERSORGUNG|WARTUNG|SONSTIGE",
  "description": "Beschreibung",
  "confidence": 0.95
}`,
            file_urls: [invoiceUrl],
            response_json_schema: {
                type: 'object',
                properties: {
                    vendor: { type: 'string' },
                    invoice_number: { type: 'string' },
                    invoice_date: { type: 'string' },
                    amount: { type: 'number' },
                    tax_rate: { type: 'number' },
                    currency: { type: 'string' },
                    category: { type: 'string' },
                    description: { type: 'string' },
                    confidence: { type: 'number' }
                }
            }
        });

        return new Response(JSON.stringify({
            success: true,
            invoice_data: response
        }), { status: 200 });

    } catch (error) {
        console.error('Invoice extraction error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});