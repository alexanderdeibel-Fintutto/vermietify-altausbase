import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Processes approval or rejection with comments
 */
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { workflow_id, action, comment = '' } = await req.json();

        if (!workflow_id || !['approve', 'reject'].includes(action)) {
            return Response.json({ error: 'Invalid parameters' }, { status: 400 });
        }

        console.log(`Processing ${action} for workflow: ${workflow_id}`);

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

        // Check if user is an approver
        const approverIndex = workflow.approvers?.findIndex(
            a => a.approver_email === user.email
        );

        if (approverIndex === -1) {
            return Response.json({ error: 'Not an approver for this workflow' }, { status: 403 });
        }

        // Update approver status
        workflow.approvers[approverIndex] = {
            ...workflow.approvers[approverIndex],
            status: action === 'approve' ? 'approved' : 'rejected',
            comment: comment,
            approved_at: new Date().toISOString()
        };

        // Add to history
        if (!workflow.history) {
            workflow.history = [];
        }
        workflow.history.push({
            timestamp: new Date().toISOString(),
            action: action === 'approve' ? 'approved' : 'rejected',
            actor: user.email,
            details: comment || 'No comment provided'
        });

        // Determine overall workflow status
        const allApprovals = workflow.approvers || [];
        const approved = allApprovals.filter(a => a.status === 'approved').length;
        const rejected = allApprovals.filter(a => a.status === 'rejected').length;

        if (rejected > 0) {
            workflow.status = 'rejected';
        } else if (approved === allApprovals.length) {
            workflow.status = 'approved';
        }

        // Update workflow
        await base44.asServiceRole.entities.ApprovalWorkflow.update(workflow_id, workflow);

        // Send notification to requester
        const message = action === 'approve'
            ? `✅ Ihre Anfrage wurde von ${user.email} genehmigt`
            : `❌ Ihre Anfrage wurde von ${user.email} abgelehnt${comment ? ': ' + comment : ''}`;

        await base44.asServiceRole.entities.Notification.create({
            user_email: workflow.requester_email,
            notification_type: action === 'approve' ? 'request_approved' : 'request_rejected',
            severity: action === 'approve' ? 'info' : 'high',
            message: message,
            related_id: workflow_id,
            created_at: new Date().toISOString()
        });

        // Log action
        await base44.asServiceRole.entities.UserAuditLog.create({
            user_email: user.email,
            action: action === 'approve' ? 'request_approved' : 'request_rejected',
            resource_type: 'ApprovalWorkflow',
            resource_id: workflow_id,
            resource_name: workflow.workflow_name,
            changes: {
                action: action,
                comment: comment
            },
            timestamp: new Date().toISOString(),
            status: 'success'
        });

        return Response.json({
            success: true,
            workflow_status: workflow.status,
            message: `Request ${action}ed${comment ? ' with comment' : ''}`
        });

    } catch (error) {
        console.error('Error processing approval:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});