import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { building_id, form_type, schedule_config } = await req.json();

    console.log(`[SCHEDULE] Setting up automation for ${form_type}`);

    // Erstelle Automatisierungs-Regel
    const automation = await base44.asServiceRole.entities.Automation.create({
      name: `Auto-${form_type} für ${building_id || 'alle Gebäude'}`,
      trigger_type: 'scheduled',
      trigger_config: schedule_config,
      action_type: 'generate_elster_form',
      action_config: {
        building_id,
        form_type,
        auto_validate: true,
        auto_submit: false
      },
      is_active: true,
      created_by: user.email
    });

    console.log(`[SCHEDULE] Created automation ${automation.id}`);

    return Response.json({
      success: true,
      automation_id: automation.id,
      message: 'Automatisierung eingerichtet'
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});