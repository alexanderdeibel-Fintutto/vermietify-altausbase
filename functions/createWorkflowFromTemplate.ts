import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      company_id,
      template_id,
      workflow_name,
      workflow_description
    } = await req.json();

    // Get template
    const template = await base44.asServiceRole.entities.WorkflowTemplate.read(template_id);

    if (!template) {
      return Response.json({ error: 'Template not found' }, { status: 404 });
    }

    // Create new workflow from template
    const newWorkflow = await base44.asServiceRole.entities.WorkflowAutomation.create({
      company_id,
      name: workflow_name,
      description: workflow_description || template.description,
      trigger: template.workflow_config?.trigger || {},
      steps: template.workflow_config?.steps || [],
      is_active: false
    });

    // Increment template usage
    await base44.asServiceRole.entities.WorkflowTemplate.update(template_id, {
      usage_count: (template.usage_count || 0) + 1
    });

    // Log action
    await base44.functions.invoke('logAuditAction', {
      action_type: 'workflow_created',
      entity_type: 'workflow',
      entity_id: newWorkflow.id,
      user_email: user.email,
      company_id,
      description: `Workflow "${workflow_name}" aus Template "${template.name}" erstellt`,
      metadata: { template_id, workflow_id: newWorkflow.id }
    });

    return Response.json({
      success: true,
      workflow: newWorkflow
    });
  } catch (error) {
    console.error('Create workflow from template error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});