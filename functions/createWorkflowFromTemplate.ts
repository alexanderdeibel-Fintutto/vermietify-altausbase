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

    // Create workflow from template
    const workflowConfig = template.workflow_config || {};
    const workflow = await base44.asServiceRole.entities.WorkflowAutomation.create({
      company_id,
      name: workflow_name,
      description: workflow_description,
      trigger: workflowConfig.trigger,
      steps: workflowConfig.steps,
      is_active: false,
      execution_count: 0,
      created_by: user.email
    });

    // Increment template usage
    await base44.asServiceRole.entities.WorkflowTemplate.update(template_id, {
      usage_count: (template.usage_count || 0) + 1
    });

    // Log audit
    await base44.asServiceRole.entities.AuditLog.create({
      action_type: 'workflow_created',
      entity_type: 'workflow',
      entity_id: workflow.id,
      user_email: user.email,
      company_id,
      description: `Created workflow from template "${template.name}"`,
      metadata: { template_id, workflow_id: workflow.id }
    });

    return Response.json({
      success: true,
      workflow
    });
  } catch (error) {
    console.error('Create workflow from template error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});