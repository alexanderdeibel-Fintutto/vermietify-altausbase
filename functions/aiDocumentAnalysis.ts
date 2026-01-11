import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, document_url, search_query, document_id } = await req.json();
    
    if (action === 'categorize_and_extract') {
      const prompt = `Analysiere dieses Dokument und extrahiere wichtige Informationen:

Dokument URL: ${document_url}

Aufgaben:
1. Kategorisiere das Dokument (lease_contract, invoice, inspection_report, maintenance_request, insurance_document, tax_document, other)
2. Extrahiere relevante Daten:
   - Datum/Daten
   - Beträge/Kosten
   - Namen (Personen/Firmen)
   - Adressen
   - Vertragslaufzeiten
   - Wichtige Fristen

Antworte mit JSON:
{
  "category": "...",
  "confidence": 0-100,
  "extracted_data": {
    "dates": ["..."],
    "amounts": ["..."],
    "names": ["..."],
    "addresses": ["..."],
    "key_terms": ["..."],
    "deadlines": ["..."]
  },
  "summary": "..."
}`;

      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt,
        file_urls: [document_url],
        response_json_schema: {
          type: "object",
          properties: {
            category: { type: "string" },
            confidence: { type: "number" },
            extracted_data: {
              type: "object",
              properties: {
                dates: { type: "array", items: { type: "string" } },
                amounts: { type: "array", items: { type: "string" } },
                names: { type: "array", items: { type: "string" } },
                addresses: { type: "array", items: { type: "string" } },
                key_terms: { type: "array", items: { type: "string" } },
                deadlines: { type: "array", items: { type: "string" } }
              }
            },
            summary: { type: "string" }
          }
        }
      });
      
      return Response.json({ analysis });
    }
    
    if (action === 'search_in_documents') {
      const documents = await base44.entities.Document.list('-created_date', 50);
      
      const prompt = `Suche in den folgenden Dokumenten nach: "${search_query}"

Dokumente:
${documents.map(d => `- ${d.name} (${d.document_type})`).join('\n')}

Finde relevante Dokumente basierend auf:
- Inhaltliche Übereinstimmung
- Dokumenttyp
- Metadaten

Antworte mit JSON:
{
  "results": [
    {
      "document_name": "...",
      "relevance_score": 0-100,
      "matching_content": "...",
      "reason": "..."
    }
  ]
}`;

      const searchResults = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            results: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  document_name: { type: "string" },
                  relevance_score: { type: "number" },
                  matching_content: { type: "string" },
                  reason: { type: "string" }
                }
              }
            }
          }
        }
      });
      
      return Response.json({ search_results: searchResults });
    }
    
    if (action === 'extract_field_values') {
      const document = await base44.entities.Document.read(document_id);
      
      const prompt = `Extrahiere spezifische Feldwerte aus diesem Dokument:

Dokument: ${document.name}
Typ: ${document.document_type}

Zu extrahieren:
- Vertragsnummer
- Start- und Enddatum
- Monatlicher Betrag
- Kaution
- Parteien (Vermieter/Mieter oder Auftragnehmer)
- Zahlungsbedingungen

Gib NUR die gefundenen Werte zurück, keine Erklärungen.

Antworte mit JSON:
{
  "contract_number": "...",
  "start_date": "...",
  "end_date": "...",
  "monthly_amount": "...",
  "deposit": "...",
  "parties": {
    "landlord": "...",
    "tenant": "..."
  },
  "payment_terms": "..."
}`;

      const extracted = await base44.integrations.Core.InvokeLLM({
        prompt,
        file_urls: document.file_url ? [document.file_url] : [],
        response_json_schema: {
          type: "object",
          properties: {
            contract_number: { type: "string" },
            start_date: { type: "string" },
            end_date: { type: "string" },
            monthly_amount: { type: "string" },
            deposit: { type: "string" },
            parties: {
              type: "object",
              properties: {
                landlord: { type: "string" },
                tenant: { type: "string" }
              }
            },
            payment_terms: { type: "string" }
          }
        }
      });
      
      return Response.json({ extracted_fields: extracted });
    }
    
    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});