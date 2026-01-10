import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      workflow_id,
      company_id,
      name,
      description,
      trigger,
      steps,
      change_notes,
      activate = false
    } = await req.json();

    // Get the current workflow to determine next version
    const workflows = await base44.asServiceRole.entities.WorkflowVersion.filter({
      workflow_id
    });

    const nextVersion = Math.max(0, ...workflows.map(w => w.version_number)) + 1;

    // Deactivate current active version if activating new one
    if (activate && workflows.length > 0) {
      const activeWorkflow = workflows.find(w => w.is_active);
      if (activeWorkflow) {
        await base44.asServiceRole.entities.WorkflowVersion.update(activeWorkflow.id, {
          is_active: false
        });

        // Log the version change
        await base44.functions.invoke('logAuditAction', {
          action_type: 'workflow_updated',
          entity_type: 'workflow',
          entity_id: workflow_id,
          user_email: user.email,
          company_id,
          description: `Workflow-Version ${activeWorkflow.version_number} deaktiviert`,
          metadata: { version: activeWorkflow.version_number }
        });
      }
    }

    // Create new version
    const newVersion = await base44.asServiceRole.entities.WorkflowVersion.create({
      workflow_id,
      version_number: nextVersion,
      company_id,
      name,
      description,
      trigger,
      steps,
      is_active: activate,
      created_by: user.email,
      change_notes,
      total_executions: 0
    });

    // Log the version creation
    await base44.functions.invoke('logAuditAction', {
      action_type: 'workflow_created',
      entity_type: 'workflow',
      entity_id: workflow_id,
      user_email: user.email,
      company_id,
      description: `Neue Workflow-Version ${nextVersion} erstellt`,
      new_values: {
        version: nextVersion,
        active: activate
      }
    });

    return Response.json({
      success: true,
      version: newVersion
    });
  } catch (error) {
    console.error('Create workflow version error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});