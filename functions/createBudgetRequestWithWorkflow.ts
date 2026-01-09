import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Creates a budget request and automatically triggers an approval workflow
 */
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const {
            request_title,
            category,
            requested_amount,
            justification,
            start_date,
            end_date,
            approver_emails
        } = await req.json();

        console.log(`Creating budget request for: ${user.email}`);

        // Create budget request
        const budgetRequest = await base44.asServiceRole.entities.BudgetRequest.create({
            requester_email: user.email,
            request_title,
            category,
            requested_amount,
            justification,
            start_date,
            end_date,
            status: 'submitted',
            created_at: new Date().toISOString()
        });

        // Create approval workflow
        const workflow = await base44.asServiceRole.entities.ApprovalWorkflow.create({
            workflow_name: `Budget Request: ${request_title}`,
            workflow_type: 'budget_request',
            request_id: budgetRequest.id,
            requester_email: user.email,
            approvers: (approver_emails || []).map((email, idx) => ({
                approver_email: email,
                approval_level: idx + 1,
                status: 'pending'
            })),
            content: {
                category,
                requested_amount,
                justification,
                period: `${start_date} - ${end_date}`
            },
            status: 'pending',
            priority: requested_amount > 10000 ? 'high' : 'medium',
            created_at: new Date().toISOString(),
            deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        });

        // Update budget request with workflow reference
        await base44.asServiceRole.entities.BudgetRequest.update(budgetRequest.id, {
            approval_workflow_id: workflow.id,
            status: 'submitted'
        });

        // Log audit event
        await base44.asServiceRole.entities.UserAuditLog.create({
            user_email: user.email,
            action: 'budget_request_submitted',
            resource_type: 'BudgetRequest',
            resource_id: budgetRequest.id,
            resource_name: request_title,
            timestamp: new Date().toISOString(),
            status: 'success'
        });

        // Send notification to approvers
        for (const approverEmail of (approver_emails || [])) {
            try {
                await base44.integrations.Core.SendEmail({
                    to: approverEmail,
                    subject: `Neue Budgetanfrage: ${request_title}`,
                    body: `Eine neue Budgetanfrage wartet auf Ihre Genehmigung.\n\nAnfrage: ${request_title}\nBetrag: ${requested_amount}€\nKategorie: ${category}\n\nBitte überprüfen Sie die Anfrage im Approval Queue.`
                });
            } catch (error) {
                console.warn(`Failed to send email to ${approverEmail}: ${error.message}`);
            }
        }

        return Response.json({
            success: true,
            budget_request: budgetRequest,
            approval_workflow: workflow
        });

    } catch (error) {
        console.error('Error creating budget request:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});