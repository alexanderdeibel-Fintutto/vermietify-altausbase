import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { document_url, submission_id } = await req.json();

    if (!document_url) {
      return Response.json({ error: 'document_url required' }, { status: 400 });
    }

    console.log(`[DOC-CLASSIFY] Analyzing document for ${submission_id || 'standalone'}`);

    // Nutze KI zur Klassifizierung
    const prompt = `
Analysiere dieses Steuerdokument und extrahiere:
1. Dokumenttyp (z.B. Mietvertrag, Rechnung, Grundsteuerbescheid)
2. Relevante Beträge und deren Kategorie
3. Datum
4. Zuordnung zu ELSTER-Feldern (z.B. Anlage V Zeile 15)

Gib das Ergebnis als JSON zurück mit:
{
  "document_type": "...",
  "amounts": [{"value": 123.45, "category": "grundsteuer", "elster_field": "anlage_v_zeile_15"}],
  "date": "YYYY-MM-DD",
  "confidence": 0-100
}
`;

    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt,
      file_urls: [document_url],
      response_json_schema: {
        type: 'object',
        properties: {
          document_type: { type: 'string' },
          amounts: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                value: { type: 'number' },
                category: { type: 'string' },
                elster_field: { type: 'string' }
              }
            }
          },
          date: { type: 'string' },
          confidence: { type: 'number' }
        }
      }
    });

    console.log(`[DOC-CLASSIFY] Classified as ${analysis.document_type}`);

    return Response.json({
      success: true,
      classification: analysis
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});