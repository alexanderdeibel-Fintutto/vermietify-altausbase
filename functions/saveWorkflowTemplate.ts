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
      name,
      description,
      category,
      tags = [],
      workflow_id,
      icon = 'Zap',
      color = '#3b82f6',
      difficulty = 'intermediate'
    } = await req.json();

    // Get workflow to extract configuration
    let workflowConfig = {};
    if (workflow_id) {
      const workflow = await base44.asServiceRole.entities.WorkflowAutomation.read(workflow_id);
      if (workflow) {
        workflowConfig = {
          trigger: workflow.trigger,
          steps: workflow.steps,
          description: workflow.description
        };
      }
    }

    // Create template
    const template = await base44.asServiceRole.entities.WorkflowTemplate.create({
      company_id,
      name,
      description,
      category: category || 'general',
      tags,
      workflow_config: workflowConfig,
      icon,
      color,
      difficulty,
      created_by: user.email
    });

    // Log action
    await base44.functions.invoke('logAuditAction', {
      action_type: 'workflow_created',
      entity_type: 'workflow',
      entity_id: template.id,
      user_email: user.email,
      company_id,
      description: `Workflow-Template "${name}" erstellt`,
      metadata: { template_id: template.id, category, tags }
    });

    return Response.json({
      success: true,
      template
    });
  } catch (error) {
    console.error('Save workflow template error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});