import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const CLAUDE_PRICES = {
  "claude-haiku-4-5-20251001": { input: 1.00, output: 5.00 },
  "claude-sonnet-4-5-20250929": { input: 3.00, output: 15.00 },
  "claude-opus-4-5-20251101": { input: 5.00, output: 25.00 }
};

const OPENAI_PRICES = {
  "gpt-4o": { input: 2.50, output: 10.00 },
  "gpt-4o-mini": { input: 0.15, output: 0.60 }
};

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    const { featureKey, messages, systemPrompt, imageBase64, imageMediaType, overrideModel, overrideTemperature } = await req.json();

    try {
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const settingsList = await base44.asServiceRole.entities.AISettings.list();
        const settings = settingsList[0];
        
        if (!settings) {
            return Response.json({ error: 'AI-Settings nicht konfiguriert. Bitte API-Key in Einstellungen hinterlegen.' }, { status: 400 });
        }

        const featureConfigs = await base44.asServiceRole.entities.AIFeatureConfig.filter({ feature_key: featureKey });
        const featureConfig = featureConfigs[0];
        
        if (!featureConfig) {
            return Response.json({ error: `AI-Feature "${featureKey}" nicht gefunden.` }, { status: 404 });
        }

        if (!featureConfig.enabled) {
            return Response.json({ error: `AI-Feature "${featureConfig.feature_name}" ist deaktiviert.` }, { status: 403 });
        }

        if (featureConfig.max_requests_per_day > 0 && featureConfig.requests_today >= featureConfig.max_requests_per_day) {
            return Response.json({ error: `Tageslimit für "${featureConfig.feature_name}" erreicht (${featureConfig.max_requests_per_day} Anfragen).` }, { status: 429 });
        }

        let provider = featureConfig.preferred_provider === "global" ? settings.preferred_provider : featureConfig.preferred_provider;

        if (provider === "auto") {
            if (settings.claude_enabled && settings.claude_api_key) {
                provider = "claude";
            } else if (settings.openai_enabled && settings.openai_api_key) {
                provider = "openai";
            } else {
                return Response.json({ error: 'Kein AI-Provider aktiviert. Bitte Claude oder OpenAI in Einstellungen aktivieren.' }, { status: 400 });
            }
        }

        const model = overrideModel || featureConfig.preferred_model || (provider === "claude" ? settings.claude_default_model : "gpt-4o-mini");
        const temperature = overrideTemperature ?? featureConfig.temperature ?? 0.3;
        const maxTokens = featureConfig.max_tokens_per_request || 4096;

        const startTime = Date.now();
        let result;

        if (provider === "claude") {
            const formattedMessages = messages.map(msg => {
                if (msg.image) {
                    return {
                        role: msg.role,
                        content: [
                            { type: "image", source: { type: "base64", media_type: msg.imageMediaType || "image/jpeg", data: msg.image } },
                            { type: "text", text: msg.content }
                        ]
                    };
                }
                return { role: msg.role, content: msg.content };
            });

            if (imageBase64 && formattedMessages.length > 0) {
                const lastMsg = formattedMessages[formattedMessages.length - 1];
                if (typeof lastMsg.content === "string") {
                    formattedMessages[formattedMessages.length - 1] = {
                        role: lastMsg.role,
                        content: [
                            { type: "image", source: { type: "base64", media_type: imageMediaType || "image/jpeg", data: imageBase64 } },
                            { type: "text", text: lastMsg.content }
                        ]
                    };
                }
            }

            const response = await fetch("https://api.anthropic.com/v1/messages", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": settings.claude_api_key,
                    "anthropic-version": "2023-06-01"
                },
                body: JSON.stringify({
                    model,
                    max_tokens: maxTokens,
                    temperature,
                    system: systemPrompt || "",
                    messages: formattedMessages
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || `Claude API Fehler: ${response.status}`);
            }

            const data = await response.json();
            result = {
                content: data.content[0]?.text || "",
                inputTokens: data.usage?.input_tokens || 0,
                outputTokens: data.usage?.output_tokens || 0
            };

        } else {
            const formattedMessages = [];
            if (systemPrompt) formattedMessages.push({ role: "system", content: systemPrompt });

            for (const msg of messages) {
                if (msg.image || imageBase64) {
                    const imgData = msg.image || imageBase64;
                    const imgType = msg.imageMediaType || imageMediaType || "image/jpeg";
                    formattedMessages.push({
                        role: msg.role,
                        content: [
                            { type: "image_url", image_url: { url: `data:${imgType};base64,${imgData}` } },
                            { type: "text", text: msg.content }
                        ]
                    });
                } else {
                    formattedMessages.push({ role: msg.role, content: msg.content });
                }
            }

            const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${settings.openai_api_key}`
                },
                body: JSON.stringify({
                    model,
                    max_tokens: maxTokens,
                    temperature,
                    messages: formattedMessages
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || `OpenAI API Fehler: ${response.status}`);
            }

            const data = await response.json();
            result = {
                content: data.choices[0]?.message?.content || "",
                inputTokens: data.usage?.prompt_tokens || 0,
                outputTokens: data.usage?.completion_tokens || 0
            };
        }

        const responseTime = Date.now() - startTime;
        const prices = provider === "claude" ? CLAUDE_PRICES[model] : OPENAI_PRICES[model];
        const costEur = prices ? ((result.inputTokens / 1000000) * prices.input) + ((result.outputTokens / 1000000) * prices.output) : 0;

        await base44.asServiceRole.entities.AIUsageLog.create({
            feature_key: featureKey,
            provider,
            model,
            input_tokens: result.inputTokens,
            output_tokens: result.outputTokens,
            estimated_cost_eur: costEur,
            response_time_ms: responseTime,
            success: true
        });

        await base44.asServiceRole.entities.AIFeatureConfig.update(featureConfig.id, {
            requests_today: featureConfig.requests_today + 1,
            total_requests: featureConfig.total_requests + 1,
            total_input_tokens: featureConfig.total_input_tokens + result.inputTokens,
            total_output_tokens: featureConfig.total_output_tokens + result.outputTokens,
            estimated_cost_eur: featureConfig.estimated_cost_eur + costEur,
            last_used_at: new Date().toISOString()
        });

        return Response.json({
            success: true,
            content: result.content,
            provider,
            model,
            inputTokens: result.inputTokens,
            outputTokens: result.outputTokens,
            costEur,
            responseTimeMs: responseTime
        });

    } catch (error) {
        console.error('AI call error:', error);
        
        const base44Retry = createClientFromRequest(req);
        const featureConfigsRetry = await base44Retry.asServiceRole.entities.AIFeatureConfig.filter({ feature_key: featureKey });
        
        if (featureConfigsRetry[0]) {
            await base44Retry.asServiceRole.entities.AIUsageLog.create({
                feature_key: featureKey,
                provider: 'claude',
                model: 'unknown',
                input_tokens: 0,
                output_tokens: 0,
                estimated_cost_eur: 0,
                response_time_ms: Date.now() - (req.startTime || Date.now()),
                success: false,
                error_message: error.message
            });
        }
        
        return Response.json({ error: error.message }, { status: 500 });
    }
});