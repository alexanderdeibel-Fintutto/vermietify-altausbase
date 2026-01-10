import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  // Get all active building management workflows
  const workflows = await base44.asServiceRole.entities.WorkflowAutomation.filter({
    is_active: true,
    category: { $in: ['payment', 'contract', 'maintenance'] }
  });

  const executionResults = [];

  for (const workflow of workflows) {
    try {
      // Check if workflow should run based on trigger
      const shouldRun = await evaluateTrigger(workflow, base44);
      
      if (shouldRun) {
        // Execute workflow actions
        const result = await executeWorkflowActions(workflow, base44);
        
        // Update last run
        await base44.asServiceRole.entities.WorkflowAutomation.update(workflow.id, {
          last_run: new Date().toISOString(),
          run_count: (workflow.run_count || 0) + 1
        });

        executionResults.push({
          workflow_id: workflow.id,
          workflow_name: workflow.name,
          success: true,
          result
        });
      }
    } catch (error) {
      executionResults.push({
        workflow_id: workflow.id,
        workflow_name: workflow.name,
        success: false,
        error: error.message
      });
    }
  }

  return Response.json({ 
    success: true, 
    workflows_executed: executionResults.filter(r => r.success).length,
    total_workflows: workflows.length,
    results: executionResults
  });
});

async function evaluateTrigger(workflow, base44) {
  if (workflow.trigger_type !== 'scheduled') return false;
  
  const config = workflow.trigger_config;
  if (!config?.frequency) return false;

  const lastRun = workflow.last_run ? new Date(workflow.last_run) : null;
  const now = new Date();

  if (!lastRun) return true; // Never run before

  const hoursSinceLastRun = (now - lastRun) / (1000 * 60 * 60);

  switch (config.frequency) {
    case 'daily':
      return hoursSinceLastRun >= 24;
    case 'weekly':
      return hoursSinceLastRun >= 168;
    case 'monthly':
      return hoursSinceLastRun >= 720;
    default:
      return false;
  }
}

async function executeWorkflowActions(workflow, base44) {
  const results = [];

  for (const action of workflow.actions || []) {
    let result;
    
    switch (action.type) {
      case 'rent_reminder':
        result = await base44.asServiceRole.functions.invoke('executeRentReminderWorkflow', {
          workflow_id: workflow.id,
          days_before_due: action.config?.days_before_due || 3
        });
        break;
        
      case 'lease_renewal':
        result = await base44.asServiceRole.functions.invoke('executeLeaseRenewalWorkflow', {
          workflow_id: workflow.id,
          days_before_expiry: action.config?.days_before_expiry || 60
        });
        break;
        
      case 'maintenance_scheduling':
        result = await base44.asServiceRole.functions.invoke('executeMaintenanceSchedulingWorkflow', {
          workflow_id: workflow.id,
          maintenance_type: action.config?.maintenance_type || 'inspection',
          interval_months: action.config?.interval_months || 6,
          building_ids: action.config?.building_ids || []
        });
        break;
        
      case 'vendor_management':
        result = await base44.asServiceRole.functions.invoke('executeVendorManagementWorkflow', {
          workflow_id: workflow.id,
          action_type: action.config?.action_type || 'insurance_reminder',
          days_before_expiry: action.config?.days_before_expiry || 30
        });
        break;
    }
    
    results.push({ action: action.type, result: result?.data });
  }

  return results;
}