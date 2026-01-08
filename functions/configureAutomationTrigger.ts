import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { trigger_id, enabled } = await req.json();

    // Speichere Trigger-Konfiguration
    const currentConfig = user.elster_automation_config || {};
    currentConfig[trigger_id] = {
      enabled,
      updated_at: new Date().toISOString(),
      updated_by: user.id
    };

    await base44.auth.updateMe({
      elster_automation_config: currentConfig
    });

    // In Realität würde man hier Scheduled Tasks erstellen/löschen
    // Für jetzt nur die Konfiguration speichern

    return Response.json({
      success: true,
      message: enabled 
        ? `Trigger "${trigger_id}" aktiviert` 
        : `Trigger "${trigger_id}" deaktiviert`,
      config: currentConfig[trigger_id]
    });

  } catch (error) {
    console.error('Configure Automation Trigger Error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});