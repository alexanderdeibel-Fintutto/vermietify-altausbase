import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { task_title, task_description, document_type } = await req.json();

        // Alle aktiven Workflows abrufen
        const workflows = await base44.entities.Workflow.filter({ is_active: true });

        if (workflows.length === 0) {
            return Response.json({ suggested_workflow: null });
        }

        // KI-Analyse für Workflow-Empfehlung
        const prompt = `
Du bist ein Experte für Immobilienverwaltung und Workflow-Optimierung.

Basierend auf folgenden Informationen, empfehle den am besten passenden Workflow:

Task-Titel: ${task_title}
Task-Beschreibung: ${task_description || 'Keine Beschreibung'}
Dokumenttyp: ${document_type || 'Nicht angegeben'}

Verfügbare Workflows:
${workflows.map((w, i) => `${i + 1}. ${w.name} (${w.document_type}) - ${w.description || 'Keine Beschreibung'}`).join('\n')}

Analysiere den Task und empfehle den passendsten Workflow. Gib eine JSON-Antwort zurück mit:
- workflow_id: Die ID des empfohlenen Workflows
- confidence: Dein Vertrauenslevel (0-100)
- reasoning: Kurze Begründung (1-2 Sätze)
`;

        const aiResponse = await base44.integrations.Core.InvokeLLM({
            prompt,
            response_json_schema: {
                type: "object",
                properties: {
                    workflow_id: { type: "string" },
                    confidence: { type: "number" },
                    reasoning: { type: "string" }
                }
            }
        });

        // Empfohlenen Workflow finden
        const suggested = workflows.find(w => w.id === aiResponse.workflow_id);

        return Response.json({
            suggested_workflow: suggested || null,
            confidence: aiResponse.confidence,
            reasoning: aiResponse.reasoning
        });

    } catch (error) {
        console.error('Workflow suggestion error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});