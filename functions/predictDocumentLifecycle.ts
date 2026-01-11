import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { company_id } = await req.json();

    const documents = await base44.asServiceRole.entities.Document.filter({ company_id });
    const workflows = await base44.asServiceRole.entities.WorkflowExecution.filter({ company_id });

    // AI-based lifecycle prediction
    const predictions = await base44.integrations.Core.InvokeLLM({
      prompt: `Analysiere diese Dokumente und Workflows und sage den Lebenszyklus voraus:

Dokumente: ${documents.length} total
Dokumenttypen: ${[...new Set(documents.map(d => d.document_type))].join(', ')}

Workflows: ${workflows.length} total
Durchschnittliche Zeit: ${workflows.reduce((sum, w) => sum + (w.execution_time_seconds || 0), 0) / workflows.length} Sekunden

Gib JSON zurück mit:
- "at_risk_documents" (IDs von Dokumenten die Probleme haben könnten)
- "optimization_suggestions" (Array von Vorschlägen)
- "predicted_bottlenecks" (Array von möglichen Engpässen)
- "automation_opportunities" (Array von Automatisierungsmöglichkeiten)`,
      response_json_schema: {
        type: 'object',
        properties: {
          at_risk_documents: { type: 'array', items: { type: 'string' } },
          optimization_suggestions: { type: 'array', items: { type: 'string' } },
          predicted_bottlenecks: { type: 'array', items: { type: 'string' } },
          automation_opportunities: { type: 'array', items: { type: 'string' } }
        }
      }
    });

    return Response.json({ success: true, predictions });
  } catch (error) {
    console.error('Prediction error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});