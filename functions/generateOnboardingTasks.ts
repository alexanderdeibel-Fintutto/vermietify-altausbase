import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { tenant_id, lease_contract_id, workflow_id } = await req.json();

    if (!tenant_id || !lease_contract_id) {
      return Response.json({ error: 'tenant_id and lease_contract_id required' }, { status: 400 });
    }

    // Get workflow (use specified or default)
    let workflow;
    if (workflow_id) {
      const workflows = await base44.asServiceRole.entities.OnboardingWorkflow.filter({ id: workflow_id }, null, 1);
      workflow = workflows[0];
    } else {
      const workflows = await base44.asServiceRole.entities.OnboardingWorkflow.filter({ is_default: true, is_active: true }, null, 1);
      workflow = workflows[0];
    }

    if (!workflow || !workflow.steps?.length) {
      return Response.json({ error: 'No workflow found or workflow has no steps' }, { status: 404 });
    }

    const startDate = new Date();
    const createdTasks = [];

    // Create tasks from workflow steps
    for (const step of workflow.steps) {
      const dueDate = new Date(startDate);
      dueDate.setDate(dueDate.getDate() + (step.due_days_offset || 0));

      const task = {
        tenant_id,
        lease_contract_id,
        title: step.title,
        description: step.description,
        lock_type: step.lock_type || 'custom',
        status: 'pending',
        priority: step.priority || 'medium',
        assigned_to: step.assigned_to,
        due_date: dueDate.toISOString(),
        is_visible_to_tenant: step.is_visible_to_tenant !== false,
        metadata: {
          workflow_id: workflow.id,
          workflow_name: workflow.workflow_name,
          step_id: step.step_id,
          dependencies: step.dependencies || []
        },
        created_at: new Date().toISOString()
      };

      const createdTask = await base44.asServiceRole.entities.TenantAdministrationLock.create(task);
      createdTasks.push(createdTask);

      // Create audit log
      await base44.asServiceRole.entities.OnboardingAuditLog.create({
        tenant_id,
        lock_id: createdTask.id,
        lock_title: step.title,
        action: 'created',
        performed_by: user.email,
        details: `Automatisch erstellt aus Workflow: ${workflow.workflow_name}`,
        created_at: new Date().toISOString()
      });
    }

    return Response.json({
      success: true,
      tasks_created: createdTasks.length,
      workflow_name: workflow.workflow_name,
      tasks: createdTasks
    });

  } catch (error) {
    console.error('Error generating onboarding tasks:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});