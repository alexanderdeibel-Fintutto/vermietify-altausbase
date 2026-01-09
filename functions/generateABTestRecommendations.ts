import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { insights, user_segments } = body;

    console.log('Generating A/B test recommendations');

    const recommendations = [];

    // Get highest priority insights
    const priorityInsights = insights
      ?.filter(i => i.priority === 'critical' || i.priority === 'high')
      .slice(0, 3) || [];

    for (const insight of priorityInsights) {
      try {
        const response = await base44.integrations.Core.InvokeLLM({
          prompt: `Basierend auf diesem UX-Insight, generiere einen konkreten A/B-Test:

Insight-Titel: ${insight.title}
Problem: ${insight.ai_analysis}
Empfehlung: ${insight.recommendation}
Betroffene Metriken: ${JSON.stringify(insight.affected_metrics)}

Generiere einen A/B-Test mit folgendem Format:
{
  "test_name": "Name des A/B-Tests",
  "hypothesis": "Die Hypothese (was will man beweisen?)",
  "control_variant": "Die aktuelle Lösung",
  "test_variant": "Die neue Lösung zum Testen",
  "success_metrics": ["Metrik 1", "Metrik 2"],
  "sample_size": "Wie viele Nutzer braucht man?",
  "duration_days": "Wie lange sollte der Test laufen?",
  "expected_lift": "Erwartete Verbesserung in %"
}`,
          response_json_schema: {
            type: "object",
            properties: {
              test_name: { type: "string" },
              hypothesis: { type: "string" },
              control_variant: { type: "string" },
              test_variant: { type: "string" },
              success_metrics: { type: "array", items: { type: "string" } },
              sample_size: { type: "string" },
              duration_days: { type: "number" },
              expected_lift: { type: "number" }
            }
          }
        });

        recommendations.push({
          insight_id: insight.id,
          ab_test: response.data,
          created_at: new Date().toISOString()
        });

        console.log('Created A/B test recommendation:', response.data.test_name);
      } catch (err) {
        console.warn('Error generating A/B test:', err.message);
      }
    }

    return Response.json({
      success: true,
      ab_test_recommendations: recommendations.length,
      recommendations: recommendations
    });
  } catch (error) {
    console.error('A/B test recommendation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});