import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Hole Package Config
    const configs = await base44.entities.UserPackageConfiguration.filter({
      user_id: user.id,
      is_active: true
    });

    if (configs.length === 0) {
      return Response.json({ 
        allowed: false, 
        reason: 'NO_PACKAGE',
        message: 'Keine Paket-Konfiguration gefunden'
      });
    }

    const packageConfig = configs[0];

    // Zähle aktuelle Units
    const units = await base44.entities.Unit.filter({});
    const currentCount = units.length;

    // Prüfe Limit
    const canCreate = currentCount < packageConfig.max_units;

    return Response.json({
      allowed: canCreate,
      currentCount,
      limit: packageConfig.max_units,
      package: packageConfig.package_type,
      message: canCreate 
        ? 'Wohneinheit kann erstellt werden' 
        : `Limit erreicht: ${currentCount}/${packageConfig.max_units}`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});