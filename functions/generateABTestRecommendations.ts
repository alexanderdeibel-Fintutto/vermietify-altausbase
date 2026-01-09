import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { insights, patterns = [], user_segments = [] } = body;

    console.log('Generating AI-driven A/B test recommendations');

    const recommendations = [];

    // Get highest priority insights
    const priorityInsights = insights
      ?.filter(i => i.priority === 'critical' || i.priority === 'high')
      .slice(0, 5) || [];

    // Analyze patterns for behavioral context
    const patternContext = patterns
      ?.slice(0, 3)
      .map(p => `${p.pattern_name}: ${p.description}`)
      .join('\n') || '';

    for (const insight of priorityInsights) {
      try {
        // AI-generated comprehensive A/B test with metrics and expected outcomes
        const response = await base44.integrations.Core.InvokeLLM({
          prompt: `Du bist ein UX/Growth-Expert. Analysiere diesen Insight und generiere einen datengesteuerten A/B-Test mit konkreten Metriken und Erfolgskriterien.

INSIGHT DETAILS:
- Titel: ${insight.title}
- Beschreibung: ${insight.description}
- Root Cause: ${insight.ai_analysis}
- Empfehlung: ${insight.recommendation}
- Betroffene Metriken: ${JSON.stringify(insight.affected_metrics)}
- Konfidenz-Score: ${insight.confidence_score || 80}%

BEHAVIORAL PATTERNS (KONTEXT):
${patternContext || 'Allgemeine UX-Verbesserung'}

EXPECTED IMPACT:
${insight.expected_impact ? `Aktueller Wert: ${insight.expected_impact.current_value}, Prognostizierter Wert: ${insight.expected_impact.predicted_value}, Verbesserung: ${insight.expected_impact.improvement_percentage}%` : 'Unbekannt'}

Generiere einen A/B-Test der die Hypothese validiert. Beachte:
1. Specifique, messbare Erfolgskriterien
2. Realistische Sample-Größe basierend auf erwarteter Effekt
3. Angemessene Test-Dauer
4. Sekundäre Metriken zur Anomalieerkennung

Antwort als JSON:`,
          response_json_schema: {
            type: "object",
            properties: {
              test_name: { 
                type: "string",
                description: "Prägnanter Name des A/B-Tests"
              },
              hypothesis: { 
                type: "string",
                description: "Testbare Hypothese (If-Then Format)"
              },
              control_variant: { 
                type: "string",
                description: "Aktuelle Kontrolllösung"
              },
              test_variant: { 
                type: "string",
                description: "Neue Testwariante"
              },
              success_metrics: { 
                type: "array",
                items: { type: "string" },
                description: "Primäre Erfolgskriterien (max 3)"
              },
              secondary_metrics: {
                type: "array",
                items: { type: "string" },
                description: "Sekundäre Metriken zur Anomalieerkennung"
              },
              sample_size: { 
                type: "number",
                description: "Empfohlene Anzahl Users pro Variante"
              },
              duration_days: { 
                type: "number",
                description: "Empfohlene Test-Dauer in Tagen (min 7)"
              },
              expected_lift: { 
                type: "number",
                description: "Erwartete Verbesserung in %"
              },
              confidence_level: {
                type: "number",
                description: "Statistische Power/Konfidenz (80-95%)"
              },
              statistical_significance: {
                type: "string",
                description: "Erforderliches Signifikanzniveau (z.B. p < 0.05)"
              },
              implementation_notes: {
                type: "string",
                description: "Kurze Implementierungshinweise"
              }
            },
            required: ["test_name", "hypothesis", "success_metrics", "sample_size", "duration_days", "expected_lift"]
          }
        });

        const testData = response.data || response;

        // Create actionable test recommendation
        const recommendation = {
          test_id: `ab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          insight_id: insight.id,
          insight_title: insight.title,
          status: 'draft',
          ab_test: {
            test_name: testData.test_name,
            hypothesis: testData.hypothesis,
            control_variant: testData.control_variant,
            test_variant: testData.test_variant,
            success_metrics: testData.success_metrics,
            secondary_metrics: testData.secondary_metrics || [],
            sample_size: testData.sample_size,
            duration_days: Math.max(7, testData.duration_days),
            expected_lift: testData.expected_lift,
            confidence_level: testData.confidence_level || 80,
            statistical_significance: testData.statistical_significance || 'p < 0.05',
            implementation_notes: testData.implementation_notes
          },
          power_analysis: {
            required_sample_size: testData.sample_size,
            minimum_detectable_effect: testData.expected_lift * 0.5,
            confidence_level: testData.confidence_level || 80,
            power: 80
          },
          expected_outcomes: {
            optimistic_scenario: {
              lift: testData.expected_lift,
              description: `Erreicht ${testData.expected_lift}% Verbesserung`
            },
            conservative_scenario: {
              lift: Math.max(0, testData.expected_lift * 0.5),
              description: `Erreicht ${Math.max(0, testData.expected_lift * 0.5)}% Verbesserung`
            },
            worst_case: {
              lift: 0,
              description: "Keine signifikante Veränderung"
            }
          },
          created_at: new Date().toISOString(),
          priority: insight.priority
        };

        recommendations.push(recommendation);

        console.log(`✓ Generated A/B test: ${testData.test_name}`);
        console.log(`  Sample size: ${testData.sample_size}, Duration: ${testData.duration_days} days, Expected lift: ${testData.expected_lift}%`);
      } catch (err) {
        console.warn('Error generating A/B test for insight:', insight.title, err.message);
      }
    }

    return Response.json({
      success: true,
      ab_test_recommendations: recommendations.length,
      recommendations: recommendations.sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3);
      })
    });
  } catch (error) {
    console.error('A/B test recommendation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});