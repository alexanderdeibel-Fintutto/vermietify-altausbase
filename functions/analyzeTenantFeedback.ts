import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch recent tenant messages and communications
    const messages = await base44.asServiceRole.entities.TenantMessage.filter(
      {},
      '-created_date',
      50
    );

    const communications = await base44.asServiceRole.entities.TenantCommunication.filter(
      { communication_type: 'individual_message' },
      '-created_date',
      30
    );

    const feedbackText = [...messages, ...communications]
      .map(item => item.content || item.message || '')
      .filter(text => text.length > 0)
      .join('\n\n');

    if (!feedbackText) {
      return Response.json({
        summary: 'Keine Tenant-Feedback-Daten verfügbar.',
        themes: [],
        recommendations: [],
      });
    }

    const prompt = `Analysiere das folgende Tenant-Feedback und identifiziere:
1. Hauptthemen und Beschwerdepunkte
2. Positive Erkenntnisse
3. Dringende Probleme
4. Verbesserungsvorschläge

Feedback:
${feedbackText}

Gib eine strukturierte Analyse im JSON-Format aus:
{
  "summary": "Kurze Zusammenfassung",
  "main_themes": ["Thema 1", "Thema 2", ...],
  "concerns": ["Besorgnis 1", "Besorgnis 2", ...],
  "positives": ["Positiv 1", "Positiv 2", ...],
  "urgent_issues": ["Problem 1", "Problem 2", ...],
  "recommendations": ["Empfehlung 1", "Empfehlung 2", ...]
}`;

    const analysisResponse = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          summary: { type: 'string' },
          main_themes: { type: 'array', items: { type: 'string' } },
          concerns: { type: 'array', items: { type: 'string' } },
          positives: { type: 'array', items: { type: 'string' } },
          urgent_issues: { type: 'array', items: { type: 'string' } },
          recommendations: { type: 'array', items: { type: 'string' } },
        },
      },
    });

    // Store analysis
    await base44.asServiceRole.entities.AIInsight.create({
      insight_type: 'sentiment_analysis',
      title: 'Tenant Feedback Analysis',
      description: analysisResponse.summary,
      ai_analysis: JSON.stringify(analysisResponse),
      confidence_score: 85,
      priority: analysisResponse.urgent_issues?.length > 0 ? 'high' : 'medium',
      generated_at: new Date().toISOString(),
    });

    return Response.json(analysisResponse);
  } catch (error) {
    console.error('Feedback analysis error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});