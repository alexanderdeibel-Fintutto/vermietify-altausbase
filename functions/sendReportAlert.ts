import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    const { buildingId, alertType, severity, message, recipients } = await req.json();

    try {
        const user = await base44.auth.me();
        if (user?.role !== 'admin') {
            return new Response(JSON.stringify({ error: 'Admin access required' }), { status: 403 });
        }

        // Sende Slack-Benachrichtigung wenn vorhanden
        if (recipients?.slack) {
            try {
                await base44.integrations.Slack.postMessage({
                    channel: recipients.slack,
                    text: `🚨 ${severity} Alert: ${alertType}`,
                    blocks: [
                        {
                            type: 'header',
                            text: {
                                type: 'plain_text',
                                text: `${severity === 'HIGH' ? '🔴' : severity === 'MEDIUM' ? '🟡' : '🔵'} ${alertType}`
                            }
                        },
                        {
                            type: 'section',
                            text: {
                                type: 'mrkdwn',
                                text: message
                            }
                        },
                        {
                            type: 'context',
                            elements: [
                                {
                                    type: 'mrkdwn',
                                    text: `Building: ${buildingId} | Severity: ${severity}`
                                }
                            ]
                        }
                    ]
                });
            } catch (e) {
                console.log('Slack notification failed:', e);
            }
        }

        // Speichere Alert
        const alert = await base44.entities.AlertRule.create({
            building_id: buildingId,
            alert_type: alertType,
            severity: severity,
            message: message,
            status: 'new',
            created_by: user.email,
            created_date: new Date().toISOString()
        });

        return new Response(JSON.stringify({
            success: true,
            alert_id: alert.id,
            message: 'Alert gesendet'
        }), { status: 200 });

    } catch (error) {
        console.error('Alert error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});