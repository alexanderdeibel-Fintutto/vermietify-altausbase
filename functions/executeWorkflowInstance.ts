import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workflow_id, company_id, variables = {} } = await req.json();

    // Get workflow
    const workflows = await base44.asServiceRole.entities.WorkflowAutomation.filter({
      id: workflow_id
    });

    if (workflows.length === 0) {
      return Response.json({ error: 'Workflow not found' }, { status: 404 });
    }

    const workflow = workflows[0];

    // Create execution instance
    const execution = await base44.asServiceRole.entities.WorkflowExecution.create({
      workflow_id: workflow_id,
      company_id: company_id,
      status: 'running',
      started_by: user.email,
      started_at: new Date().toISOString(),
      current_step_id: workflow.steps[0]?.id,
      steps_completed: [],
      pending_approvals: [],
      variables: variables
    });

    // Execute first step asynchronously
    executeStep(base44, workflow, execution, 0);

    return Response.json({
      success: true,
      execution: {
        id: execution.id,
        workflow_id: execution.workflow_id,
        status: execution.status,
        started_at: execution.started_at
      }
    });
  } catch (error) {
    console.error('Execute workflow error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function executeStep(base44, workflow, execution, stepIndex) {
  try {
    const step = workflow.steps[stepIndex];
    if (!step) {
      // Mark execution as completed
      await base44.asServiceRole.entities.WorkflowExecution.update(execution.id, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        current_step_id: null
      });
      return;
    }

    const stepStartTime = new Date();

    if (step.type === 'approval') {
      // Handle approval step
      const approval = {
        approval_id: `approval-${Date.now()}`,
        step_id: step.id,
        required_approvers: step.approval_config.approvers,
        approved_by: [],
        approval_type: step.approval_config.approval_type,
        created_at: stepStartTime.toISOString(),
        expires_at: new Date(stepStartTime.getTime() + step.approval_config.timeout_days * 86400000).toISOString()
      };

      await base44.asServiceRole.entities.WorkflowExecution.update(execution.id, {
        current_step_id: step.id,
        pending_approvals: [...execution.pending_approvals, approval]
      });

      // Send approval notifications
      for (const approver of step.approval_config.approvers) {
        await base44.functions.invoke('sendApprovalNotification', {
          approver_email: approver,
          execution_id: execution.id,
          approval_id: approval.approval_id,
          workflow_name: workflow.name
        });
      }
    } else if (step.type === 'action') {
      // Handle action step
      const result = await executeAction(base44, step, execution);

      execution.steps_completed.push({
        step_id: step.id,
        status: 'completed',
        started_at: stepStartTime.toISOString(),
        completed_at: new Date().toISOString(),
        result: result
      });

      // Execute next step
      await base44.asServiceRole.entities.WorkflowExecution.update(execution.id, {
        steps_completed: execution.steps_completed,
        current_step_id: workflow.steps[stepIndex + 1]?.id || null
      });

      executeStep(base44, workflow, execution, stepIndex + 1);
    }
  } catch (error) {
    console.error('Step execution error:', error);
    await base44.asServiceRole.entities.WorkflowExecution.update(execution.id, {
      status: 'failed',
      error_message: error.message,
      completed_at: new Date().toISOString()
    });
  }
}

async function executeAction(base44, step, execution) {
  const actionType = step.action_type;

  switch (actionType) {
    case 'create_task':
      return await base44.asServiceRole.entities.DocumentTask.create({
        document_id: execution.variables.document_id,
        company_id: execution.company_id,
        title: step.parameters.title || 'Automatische Aufgabe',
        description: step.parameters.description || '',
        task_type: step.parameters.task_type || 'action',
        assigned_to: step.parameters.assigned_to,
        priority: step.parameters.priority || 'medium'
      });

    case 'send_notification':
      return { notification_sent: true };

    case 'add_tag':
      return { tag_added: step.parameters.tag };

    case 'archive_document':
      return { archived: true };

    default:
      return { executed: true };
  }
}