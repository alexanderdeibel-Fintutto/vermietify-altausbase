import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Generates AI-driven explanations for why users dismiss/postpone onboarding steps
 * Provides personalized reasons and suggestions based on user actions & data
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { step_id, step_title, user_data } = body;

    console.log(`Generating dismissal explanation for step: ${step_id}`);

    // Get AI-driven personalized explanation
    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `Ein Nutzer hat gerade den Onboarding-Schritt "${step_title}" übersprungen/aufgeschoben.

USER DATA:
- Gebäude: ${user_data?.buildings_added || 0}
- Bankkonten: ${user_data?.accounts_connected || 0}
- Verträge: ${user_data?.contracts_created || 0}
- Mieter: ${user_data?.tenants_managed || 0}
- Rechnungen: ${user_data?.invoices_created || 0}
- Erfahrungslevel: ${user_data?.user_level || 'beginner'}

STEP: ${step_title} (ID: ${step_id})

Generiere eine kurze, empathische und hilfreiche Erklärung für die Verzögerung:
1. Erkenne, warum der Nutzer diesen Schritt möglicherweise nicht sofort durchführt (basierend auf seinen Daten)
2. Gebe einen hilfreichen Hinweis, wann der Schritt später sinnvoll ist
3. Schlag einen nächsten Schritt vor

Antworte als JSON:`,
      response_json_schema: {
        type: "object",
        properties: {
          dismissal_reason: {
            type: "string",
            description: "Warum der Nutzer diesen Schritt übersprungen hat"
          },
          contextual_explanation: {
            type: "string",
            description: "Personalisierte Erklärung basierend auf Nutzer-Daten"
          },
          suggested_timing: {
            type: "string",
            description: "Wann dieser Schritt sinnvoll wäre"
          },
          next_action: {
            type: "string",
            description: "Nächster sinnvoller Schritt"
          },
          encouragement: {
            type: "string",
            description: "Motivierendes Feedback"
          }
        }
      }
    });

    const explanation = response.data || response;

    return Response.json({
      success: true,
      step_id,
      explanation: {
        reason: explanation.dismissal_reason,
        context: explanation.contextual_explanation,
        timing: explanation.suggested_timing,
        next_action: explanation.next_action,
        encouragement: explanation.encouragement,
        generated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Dismissal explanation generation failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});