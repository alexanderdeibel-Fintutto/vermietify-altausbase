import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { moduleName } = await req.json();

    if (!moduleName) {
      return Response.json({ error: 'moduleName required' }, { status: 400 });
    }

    // Hole Package Config
    const configs = await base44.asServiceRole.entities.UserPackageConfiguration.filter({
      user_id: user.id,
      is_active: true
    });

    if (configs.length === 0) {
      return Response.json({ 
        hasAccess: false, 
        reason: 'NO_PACKAGE',
        message: 'Keine Paket-Konfiguration gefunden'
      });
    }

    const packageConfig = configs[0];

    // Hole Template
    const templates = await base44.asServiceRole.entities.PackageTemplate.filter({
      package_type: packageConfig.package_type,
      is_active: true
    });

    if (templates.length === 0) {
      return Response.json({ 
        hasAccess: false, 
        reason: 'NO_TEMPLATE',
        message: 'Template nicht gefunden'
      });
    }

    const template = templates[0];

    // Check Access
    const isIncluded = template.included_modules?.includes(moduleName);
    const isAddon = packageConfig.additional_modules?.includes(moduleName);
    const hasAccess = isIncluded || isAddon;

    // Finde Upgrade-Optionen wenn kein Zugriff
    let upgradeOptions = [];
    if (!hasAccess) {
      const allTemplates = await base44.asServiceRole.entities.PackageTemplate.filter({
        is_active: true
      });
      
      upgradeOptions = allTemplates
        .filter(t => t.included_modules?.includes(moduleName))
        .map(t => ({
          package_type: t.package_type,
          package_name: t.package_name,
          base_price: t.base_price
        }));
    }

    return Response.json({
      hasAccess,
      moduleName,
      currentPackage: packageConfig.package_type,
      reason: hasAccess ? 'OK' : 'MODULE_NOT_INCLUDED',
      upgradeOptions,
      canBookAsAddon: template.available_addons?.includes(moduleName)
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});