import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

Deno.serve(async (req) => {
    const { systemPrompt, userMessage, contextData, maxTokens = 1024 } = await req.json();
    const base44 = createClientFromRequest(req);

    if (!ANTHROPIC_API_KEY) {
        console.error("ANTHROPIC_API_KEY is not set.");
        return new Response(JSON.stringify({ error: "Anthropic API key is not configured." }), { status: 500 });
    }

    const messages = [{
        role: "user",
        content: `${userMessage}\n\nContext:\n${JSON.stringify(contextData, null, 2)}`
    }];

    try {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "x-api-key": ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            body: JSON.stringify({
                model: "claude-3-5-sonnet-20240620",
                max_tokens: maxTokens,
                system: systemPrompt,
                messages: messages,
            }),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`Anthropic API error: ${response.status} ${response.statusText}`, errorBody);
            return new Response(JSON.stringify({ error: "Failed to call Anthropic API", details: errorBody }), { status: response.status });
        }

        const responseData = await response.json();
        
        const inputTokens = responseData.usage?.input_tokens || 0;
        const outputTokens = responseData.usage?.output_tokens || 0;
        const totalTokens = inputTokens + outputTokens;

        const user = await base44.auth.me();
        if(user) {
          await base44.entities.AIConversation.create({
            user_id: user.id,
            session_id: crypto.randomUUID(),
            messages: [...messages, { role: 'assistant', content: responseData.content[0].text }],
            module: 'CHAT',
            tokens_used: totalTokens
          });
        }

        return new Response(JSON.stringify(responseData), {
            headers: { "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error("Error calling Anthropic API:", error);
        return new Response(JSON.stringify({ error: "Internal server error", details: error.message }), { status: 500 });
    }
});