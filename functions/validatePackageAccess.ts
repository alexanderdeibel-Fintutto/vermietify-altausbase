import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { moduleName, action } = await req.json();

    // Hole User's Package Config
    const configs = await base44.entities.UserPackageConfiguration.filter({
      user_id: user.id,
      is_active: true
    });

    if (configs.length === 0) {
      return Response.json({ 
        hasAccess: false, 
        reason: 'NO_PACKAGE_CONFIG',
        message: 'Keine aktive Paket-Konfiguration gefunden'
      });
    }

    const packageConfig = configs[0];

    // Hole Package Template
    const templates = await base44.asServiceRole.entities.PackageTemplate.filter({
      package_type: packageConfig.package_type,
      is_active: true
    });

    if (templates.length === 0) {
      return Response.json({ 
        hasAccess: false, 
        reason: 'NO_TEMPLATE',
        message: 'Paket-Template nicht gefunden'
      });
    }

    const template = templates[0];
    const includedModules = template.included_modules || [];
    const additionalModules = packageConfig.additional_modules || [];
    
    const hasAccess = includedModules.includes(moduleName) || additionalModules.includes(moduleName);

    // Wenn kein Zugriff: Gebe Upgrade-Optionen zurück
    let upgradeSuggestions = [];
    if (!hasAccess) {
      const allTemplates = await base44.asServiceRole.entities.PackageTemplate.filter({ is_active: true });
      upgradeSuggestions = allTemplates
        .filter(t => t.included_modules?.includes(moduleName))
        .map(t => ({
          package_name: t.package_name,
          package_type: t.package_type,
          price: t.base_price,
          description: t.description
        }));
    }

    return Response.json({
      hasAccess,
      currentPackage: packageConfig.package_type,
      moduleName,
      upgradeSuggestions,
      message: hasAccess ? 'Zugriff gewährt' : 'Upgrade erforderlich'
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});