import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Allows requester to withdraw an approval request
 */
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { workflow_id, withdrawal_reason = 'No reason provided' } = await req.json();

        if (!workflow_id) {
            return Response.json({ error: 'workflow_id required' }, { status: 400 });
        }

        // Get workflow
        const workflows = await base44.entities.ApprovalWorkflow.filter(
            { id: workflow_id },
            null,
            1
        );

        if (workflows.length === 0) {
            return Response.json({ error: 'Workflow not found' }, { status: 404 });
        }

        const workflow = workflows[0];

        // Check if user is the requester
        if (workflow.requester_email !== user.email) {
            return Response.json({ error: 'Only requester can withdraw' }, { status: 403 });
        }

        // Check if already approved or rejected
        if (['approved', 'rejected', 'withdrawn', 'cancelled'].includes(workflow.status)) {
            return Response.json({
                error: `Cannot withdraw request with status: ${workflow.status}`
            }, { status: 400 });
        }

        // Withdraw the request
        workflow.status = 'withdrawn';
        workflow.withdrawn = true;
        workflow.withdrawn_at = new Date().toISOString();
        workflow.withdrawal_reason = withdrawal_reason;

        // Add to history
        if (!workflow.history) {
            workflow.history = [];
        }
        workflow.history.push({
            timestamp: new Date().toISOString(),
            action: 'withdrawn',
            actor: user.email,
            details: withdrawal_reason
        });

        // Update workflow
        await base44.asServiceRole.entities.ApprovalWorkflow.update(workflow_id, workflow);

        // Notify approvers
        const approvers = workflow.approvers || [];
        for (const approver of approvers) {
            await base44.asServiceRole.entities.Notification.create({
                user_email: approver.approver_email,
                notification_type: 'request_withdrawn',
                severity: 'info',
                message: `Anfrage "${workflow.workflow_name}" von ${user.email} wurde zurückgezogen`,
                related_id: workflow_id,
                created_at: new Date().toISOString()
            });
        }

        // Log action
        await base44.asServiceRole.entities.UserAuditLog.create({
            user_email: user.email,
            action: 'request_withdrawn',
            resource_type: 'ApprovalWorkflow',
            resource_id: workflow_id,
            resource_name: workflow.workflow_name,
            changes: {
                withdrawal_reason: withdrawal_reason
            },
            timestamp: new Date().toISOString(),
            status: 'success'
        });

        return Response.json({
            success: true,
            message: 'Request withdrawn successfully',
            workflow_status: 'withdrawn'
        });

    } catch (error) {
        console.error('Error withdrawing request:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});