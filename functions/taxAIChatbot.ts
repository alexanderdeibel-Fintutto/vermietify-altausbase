import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * AI Tax Chatbot - Answers tax questions with knowledge base context
 */
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { message, conversation_history, user_profile } = await req.json();

        // Build context from knowledge base and user profile
        let context = '';

        if (user_profile) {
            context = `Benutzer-Profil: Primäres Land: ${user_profile.primary_residence_country}, Einkommenarten: ${user_profile.income_sources?.map(s => s.type).join(', ')}. `;
        }

        // Fetch relevant tax rules from knowledge base
        const taxRules = await base44.asServiceRole.entities.TaxRule.filter(
            { is_active: true },
            '-updated_date',
            10
        );

        const ruleContext = taxRules
            .map(rule => `${rule.display_name}: ${rule.description}`)
            .join('\n');

        // Invoke LLM with context
        const response = await base44.integrations.Core.InvokeLLM({
            prompt: `Du bist ein erfahrener Steuerberater für komplexe internationale Steuersituationen.

STEUER-KONTEXT:
${context}

VERFÜGBARE STEUERREGELN:
${ruleContext}

KONVERSATIONSVERLAUF:
${conversation_history?.map(m => `${m.role}: ${m.content}`).join('\n') || 'Neu'}

BENUTZER-FRAGE: ${message}

ANTWORTE:
1. Klar und verständlich (auch für nicht-Experten)
2. Mit spezifischen Referenzen zu Gesetzen/Regeln wenn relevant
3. Praktische, umsetzbare Tipps
4. Wenn unsicher, gestehe es ein statt zu spekulieren
5. Begrenzt auf 2-3 Absätze`,
            add_context_from_internet: false
        });

        // Log conversation for audit
        await base44.asServiceRole.entities.TaxRuleAuditLog.create({
            entity_type: 'AIChat',
            entity_id: user.id,
            action: 'CHAT_MESSAGE',
            new_values: { 
                user_question: message,
                response_length: response.length
            },
            performed_by: user.email,
            performed_at: new Date().toISOString()
        });

        return Response.json({
            success: true,
            response,
            sources: taxRules.slice(0, 3).map(r => r.display_name)
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});