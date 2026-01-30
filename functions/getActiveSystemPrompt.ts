import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Hole den aktiven System Prompt für ein bestimmtes Feature
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { feature_key } = await req.json();

        if (!feature_key) {
            return Response.json({ error: 'feature_key erforderlich' }, { status: 400 });
        }

        // Hole den aktiven Prompt für dieses Feature
        const prompts = await base44.asServiceRole.entities.AISystemPrompt.filter({
            feature_key,
            is_active: true
        }, '-created_date', 1);

        if (prompts.length === 0) {
            // Fallback: Nutze default Prompt basierend auf Feature
            const defaultPrompts = getDefaultPrompts();
            const defaultPrompt = defaultPrompts[feature_key] || defaultPrompts.other;
            
            return Response.json({
                success: true,
                prompt: defaultPrompt,
                is_custom: false
            });
        }

        // Inkrementiere usage_count
        await base44.asServiceRole.entities.AISystemPrompt.update(
            prompts[0].id,
            { usage_count: (prompts[0].usage_count || 0) + 1 }
        );

        return Response.json({
            success: true,
            prompt: prompts[0].system_prompt,
            is_custom: true,
            prompt_id: prompts[0].id,
            prompt_name: prompts[0].custom_name
        });

    } catch (error) {
        return Response.json({ 
            error: error.message,
            prompt: getDefaultPrompts()['other'],
            is_custom: false
        }, { status: 500 });
    }
});

function getDefaultPrompts() {
    return {
        chat: `Du bist ein hilfreicher, freundlicher und sachlicher AI-Assistent. 
Du antwortest präzise und hilfreich auf deutsche Fragen.
Du legst Wert auf Genauigkeit und Klarheit.
Wenn du etwas nicht weißt, sagst du das offen.`,

        ocr: `Du bist ein Experte für die Dokumentenerkennung und Datenextraktion.
Extrahiere Informationen aus Dokumenten strukturiert und präzise.
Achte auf deutsche Datumsfor