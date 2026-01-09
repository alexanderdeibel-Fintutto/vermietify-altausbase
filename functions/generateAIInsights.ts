import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { patterns, analytics_data } = body;

    console.log('Generating AI insights from', patterns?.length || 0, 'patterns');

    const insights = [];

    // Generate insights for each pattern using LLM
    if (patterns && patterns.length > 0) {
      for (const pattern of patterns.slice(0, 5)) {
        try {
          const response = await base44.integrations.Core.InvokeLLM({
            prompt: `Analysiere folgendes UX-Pattern und gib konkrete, actionable Verbesserungsvorschläge:

Pattern-Typ: ${pattern.pattern_type}
Name: ${pattern.pattern_name}
Betroffene Seiten: ${pattern.affected_pages?.join(', ')}
Häufigkeit: ${pattern.frequency} User (${pattern.frequency_percentage}%)
Impact-Score: ${pattern.impact_score}/100
Sentiment: ${pattern.sentiment_analysis?.sentiment}

Gib folgendes Format zurück:
{
  "title": "Kurzer Titel",
  "summary": "Eine Zusammenfassung in 1-2 Sätzen",
  "root_cause": "Warum tritt dieses Pattern auf?",
  "recommendations": ["Empfehlung 1", "Empfehlung 2", "Empfehlung 3"],
  "expected_improvement": "Welche Verbesserung kann man erwarten?",
  "priority": "critical|high|medium|low"
}`,
            response_json_schema: {
              type: "object",
              properties: {
                title: { type: "string" },
                summary: { type: "string" },
                root_cause: { type: "string" },
                recommendations: { type: "array", items: { type: "string" } },
                expected_improvement: { type: "string" },
                priority: { type: "string" }
              }
            }
          });

          const analysis = response.data;

          const insight = await base44.asServiceRole.entities.AIInsight.create({
            insight_type: pattern.pattern_type === 'dropout_pattern' ? 'pattern_analysis' : 'pattern_analysis',
            title: analysis.title,
            description: analysis.summary,
            data_source: { pattern_id: pattern.id, pattern_type: pattern.pattern_type },
            ai_analysis: analysis.root_cause,
            confidence_score: 82,
            affected_metrics: {
              affected_pages: pattern.affected_pages,
              user_count: pattern.user_count
            },
            recommendation: analysis.recommendations[0],
            expected_impact: {
              metric: 'completion_rate',
              current_value: 65,
              predicted_value: 78,
              improvement_percentage: 13
            },
            actionable: true,
            priority: analysis.priority || 'high',
            generated_at: new Date().toISOString()
          });

          insights.push(insight);
          console.log('Created insight:', insight.id);
        } catch (err) {
          console.warn('Error generating insight:', err.message);
        }
      }
    }

    // Generate high-level insights from analytics
    if (analytics_data) {
      const analyticsInsight = await base44.asServiceRole.entities.AIInsight.create({
        insight_type: 'pattern_analysis',
        title: '📊 Überblick: Test-Kampagne Performance',
        description: `Completion-Rate: ${analytics_data.completion_rate}%, Probleme: ${analytics_data.problems_reported}, Aktive Sessions: ${analytics_data.active_sessions}`,
        data_source: analytics_data,
        ai_analysis: `Die Kampagne zeigt ${analytics_data.completion_rate > 70 ? 'starke' : analytics_data.completion_rate > 50 ? 'moderate' : 'schwache'} Performance. ${analytics_data.problems_reported > 20 ? 'Hohe Problem-Quote deutet auf UX-Herausforderungen hin.' : 'Problem-Rate ist kontrollierbar.'}`,
        confidence_score: 90,
        affected_metrics: {
          completion_rate: analytics_data.completion_rate,
          problem_count: analytics_data.problems_reported,
          active_sessions: analytics_data.active_sessions
        },
        recommendation: analytics_data.completion_rate < 70 ? 'Seiten mit Absprüngen überprüfen' : 'Aktuelle UX beibehalten',
        actionable: true,
        priority: analytics_data.completion_rate < 50 ? 'critical' : 'medium',
        generated_at: new Date().toISOString()
      });

      insights.push(analyticsInsight);
    }

    console.log('Total insights generated:', insights.length);

    return Response.json({
      success: true,
      insights_generated: insights.length,
      insights: insights
    });
  } catch (error) {
    console.error('Insight generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});