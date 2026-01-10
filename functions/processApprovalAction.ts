import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { execution_id, approval_id, action } = await req.json();

    // Get execution
    const executions = await base44.asServiceRole.entities.WorkflowExecution.filter({
      id: execution_id
    });

    if (executions.length === 0) {
      return Response.json({ error: 'Execution not found' }, { status: 404 });
    }

    const execution = executions[0];
    const approval = execution.pending_approvals.find(a => a.approval_id === approval_id);

    if (!approval) {
      return Response.json({ error: 'Approval not found' }, { status: 404 });
    }

    if (action === 'approve') {
      // Add approver
      approval.approved_by.push(user.email);

      const allApproved =
        approval.approval_type === 'sequential'
          ? approval.approved_by.includes(approval.required_approvers[approval.approved_by.length])
          : approval.required_approvers.every(a => approval.approved_by.includes(a));

      if (allApproved) {
        // Remove from pending and continue workflow
        const updatedApprovals = execution.pending_approvals.filter(a => a.approval_id !== approval_id);
        
        // Get workflow to find next step
        const workflows = await base44.asServiceRole.entities.WorkflowAutomation.filter({
          id: execution.workflow_id
        });

        const workflow = workflows[0];
        const currentStepIndex = workflow.steps.findIndex(s => s.id === approval.step_id);

        await base44.asServiceRole.entities.WorkflowExecution.update(execution_id, {
          pending_approvals: updatedApprovals,
          steps_completed: [
            ...execution.steps_completed,
            {
              step_id: approval.step_id,
              status: 'completed',
              started_at: approval.created_at,
              completed_at: new Date().toISOString(),
              result: { approved_by: approval.approved_by }
            }
          ]
        });

        // Execute next step
        await base44.functions.invoke('executeWorkflowInstance', {
          workflow_id: execution.workflow_id,
          company_id: execution.company_id,
          execution_id: execution_id,
          step_index: currentStepIndex + 1
        });
      } else {
        // Update execution with partial approval
        await base44.asServiceRole.entities.WorkflowExecution.update(execution_id, {
          pending_approvals: execution.pending_approvals.map(a =>
            a.approval_id === approval_id ? approval : a
          )
        });
      }
    } else if (action === 'reject') {
      // Mark execution as failed
      await base44.asServiceRole.entities.WorkflowExecution.update(execution_id, {
        status: 'cancelled',
        completed_at: new Date().toISOString(),
        error_message: `Genehmigung von ${user.email} abgelehnt`
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Process approval error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});