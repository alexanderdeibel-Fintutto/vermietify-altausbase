import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Wird von anderen Functions aufgerufen um Smart Alerts zu generieren
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { alert_type, data, target_users } = await req.json();

        let title = '';
        let message = '';
        let priority = 'medium';

        // Generiere Alert basierend auf Typ
        if (alert_type === 'budget_warning') {
            title = '⚠️ AI-Budget-Warnung';
            message = `Das AI-Budget ist bei ${data.budget_percent}%. Aktuell: €${data.current_cost}, Budget: €${data.budget_limit}`;
            priority = data.budget_percent >= 100 ? 'critical' : 'high';
        } else if (alert_type === 'cost_spike') {
            title = '📈 Kostenanstieg erkannt';
            message = `Feature "${data.feature}" zeigt ungewöhnlich hohe Kosten: €${data.cost}`;
            priority = 'medium';
        } else if (alert_type === 'inefficient_usage') {
            title = '💡 Optimierungspotenzial';
            message = data.suggestion || 'AI-Nutzung kann optimiert werden';
            priority = 'low';
        } else if (alert_type === 'rate_limit_warning') {
            title = '⏱️ Rate-Limit-Warnung';
            message = `Sie haben ${data.requests_used} von ${data.limit} Anfragen genutzt`;
            priority = 'medium';
        }

        // Erstelle Notifications für alle Ziel-User
        const users = target_users || ['all'];
        
        for (const userEmail of users) {
            await base44.asServiceRole.entities.Notification.create({
                user_email: userEmail,
                title,
                message,
                type: 'ai_smart_alert',
                priority,
                is_read: false
            });
        }

        // Trigger Workflows
        await base44.asServiceRole.functions.invoke('triggerAIWorkflow', {
            trigger_type: alert_type,
            trigger_data: data
        });

        return Response.json({ 
            success: true,
            notifications_created: users.length
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});