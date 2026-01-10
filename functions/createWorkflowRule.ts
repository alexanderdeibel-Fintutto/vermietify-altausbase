import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { company_id, name, description, trigger_type, conditions, actions } = await req.json();

    const rule = await base44.asServiceRole.entities.DocumentWorkflowRule.create({
      company_id,
      name,
      description,
      trigger_type,
      conditions,
      actions,
      created_by: user.email,
      is_active: true
    });

    return Response.json({ success: true, rule_id: rule.id });
  } catch (error) {
    console.error('Create rule error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});