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
      workflow_id,
      template_name,
      template_description,
      category,
      tags,
      difficulty,
      is_public
    } = await req.json();

    // Get workflow
    const workflow = await base44.asServiceRole.entities.WorkflowAutomation.read(workflow_id);

    if (!workflow) {
      return Response.json({ error: 'Workflow not found' }, { status: 404 });
    }

    // Create template
    const template = await base44.asServiceRole.entities.WorkflowTemplate.create({
      company_id,
      name: template_name,
      description: template_description,
      category,
      tags: tags || [],
      workflow_config: {
        trigger: workflow.trigger,
        steps: workflow.steps,
        name: workflow.name,
        description: workflow.description
      },
      difficulty: difficulty || 'intermediate',
      is_public: is_public || false,
      created_by: user.email,
      usage_count: 0,
      icon: 'workflow',
      color: '#3b82f6'
    });

    // Log audit
    await base44.asServiceRole.entities.AuditLog.create({
      action_type: 'document_created',
      entity_type: 'workflow',
      entity_id: template.id,
      user_email: user.email,
      company_id,
      description: `Saved workflow "${template_name}" as template`,
      metadata: { workflow_id, template_id: template.id }
    });

    return Response.json({
      success: true,
      template
    });
  } catch (error) {
    console.error('Save workflow as template error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});