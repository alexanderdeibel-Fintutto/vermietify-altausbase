import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversation_history } = await req.json();
    const conversationText = conversation_history.map(m => m.message).join(' ');

    // AI detects scenario type from conversation
    const detection = await base44.integrations.Core.InvokeLLM({
      prompt: `Analysiere die Konversation und erkenne den Tax Scenario des Users:

KONVERSATION:
${conversationText}

ERKENNE:
1. Scenario Type: simple_employee, freelancer_ch, crypto_trader, ch_bitcoin_gmbh, multi_country_business, etc.
2. Complexity Level: simple, intermediate, complex, enterprise
3. Primary Country: AT, CH, DE
4. Secondary Countries: Array
5. Special Characteristics: [has_crypto, has_gmbh, has_ag, cross_border_income, etc.]
6. Estimated Duration in minutes

FOKUS auf:
- Swiss person + Bitcoin Holdings + GmbH anteile? → ch_bitcoin_gmbh
- Multi-country business? → multi_country_business
- Einfacher Angestellter? → simple_employee
- Freelancer CH? → freelancer_ch

GEBE strukturiertes Resultat zurück.`,
      response_json_schema: {
        type: "object",
        properties: {
          scenario_type: { type: "string" },
          complexity_level: { type: "string" },
          primary_country: { type: "string" },
          secondary_countries: { type: "array", items: { type: "string" } },
          special_characteristics: { type: "array", items: { type: "string" } },
          estimated_duration_minutes: { type: "number" },
          confidence: { type: "number" },
          required_fields: { type: "array", items: { type: "string" } }
        }
      }
    });

    // Erstelle oder update OnboardingScenario
    const scenarios = await base44.entities.OnboardingScenario.filter(
      { user_email: user.email },
      '-updated_date',
      1
    );

    let scenario;
    if (scenarios.length > 0) {
      scenario = await base44.entities.OnboardingScenario.update(scenarios[0].id, {
        ...detection,
        status: 'active'
      });
    } else {
      scenario = await base44.entities.OnboardingScenario.create({
        user_email: user.email,
        ...detection,
        status: 'active'
      });
    }

    // Generiere Workflow Steps für dieses Szenario
    const workflowSteps = await base44.integrations.Core.InvokeLLM({
      prompt: `Generiere geführte Onboarding Steps für Scenario: ${detection.scenario_type}
      
Komplexität: ${detection.complexity_level}
Länder: ${detection.primary_country}${detection.secondary_countries?.length ? ', ' + detection.secondary_countries.join(', ') : ''}
Special: ${detection.special_characteristics?.join(', ')}

GEBE Array von Steps zurück mit: step_number, step_name, description, required, component_type

Steps sollten:
1. Country setup (wenn multi-country)
2. Income sources
3. Assets (crypto, GmbH anteile, real estate)
4. Bank connections (FinAPI setup)
5. Calculations
6. Review & Submission

Für CH+Bitcoin+GmbH: Crypto Form → GmbH Form → Bank Integration
Für Multi-Country: Country Priority → Income Distribution → Treaty Optimization`,
      response_json_schema: {
        type: "object",
        properties: {
          workflow_steps: {
            type: "array",
            items: {
              type: "object",
              properties: {
                step_number: { type: "number" },
                step_name: { type: "string" },
                description: { type: "string" },
                required: { type: "boolean" },
                component_type: { type: "string" }
              }
            }
          }
        }
      }
    });

    // Update scenario mit workflow
    scenario = await base44.entities.OnboardingScenario.update(scenario.id, {
      workflow_steps: workflowSteps.workflow_steps
    });

    return Response.json({
      user_email: user.email,
      scenario: scenario,
      next_step: workflowSteps.workflow_steps?.[0]?.step_name
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});