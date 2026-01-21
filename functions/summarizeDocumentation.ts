import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();
    
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { markdownContent, maxLength = 500 } = await req.json();

    if (!markdownContent) {
      return Response.json({ error: 'markdownContent is required' }, { status: 400 });
    }

    const wordCount = markdownContent.split(/\s+/).length;
    
    // Nur zusammenfassen wenn Dokument länger als 300 Wörter ist
    if (wordCount < 300) {
      return Response.json({ 
        success: true,
        summary: "Dokumentation ist kurz genug, keine Zusammenfassung erforderlich.",
        executive_summary: markdownContent.substring(0, 500) + "...",
        word_count: wordCount,
        needs_summary: false
      });
    }

    const summaryPrompt = `Erstelle eine prägnante Zusammenfassung folgender technischer Dokumentation.

DOKUMENTATION:
${markdownContent}

AUFGABE:
1. **Executive Summary** (max. ${maxLength} Zeichen): Kompakte Zusammenfassung der wichtigsten Punkte
2. **Kernaussagen** (3-5 Bullet Points): Die wesentlichen Informationen
3. **Handlungsempfehlungen** (2-3 Punkte): Was sollte man mit diesen Informationen tun

Die Zusammenfassung soll für Entwickler und technische Entscheidungsträger verständlich sein.`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: summaryPrompt,
      response_json_schema: {
        type: "object",
        properties: {
          executive_summary: {
            type: "string",
            description: "Kurze Zusammenfassung der Dokumentation"
          },
          key_points: {
            type: "array",
            items: { type: "string" },
            description: "3-5 wichtigste Punkte"
          },
          action_items: {
            type: "array",
            items: { type: "string" },
            description: "2-3 Handlungsempfehlungen"
          },
          complexity_rating: {
            type: "string",
            enum: ["LOW", "MEDIUM", "HIGH"],
            description: "Komplexitätsbewertung"
          }
        }
      }
    });

    return Response.json({ 
      success: true,
      summary: response.output.executive_summary,
      key_points: response.output.key_points,
      action_items: response.output.action_items,
      complexity_rating: response.output.complexity_rating,
      word_count: wordCount,
      needs_summary: true,
      compression_ratio: (response.output.executive_summary.length / markdownContent.length * 100).toFixed(1)
    });

  } catch (error) {
    console.error('Summary Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});