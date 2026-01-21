import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();
    
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { markdownContent, documentationType } = await req.json();

    if (!markdownContent) {
      return Response.json({ error: 'markdownContent is required' }, { status: 400 });
    }

    // KI-Analyse für Insights und Anomalien
    const analysisPrompt = `Analysiere folgende technische Dokumentation und finde wichtige Einblicke und potenzielle Probleme:

${markdownContent}

Liefere eine strukturierte Analyse mit:
1. **Wichtigste Erkenntnisse** (3-5 Punkte): Die bedeutendsten Informationen
2. **Potenzielle Probleme** (2-4 Punkte): Anomalien, Inkonsistenzen, fehlende Informationen
3. **Optimierungsvorschläge** (2-3 Punkte): Konkrete Verbesserungen
4. **Risiko-Level**: LOW, MEDIUM oder HIGH basierend auf gefundenen Problemen

Format als JSON.`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: analysisPrompt,
      response_json_schema: {
        type: "object",
        properties: {
          key_insights: {
            type: "array",
            items: { type: "string" }
          },
          potential_issues: {
            type: "array",
            items: {
              type: "object",
              properties: {
                issue: { type: "string" },
                severity: { type: "string", enum: ["LOW", "MEDIUM", "HIGH"] },
                recommendation: { type: "string" }
              }
            }
          },
          optimization_suggestions: {
            type: "array",
            items: { type: "string" }
          },
          risk_level: {
            type: "string",
            enum: ["LOW", "MEDIUM", "HIGH"]
          },
          confidence_score: {
            type: "number"
          }
        }
      }
    });

    return Response.json({ 
      success: true,
      insights: response.output
    });

  } catch (error) {
    console.error('AI Analysis Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});