import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Processes approval workflows and handles approvals/rejections
 */
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { workflow_id, action, comment } = await req.json();

        console.log(`Processing approval: ${action} for workflow ${workflow_id}`);

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

        // Find current approver
        const approverIndex = workflow.approvers.findIndex(a => a.approver_email === user.email);
        if (approverIndex === -1) {
            return Response.json({ error: 'Not an approver' }, { status: 403 });
        }

        // Update approval status
        workflow.approvers[approverIndex] = {
            ...workflow.approvers[approverIndex],
            status: action === 'approve' ? 'approved' : 'rejected',
            comment,
            approved_at: new Date().toISOString()
        };

        // Determine workflow status
        const allApproved = workflow.approvers.every(a => a.status === 'approved');
        const anyRejected = workflow.approvers.some(a => a.status === 'rejected');
        const newStatus = anyRejected ? 'rejected' : allApproved ? 'approved' : 'pending';

        // Update workflow
        const updated = await base44.asServiceRole.entities.ApprovalWorkflow.update(
            workflow_id,
            {
                status: newStatus,
                approvers: workflow.approvers
            }
        );

        // Log audit event
        await base44.asServiceRole.entities.UserAuditLog.create({
            user_email: user.email,
            action: action === 'approve' ? 'approval_granted' : 'approval_rejected',
            resource_type: 'ApprovalWorkflow',
            resource_id: workflow_id,
            resource_name: workflow.workflow_name,
            timestamp: new Date().toISOString(),
            status: 'success'
        });

        return Response.json({
            success: true,
            workflow_id,
            new_status: newStatus,
            workflow: updated
        });

    } catch (error) {
        console.error('Error processing approval:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});