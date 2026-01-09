import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { country } = await req.json();

    if (!country) {
      return Response.json({ error: 'Missing country parameter' }, { status: 400 });
    }

    const [compliance, alerts] = await Promise.all([
      base44.entities.TaxCompliance.filter({ user_email: user.email, country }).catch(() => []),
      base44.entities.TaxAlert.filter({ user_email: user.email, country }).catch(() => [])
    ]);

    const monitoring = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate real-time tax compliance monitoring report for ${country}.

Current Status:
- Compliance Items: ${compliance.length}
- Active Alerts: ${alerts.length}

Provide:
1. Overall compliance health score
2. Critical items requiring immediate action
3. Upcoming deadlines (30, 14, 7 days)
4. Document collection status
5. Risk areas requiring attention
6. Recommended priority order for tasks
7. Compliance metrics by category
8. Estimated completion timeline`,
      response_json_schema: {
        type: 'object',
        properties: {
          health_score: { type: 'number' },
          critical_items: { type: 'array', items: { type: 'object', additionalProperties: true } },
          upcoming_deadlines: { type: 'array', items: { type: 'string' } },
          document_status: { type: 'object', additionalProperties: true },
          risk_areas: { type: 'array', items: { type: 'string' } },
          priority_tasks: { type: 'array', items: { type: 'string' } },
          completion_estimate: { type: 'string' }
        }
      }
    });

    return Response.json({
      status: 'success',
      monitoring: {
        country,
        generated_at: new Date().toISOString(),
        metric_counts: { compliance_items: compliance.length, alerts: alerts.length },
        content: monitoring
      }
    });
  } catch (error) {
    console.error('Generate compliance monitoring error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});