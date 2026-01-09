import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { file_url, document_context } = await req.json();
    // document_context: { scenario_type: 'ch_bitcoin_gmbh', country: 'CH', ... }

    // Enhanced recognition using LLM with user context
    const recognition = await base44.integrations.Core.InvokeLLM({
      prompt: `Erkenne und extrahiere relevante Steuerdaten aus Dokument für komplexes Szenario:

SCENARIO: ${document_context?.scenario_type}
LAND: ${document_context?.country}
ASSET TYPES: ${document_context?.asset_types?.join(', ')}

SPEZIFISCHE ERKENNUNGS-REGELN:
${document_context?.scenario_type === 'ch_bitcoin_gmbh' ? `
SUCHE nach:
1. Crypto Transactions (BTC/ETH with dates, amounts)
2. GmbH Beteiligung (Company name, ownership %, profits)
3. Gewinn/Verlust Distribution
4. Withholding Tax Documentation
5. Treaty Benefits Claims (if DE/CH)
` : `
SUCHE nach:
1. Income Components
2. Deductions
3. Asset Values
4. Transaction Details
`}

EXTRACT:
- Document Type (erkannt)
- Relevant Entities (Company names, asset types)
- Key Figures (amounts, dates)
- Tax-Relevant Information
- Data Quality Issues
- Confidence Level per Field

GEBE STRUCTURED JSON zurück`,
      file_urls: [file_url],
      response_json_schema: {
        type: "object",
        properties: {
          document_type: { type: "string" },
          scenario_match: { type: "string" },
          extracted_entities: {
            type: "array",
            items: {
              type: "object",
              properties: {
                entity_type: { type: "string" },
                name: { type: "string" },
                value: { type: "number" },
                confidence: { type: "number" }
              }
            }
          },
          tax_relevant_data: { type: "object" },
          data_quality_issues: { type: "array", items: { type: "string" } },
          suggested_entity_id: { type: "string" },
          ready_for_import: { type: "boolean" }
        }
      }
    });

    // Save extracted data
    const doc = await base44.entities.DocumentInbox.create({
      user_email: user.email,
      status: recognition.ready_for_import ? 'auto_matched' : 'pending',
      source_type: 'manual_upload',
      original_pdf_url: file_url,
      document_type: recognition.document_type,
      ai_extracted_data: recognition.extracted_entities,
      ai_extraction_confidence: recognition.scenario_match ? 95 : 70,
      matched_entity_id: recognition.suggested_entity_id,
      was_auto_matched: recognition.ready_for_import
    });

    return Response.json({
      user_email: user.email,
      document_id: doc.id,
      document_type: recognition.document_type,
      extracted_data: recognition.extracted_entities,
      ready_for_import: recognition.ready_for_import,
      confidence: recognition.ai_extraction_confidence
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});