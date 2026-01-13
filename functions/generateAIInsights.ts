import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { entityType } = await req.json();

    // Fetch data
    const entities = await base44.entities[entityType]?.list?.('-updated_date', 100) || [];

    // AI Analysis via LLM
    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze this ${entityType} data and provide insights:
${JSON.stringify(entities.slice(0, 20), null, 2)}

Provide:
1. Key insights (3-4 items with title, description, recommendation)
2. Anomalies detected (unusual patterns)
3. Predictions (next 3 months trends)

Format as JSON with keyInsights, anomalies, predictions arrays.`,
      response_json_schema: {
        type: 'object',
        properties: {
          keyInsights: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                recommendation: { type: 'string' }
              }
            }
          },
          anomalies: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string' },
                description: { type: 'string' }
              }
            }
          },
          predictions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                metric: { type: 'string' },
                value: { type: 'string' },
                trend: { type: 'string' }
              }
            }
          }
        }
      }
    });

    return Response.json({
      data: response
    });

  } catch (error) {
    console.error('AI Insights error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});