import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { module_name, action = 'access' } = await req.json();

    console.log(`[VALIDATION] Checking access for user ${user.id} to module ${module_name}`);

    // 1. Hole User's Package Configuration
    const configs = await base44.entities.UserPackageConfiguration.filter({
      user_id: user.id,
      is_active: true
    });

    if (configs.length === 0) {
      return Response.json({
        allowed: false,
        reason: 'NO_PACKAGE_CONFIG',
        message: 'Keine Paket-Konfiguration gefunden'
      });
    }

    const config = configs[0];

    // 2. Hole Package Template für Validierung
    const templates = await base44.asServiceRole.entities.PackageTemplate.filter({
      package_type: config.package_type,
      is_active: true
    });

    if (templates.length === 0) {
      return Response.json({
        allowed: false,
        reason: 'INVALID_PACKAGE',
        message: 'Paket-Definition nicht gefunden'
      });
    }

    const template = templates[0];

    // 3. Prüfe ob Modul im Paket enthalten ist
    const isIncluded = template.included_modules.includes(module_name);
    const isAddon = config.additional_modules.includes(module_name);

    const allowed = isIncluded || isAddon;

    return Response.json({
      allowed,
      package_type: config.package_type,
      module_name,
      is_included: isIncluded,
      is_addon: isAddon,
      reason: allowed ? 'ALLOWED' : 'NOT_IN_PACKAGE',
      upgrade_suggestion: !allowed ? {
        module: module_name,
        addon_price: 10 + Math.random() * 20 // Placeholder
      } : null
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});