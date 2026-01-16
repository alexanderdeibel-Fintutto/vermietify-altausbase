import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { featureKey, systemPrompt, userPrompt, imageBase64, imageMediaType, responseSchema } = await req.json();

        const settingsList = await base44.asServiceRole.entities.AISettings.list();
        const settings = settingsList[0];

        if (!settings?.claude_enabled) {
            return Response.json({ success: false, error: 'Claude nicht aktiviert' }, { status: 400 });
        }

        const features = await base44.asServiceRole.entities.AIFeatureConfig.filter({ feature_key: featureKey });
        const feature = features[0];

        if (!feature?.enabled) {
            return Response.json({ success: false, error: 'Feature deaktiviert' }, { status: 403 });
        }

        const claudeApiKey = settings.claude_api_key || Deno.env.get('ANTHROPIC_API_KEY');
        if (!claudeApiKey) {
            return Response.json({ success: false, error: 'Claude API Key fehlt' }, { status: 400 });
        }

        const model = feature.preferred_model || settings.claude_default_model || 'claude-sonnet-4-5-20250929';

        const messages = [];
        
        if (imageBase64) {
            messages.push({
                role: 'user',
                content: [
                    { type: 'image', source: { type: 'base64', media_type: imageMediaType || 'image/jpeg', data: imageBase64 } },
                    { type: 'text', text: userPrompt }
                ]
            });
        } else {
            messages.push({ role: 'user', content: userPrompt });
        }

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': claudeApiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model,
                max_tokens: 4096,
                system: systemPrompt,
                messages
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Claude API error: ${error}`);
        }

        const result = await response.json();
        const textContent = result.content.find(c => c.type === 'text')?.text || '';

        let parsedData = textContent;
        if (responseSchema) {
            const jsonMatch = textContent.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                parsedData = JSON.parse(jsonMatch[0]);
            }
        }

        const inputTokens = result.usage.input_tokens;
        const outputTokens = result.usage.output_tokens;
        const costPer1MInput = model.includes('haiku') ? 0.80 : model.includes('opus') ? 12.00 : 2.40;
        const costPer1MOutput = model.includes('haiku') ? 4.00 : model.includes('opus') ? 60.00 : 12.00;
        const estimatedCost = (inputTokens / 1000000 * costPer1MInput) + (outputTokens / 1000000 * costPer1MOutput);

        await base44.asServiceRole.entities.AIUsageLog.create({
            feature_key: featureKey,
            provider: 'claude',
            model_used: model,
            input_tokens: inputTokens,
            output_tokens: outputTokens,
            estimated_cost_eur: estimatedCost,
            success: true
        });

        await base44.asServiceRole.entities.AIFeatureConfig.update(feature.id, {
            total_requests: (feature.total_requests || 0) + 1,
            requests_today: (feature.requests_today || 0) + 1,
            estimated_cost_eur: (feature.estimated_cost_eur || 0) + estimatedCost
        });

        return Response.json({
            success: true,
            data: parsedData,
            usage: { input_tokens: inputTokens, output_tokens: outputTokens, cost_eur: estimatedCost }
        });

    } catch (error) {
        return Response.json({ success: false, error: error.message }, { status: 500 });
    }
});