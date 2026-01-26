import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { document_id, file_url, content } = await req.json();

    // Generate AI analysis
    const prompt = `Analysiere das folgende Dokument und liefere:
1. Bis zu 5 relevante Schlagwörter/Tags (kommasepariert)
2. Eine passende Kategorie aus: Mietrecht, Verwaltung, Finanzen, Sonstiges
3. Eine kurze Zusammenfassung (max. 200 Zeichen)

Kontext: ${content || 'Dokument-URL: ' + file_url}

Antworte im JSON-Format:
{
  "tags": ["tag1", "tag2", "tag3"],
  "category": "Kategorie",
  "summary": "Zusammenfassung"
}`;

    const aiResult = await base44.integrations.Core.InvokeLLM({
      prompt: prompt,
      response_json_schema: {
        type: "object",
        properties: {
          tags: {
            type: "array",
            items: { type: "string" }
          },
          category: { type: "string" },
          summary: { type: "string" }
        }
      }
    });

    // Update document with AI analysis
    if (document_id) {
      await base44.asServiceRole.entities.Document.update(document_id, {
        ai_tags: aiResult.tags || [],
        ai_category: aiResult.category,
        ai_summary: aiResult.summary,
        ai_processed: true
      });
    }

    return Response.json({
      success: true,
      analysis: aiResult
    });

  } catch (error) {
    console.error('Document analysis error:', error);
    return Response.json({ 
      error: error.message,
      success: false
    }, { status: 500 });
  }
});