import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { rule_name, trigger_type, action_type, trigger_condition, schedule } = await req.json();

    if (!rule_name || !trigger_type || !action_type) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const automation = await base44.entities.AutomationConfig.create({
      user_id: user.id,
      automation_type: action_type,
      is_enabled: true,
      schedule: schedule || 'daily',
      configuration: {
        rule_name,
        trigger_type,
        trigger_condition,
        created_at: new Date().toISOString()
      }
    });

    return Response.json({
      success: true,
      automation_id: automation.id,
      message: 'Automation rule created successfully'
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});