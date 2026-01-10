import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { company_id, description, context } = await req.json();

    // Use AI to parse natural language into workflow steps
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Convert this workflow description into structured workflow steps.

Description: "${description}"

${context ? `Additional Context: ${context}` : ''}

Generate a detailed workflow with:
1. Clear step-by-step instructions
2. Integration actions if applicable
3. Conditions for routing
4. Approval steps where needed

Return as JSON with array of steps.`,
      response_json_schema: {
        type: 'object',
        properties: {
          workflow_name: { type: 'string' },
          workflow_description: { type: 'string' },
          steps: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                order: { type: 'number' },
                name: { type: 'string' },
                description: { type: 'string' },
                type: { type: 'string', enum: ['action', 'approval', 'condition', 'integration'] },
                action_type: { type: 'string' },
                parameters: { type: 'object' },
                condition: { type: 'object' },
                assignee: { type: 'string' }
              }
            }
          },
          integrations_needed: {
            type: 'array',
            items: { type: 'string' }
          }
        }
      }
    });

    // Generate unique step IDs
    const stepsWithIds = result.steps.map((step, idx) => ({
      ...step,
      id: `step_${idx + 1}`,
      order: idx + 1
    }));

    return Response.json({
      success: true,
      workflow: {
        name: result.workflow_name,
        description: result.workflow_description,
        steps: stepsWithIds,
        integrations_needed: result.integrations_needed,
        estimated_complexity: estimateComplexity(stepsWithIds)
      }
    });
  } catch (error) {
    console.error('Create workflow steps from NLP error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function estimateComplexity(steps) {
  const integrations = steps.filter(s => s.type === 'integration').length;
  const conditions = steps.filter(s => s.type === 'condition').length;
  const approvals = steps.filter(s => s.type === 'approval').length;

  let complexity = 'simple';
  const score = steps.length + (integrations * 2) + (conditions * 1.5) + (approvals * 1.5);

  if (score > 15) complexity = 'very_complex';
  else if (score > 10) complexity = 'complex';
  else if (score > 5) complexity = 'moderate';

  return { level: complexity, score: Math.round(score) };
}