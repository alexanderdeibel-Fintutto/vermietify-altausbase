import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { email_id } = await req.json();

        if (!email_id) {
            return Response.json({ error: 'email_id required' }, { status: 400 });
        }

        // Get email
        const emails = await base44.entities.Email.filter({ id: email_id });
        const email = emails[0];

        if (!email) {
            return Response.json({ error: 'Email not found' }, { status: 404 });
        }

        // Get priorities for context
        const priorities = await base44.entities.TaskPriority.list();

        // Use AI to analyze email and suggest task
        const prompt = `Analysiere diese Email und schlage einen Task vor:

Betreff: ${email.subject}
Von: ${email.sender_name || email.sender_email}
Inhalt: ${email.body_text}

Erstelle einen Task-Vorschlag mit:
- Titel (kurz und prägnant)
- Beschreibung (was muss getan werden)
- Priorität (niedrig/normal/hoch/kritisch)
- Geschätztes Fälligkeitsdatum

Verfügbare Prioritäten: ${priorities.map(p => p.name).join(', ')}`;

        const aiResponse = await base44.integrations.Core.InvokeLLM({
            prompt,
            response_json_schema: {
                type: "object",
                properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    priority_name: { type: "string" },
                    due_days_offset: { type: "number" }
                }
            }
        });

        // Find matching priority
        const priority = priorities.find(p => 
            p.name.toLowerCase() === aiResponse.priority_name?.toLowerCase()
        ) || priorities[1]; // Default to "Normal"

        // Calculate due date
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + (aiResponse.due_days_offset || 7));

        const suggestion = {
            title: aiResponse.title,
            description: aiResponse.description,
            priority_id: priority.id,
            due_date: dueDate.toISOString()
        };

        // Save suggestion to email
        await base44.entities.Email.update(email_id, {
            ai_suggested_task: suggestion
        });

        return Response.json({
            success: true,
            suggestion
        });

    } catch (error) {
        console.error('Analysis error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});