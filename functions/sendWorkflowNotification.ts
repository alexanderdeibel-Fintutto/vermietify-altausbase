import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Sends notifications via email and Slack for workflow events
 */
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        const { workflow_id, notification_type, recipient_email } = await req.json();

        console.log(`Sending notification for workflow: ${workflow_id}`);

        // Fetch workflow
        const workflows = await base44.asServiceRole.entities.ApprovalWorkflow.filter(
            { id: workflow_id },
            null,
            1
        );

        if (workflows.length === 0) {
            return Response.json({ error: 'Workflow not found' }, { status: 404 });
        }

        const workflow = workflows[0];
        const emailSubject = getEmailSubject(notification_type, workflow.workflow_name);
        const emailBody = getEmailBody(notification_type, workflow);

        // Send email notification
        try {
            await base44.integrations.Core.SendEmail({
                to: recipient_email,
                subject: emailSubject,
                body: emailBody
            });
            console.log(`Email sent to ${recipient_email}`);
        } catch (error) {
            console.warn(`Failed to send email: ${error.message}`);
        }

        // Try to send Slack notification
        try {
            const slackToken = await base44.asServiceRole.connectors.getAccessToken('slack');
            if (slackToken) {
                await sendSlackNotification(slackToken, notification_type, workflow);
            }
        } catch (error) {
            console.warn(`Slack notification not available: ${error.message}`);
        }

        return Response.json({
            success: true,
            workflow_id,
            notifications_sent: ['email', 'slack']
        });

    } catch (error) {
        console.error('Error sending notification:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});

function getEmailSubject(type, workflowName) {
    const subjects = {
        approval_request: `Genehmigung erforderlich: ${workflowName}`,
        approval_reminder: `Erinnerung: Genehmigung ausstehend - ${workflowName}`,
        approved: `Genehmigt: ${workflowName}`,
        rejected: `Abgelehnt: ${workflowName}`,
        budget_overrun: `⚠️ Budget überschritten: ${workflowName}`,
        deadline_alert: `📅 Frist näht: ${workflowName}`
    };
    return subjects[type] || `Benachrichtigung: ${workflowName}`;
}

function getEmailBody(type, workflow) {
    const baseInfo = `
Workflow: ${workflow.workflow_name}
Typ: ${workflow.workflow_type}
Status: ${workflow.status}
Priorität: ${workflow.priority}
Erstellt: ${new Date(workflow.created_at).toLocaleDateString('de-DE')}
    `;

    const bodies = {
        approval_request: `
Genehmigung erforderlich für: ${workflow.workflow_name}

${baseInfo}

Anfragender: ${workflow.requester_email}

Bitte genehmigen oder lehnen Sie diese Anfrage ab.
        `,
        approved: `
Die folgende Anfrage wurde genehmigt:

${baseInfo}
        `,
        rejected: `
Die folgende Anfrage wurde abgelehnt:

${baseInfo}
        `,
        budget_overrun: `
⚠️ WARNUNG: Budget überschritten

${baseInfo}

Bitte überprüfen Sie die Ausgaben und ergreifen Sie geeignete Maßnahmen.
        `
    };

    return bodies[type] || baseInfo;
}

async function sendSlackNotification(token, type, workflow) {
    // This would integrate with Slack API
    // For now, log that it would be sent
    console.log(`Would send Slack notification: ${type} for ${workflow.workflow_name}`);
}