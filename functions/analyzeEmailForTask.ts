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
            return Response.json({ error: 'email_id is required' }, { status: 400 });
        }

        // Get email details
        const emails = await base44.entities.Email.filter({ id: email_id });
        
        if (!emails || emails.length === 0) {
            return Response.json({ error: 'Email not found' }, { status: 404 });
        }

        const email = emails[0];

        // Analyze email using AI
        const analysisPrompt = `
Analysiere folgende Email und erstelle einen Aufgaben-Vorschlag (Task):

Betreff: ${email.subject}
Von: ${email.sender_name} <${email.sender_email}>
Inhalt: ${email.body_text}

Erstelle einen strukturierten Task-Vorschlag mit:
- Titel (kurz und präzise)
- Beschreibung (detailliert)
- Priorität (niedrig/mittel/hoch)
- Fälligkeitsdatum (in Tagen ab heute, z.B. 3 für in 3 Tagen)
- Nächste Aktion (konkreter nächster Schritt)

Antworte im JSON-Format.
`;

        const aiResponse = await base44.integrations.Core.InvokeLLM({
            prompt: analysisPrompt,
            response_json_schema: {
                type: 'object',
                properties: {
                    title: { type: 'string' },
                    description: { type: 'string' },
                    priority: { 
                        type: 'string',
                        enum: ['niedrig', 'mittel', 'hoch']
                    },
                    due_days: { type: 'number' },
                    next_action: { type: 'string' }
                },
                required: ['title', 'description', 'priority']
            }
        });

        // Map priority names to priority IDs
        const priorities = await base44.entities.TaskPriority.list();
        
        let priorityId = null;
        const priorityMap = {
            'niedrig': priorities.find(p => p.name.toLowerCase().includes('niedrig')),
            'mittel': priorities.find(p => p.name.toLowerCase().includes('mittel') || p.name.toLowerCase().includes('normal')),
            'hoch': priorities.find(p => p.name.toLowerCase().includes('hoch'))
        };
        
        const suggestedPriority = aiResponse.priority?.toLowerCase() || 'mittel';
        priorityId = priorityMap[suggestedPriority]?.id || null;

        // Calculate due date
        let dueDate = null;
        if (aiResponse.due_days && aiResponse.due_days > 0) {
            const date = new Date();
            date.setDate(date.getDate() + aiResponse.due_days);
            dueDate = date.toISOString();
        }

        const taskSuggestion = {
            title: aiResponse.title,
            description: aiResponse.description,
            priority_id: priorityId,
            due_date: dueDate,
            next_action: aiResponse.next_action || null,
            email_id: email_id,
            status: 'offen'
        };

        // Update email with AI suggestion
        await base44.asServiceRole.entities.Email.update(email_id, {
            ai_suggested_task: taskSuggestion
        });

        return Response.json({
            success: true,
            suggestion: taskSuggestion
        });

    } catch (error) {
        console.error('Error analyzing email:', error);
        return Response.json({ 
            error: error.message || 'Failed to analyze email' 
        }, { status: 500 });
    }
});