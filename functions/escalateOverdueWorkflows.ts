import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Escalates workflows that haven't been processed within deadline
 * Scheduled task that runs daily
 */
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        console.log('Starting workflow escalation check');

        // Get all pending workflows
        const workflows = await base44.asServiceRole.entities.ApprovalWorkflow.filter(
            { status: 'pending' },
            '-created_at',
            100
        );

        const now = new Date();
        const escalatedWorkflows = [];

        for (const workflow of workflows) {
            if (!workflow.deadline) continue;
            if (workflow.escalated) continue;

            const deadline = new Date(workflow.deadline);

            // Check if deadline is passed
            if (now > deadline && !workflow.escalated) {
                console.log(`Escalating workflow: ${workflow.id}`);

                // Add escalation marker
                workflow.escalated = true;
                workflow.escalated_at = now.toISOString();

                // Add to history
                if (!workflow.history) {
                    workflow.history = [];
                }
                workflow.history.push({
                    timestamp: now.toISOString(),
                    action: 'escalated',
                    actor: 'system',
                    details: 'Workflow escalated due to deadline exceeded'
                });

                // Update workflow
                await base44.asServiceRole.entities.ApprovalWorkflow.update(workflow.id, workflow);

                // Send urgent notification to pending approvers
                const pendingApprovers = workflow.approvers?.filter(a => a.status === 'pending') || [];

                for (const approver of pendingApprovers) {
                    await base44.asServiceRole.entities.Notification.create({
                        user_email: approver.approver_email,
                        notification_type: 'workflow_escalated',
                        severity: 'high',
                        message: `🚨 DRINGEND: Anfrage "${workflow.workflow_name}" überfällig - Sofortige Genehmigung erforderlich`,
                        related_id: workflow.id,
                        created_at: now.toISOString()
                    });

                    // Send Slack alert
                    try {
                        await base44.integrations.Slack.PostMessage({
                            channel: 'general',
                            text: `🚨 *Workflow Escalation* \n*${workflow.workflow_name}* is overdue and requires immediate approval from ${approver.approver_email}`
                        });
                    } catch (error) {
                        console.warn('Slack notification failed:', error.message);
                    }
                }

                escalatedWorkflows.push({
                    id: workflow.id,
                    name: workflow.workflow_name,
                    deadline: workflow.deadline,
                    pending_approvers: pendingApprovers.length
                });
            }
        }

        return Response.json({
            success: true,
            escalated_count: escalatedWorkflows.length,
            escalated_workflows: escalatedWorkflows
        });

    } catch (error) {
        console.error('Error escalating workflows:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});