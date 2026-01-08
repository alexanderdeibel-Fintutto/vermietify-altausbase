import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workflow_name, trigger_type, actions, conditions } = await req.json();

    if (!workflow_name || !trigger_type || !actions) {
      return Response.json({ 
        error: 'workflow_name, trigger_type and actions required' 
      }, { status: 400 });
    }

    console.log(`[WORKFLOW] Creating ${workflow_name}`);

    const workflow = await base44.asServiceRole.entities.Workflow.create({
      name: workflow_name,
      category: 'elster',
      trigger_type,
      trigger_config: conditions || {},
      steps: actions.map((action, idx) => ({
        step_order: idx + 1,
        action_type: action.type,
        config: action.config,
        name: action.name
      })),
      is_active: true,
      created_by: user.email
    });

    console.log(`[WORKFLOW] Created ${workflow.id}`);

    return Response.json({
      success: true,
      workflow_id: workflow.id
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});