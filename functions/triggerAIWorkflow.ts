import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { trigger_type, trigger_data } = await req.json();

        // Finde passende Workflow-Regeln
        const rules = await base44.asServiceRole.entities.AIWorkflowRule.filter({
            trigger_type,
            is_enabled: true
        });

        const executed = [];

        for (const rule of rules) {
            // Prüfe Bedingung
            let shouldTrigger = false;

            if (trigger_type === 'budget_exceeded') {
                const threshold = rule.trigger_condition?.threshold || 100;
                const comparison = rule.trigger_condition?.comparison || '>=';
                const value = trigger_data?.budget_percentage || 0;

                if (comparison === '>=' && value >= threshold) shouldTrigger = true;
                if (comparison === '>' && value > threshold) shouldTrigger = true;
            } else if (trigger_type === 'document_urgent') {
                shouldTrigger = trigger_data?.urgency === 'high';
            } else if (trigger_type === 'cost_threshold') {
                const threshold = rule.trigger_condition?.amount || 50;
                shouldTrigger = trigger_data?.cost >= threshold;
            } else {
                shouldTrigger = true;
            }

            if (!shouldTrigger) continue;

            // Führe Aktion aus
            if (rule.action_type === 'send_email') {
                await base44.asServiceRole.integrations.Core.SendEmail({
                    to: rule.action_config?.recipient || 'admin@example.com',
                    subject: rule.action_config?.subject || `AI Workflow: ${rule.rule_name}`,
                    body: `Workflow-Regel "${rule.rule_name}" wurde ausgelöst.\n\nDetails: ${JSON.stringify(trigger_data, null, 2)}`
                });
            } else if (rule.action_type === 'create_task') {
                await base44.asServiceRole.entities.Task.create({
                    titel: rule.action_config?.task_title || rule.rule_name,
                    beschreibung: `Automatisch erstellt durch AI-Workflow.\n\n${JSON.stringify(trigger_data, null, 2)}`,
                    prioritaet: rule.priority === 'critical' ? 'Dringend' : 'Hoch',
                    status: 'Offen'
                });
            } else if (rule.action_type === 'send_notification') {
                await base44.asServiceRole.entities.Notification.create({
                    user_email: rule.action_config?.user_email || 'all',
                    title: rule.action_config?.title || rule.rule_name,
                    message: rule.action_config?.message || JSON.stringify(trigger_data),
                    type: 'ai_workflow',
                    priority: rule.priority
                });
            } else if (rule.action_type === 'slack_message') {
                // Slack-Nachricht senden (wenn konfiguriert)
                const slackToken = await base44.asServiceRole.connectors.getAccessToken('slack');
                if (slackToken) {
                    await fetch('https://slack.com/api/chat.postMessage', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${slackToken}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            channel: rule.action_config?.channel || '#general',
                            text: `🤖 AI Workflow: ${rule.rule_name}\n\n${rule.action_config?.message || JSON.stringify(trigger_data, null, 2)}`
                        })
                    });
                }
            }

            // Update Regel-Statistik
            await base44.asServiceRole.entities.AIWorkflowRule.update(rule.id, {
                last_triggered: new Date().toISOString(),
                trigger_count: (rule.trigger_count || 0) + 1
            });

            executed.push(rule.rule_name);
        }

        return Response.json({
            success: true,
            executed_rules: executed,
            count: executed.length
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});