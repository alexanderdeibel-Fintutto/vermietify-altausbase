import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { enabled, schedule = 'daily' } = await req.json();

    // Speichere Auto-Sync Konfiguration in User-Einstellungen
    // (In Realität würde man hier einen Scheduled Task erstellen/löschen)
    
    await base44.auth.updateMe({
      elster_auto_sync_enabled: enabled,
      elster_auto_sync_schedule: schedule,
      elster_auto_sync_updated: new Date().toISOString()
    });

    return Response.json({
      success: true,
      message: enabled 
        ? `Auto-Sync aktiviert (${schedule})` 
        : 'Auto-Sync deaktiviert',
      config: {
        enabled,
        schedule
      }
    });

  } catch (error) {
    console.error('Configure Auto Sync Error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});