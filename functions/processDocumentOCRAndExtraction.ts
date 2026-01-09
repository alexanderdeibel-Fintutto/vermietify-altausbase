import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { file_url, document_type = 'auto' } = await req.json();

    // Auto-extract tax data from documents (Invoices, Statements, etc.)
    const extraction = await base44.integrations.Core.InvokeLLM({
      prompt: `Extrahiere Tax-relevante Daten aus Dokument:
      
DOKUMENTTYP: ${document_type}

EXTRAHIERE:
1. Parties (Payer, Recipient)
2. Amounts (Gross, Tax, Net)
3. Dates (Transaction, Due, Period)
4. Categories (Income Type, Expense Type)
5. Reference Numbers (Invoice#, Transaction ID)
6. Tax Info (VAT/GST, Withholding Tax)

STRUKTURIERE ALS JSON:
- Typ identifizieren
- Validierung durchführen
- Confidence Score pro Feld
- Suggestion für Tax Treatment`,
      file_urls: [file_url],
      response_json_schema: {
        type: "object",
        properties: {
          document_type: { type: "string" },
          detected_type_confidence: { type: "number" },
          extracted_data: {
            type: "object",
            properties: {
              parties: { type: "object" },
              amounts: { type: "object" },
              dates: { type: "object" },
              tax_info: { type: "object" }
            }
          },
          tax_category_suggestion: { type: "string" },
          confidence_by_field: { type: "object" },
          requires_manual_review: { type: "boolean" }
        }
      }
    });

    // Speichern für späteren Matching
    const doc = await base44.entities.TaxDocument.create({
      user_email: user.email,
      country: 'auto', // Will be detected
      tax_year: new Date().getFullYear(),
      document_type: extraction.document_type,
      file_url,
      file_name: `extracted_${Date.now()}`,
      extracted_data: extraction.extracted_data,
      status: extraction.requires_manual_review ? 'pending' : 'processed'
    });

    return Response.json({
      user_email: user.email,
      document_id: doc.id,
      extraction
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});