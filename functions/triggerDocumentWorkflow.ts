import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { trigger_type, trigger_data } = await req.json();

    // Get all active workflows matching trigger
    const workflows = await base44.asServiceRole.entities.DocumentWorkflow.filter({
      trigger_type,
      is_active: true,
      company_id: trigger_data.company_id
    });

    const results = [];

    for (const workflow of workflows) {
      // Check conditions
      const conditionsMatch = checkConditions(workflow.conditions, trigger_data);
      if (!conditionsMatch) continue;

      // Create execution record
      const execution = await base44.asServiceRole.entities.WorkflowExecution.create({
        workflow_id: workflow.id,
        trigger_event: trigger_data,
        status: 'running',
        started_at: new Date().toISOString(),
        actions_executed: []
      });

      const actionsExecuted = [];

      // Execute actions in order
      try {
        for (const action of workflow.actions.sort((a, b) => a.order - b.order)) {
          const actionResult = await executeAction(base44, action, trigger_data);
          actionsExecuted.push({
            action_type: action.action_type,
            status: actionResult.success ? 'completed' : 'failed',
            result: actionResult.data,
            error: actionResult.error,
            executed_at: new Date().toISOString()
          });
        }

        // Update execution
        await base44.asServiceRole.entities.WorkflowExecution.update(execution.id, {
          status: 'completed',
          actions_executed: actionsExecuted,
          completed_at: new Date().toISOString()
        });

        // Update workflow stats
        await base44.asServiceRole.entities.DocumentWorkflow.update(workflow.id, {
          execution_count: (workflow.execution_count || 0) + 1,
          last_executed: new Date().toISOString()
        });

        results.push({ workflow_id: workflow.id, success: true });
      } catch (error) {
        await base44.asServiceRole.entities.WorkflowExecution.update(execution.id, {
          status: 'failed',
          actions_executed: actionsExecuted,
          error_message: error.message,
          completed_at: new Date().toISOString()
        });
        results.push({ workflow_id: workflow.id, success: false, error: error.message });
      }
    }

    return Response.json({ success: true, triggered_workflows: results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function checkConditions(conditions, triggerData) {
  if (!conditions) return true;

  if (conditions.document_type && triggerData.document_type !== conditions.document_type) {
    return false;
  }

  if (conditions.legal_form && triggerData.legal_form !== conditions.legal_form) {
    return false;
  }

  if (conditions.company_id_match && triggerData.company_id !== conditions.company_id) {
    return false;
  }

  return true;
}

async function executeAction(base44, action, triggerData) {
  try {
    switch (action.action_type) {
      case 'send_signature_request': {
        const params = action.parameters;
        const signatureRequest = await base44.asServiceRole.entities.SignatureRequest.create({
          document_id: triggerData.document_id,
          document_name: triggerData.document_name,
          company_id: triggerData.company_id,
          initiator_email: params.initiator_email,
          initiator_name: params.initiator_name,
          signers: params.signers || [],
          status: 'sent',
          message: params.message,
          signing_order: params.signing_order || 'parallel',
          audit_trail: [{
            action: 'auto_created_by_workflow',
            actor: 'system',
            timestamp: new Date().toISOString(),
            details: 'Automatisch durch Workflow erstellt'
          }]
        });
        return { success: true, data: { signature_request_id: signatureRequest.id } };
      }

      case 'send_notification': {
        const params = action.parameters;
        // Send via Slack if configured
        try {
          const accessToken = await base44.asServiceRole.connectors.getAccessToken('slack');
          await fetch('https://slack.com/api/chat.postMessage', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              channel: params.channel,
              text: params.message
            })
          });
        } catch (e) {
          console.log('Slack notification optional');
        }
        return { success: true, data: { notification_sent: true } };
      }

      case 'create_task': {
        const params = action.parameters;
        const task = await base44.asServiceRole.entities.BuildingTask.create({
          building_id: triggerData.company_id,
          task_title: params.title,
          description: params.description || '',
          task_type: params.task_type || 'administrative',
          priority: params.priority || 'medium',
          status: 'open',
          ai_generated: true
        });
        return { success: true, data: { task_id: task.id } };
      }

      case 'archive_document': {
        const archive = await base44.asServiceRole.entities.DocumentArchive.create({
          document_id: triggerData.document_id,
          company_id: triggerData.company_id,
          document_name: triggerData.document_name,
          document_url: triggerData.document_url,
          archived_date: new Date().toISOString(),
          archived_by: 'system',
          archive_reason: action.parameters.reason || 'workflow_automated',
          archive_notes: action.parameters.notes
        });
        return { success: true, data: { archive_id: archive.id } };
      }

      default:
        return { success: false, error: `Unknown action type: ${action.action_type}` };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}