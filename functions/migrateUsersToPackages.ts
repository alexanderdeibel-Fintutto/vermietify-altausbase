import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin required' }, { status: 403 });
    }

    console.log('[MIGRATION] Starting user migration to easyVermieter package');

    // 1. Hole alle User
    const allUsers = await base44.asServiceRole.entities.User.list();
    console.log(`[MIGRATION] Found ${allUsers.length} users`);

    // 2. Prüfe ob PackageTemplates existieren, sonst erstelle sie
    let templates = await base44.asServiceRole.entities.PackageTemplate.list();
    if (templates.length === 0) {
      console.log('[MIGRATION] Creating package templates');
      
      const packageDefs = [
        {
          package_type: 'easyKonto',
          package_name: 'Easy Konto',
          base_price: 9.99,
          max_buildings: 0,
          max_units: 0,
          included_modules: ['finanzen', 'banking'],
          available_addons: ['dokumentation', 'kommunikation', 'aufgaben']
        },
        {
          package_type: 'easySteuer',
          package_name: 'Easy Steuer',
          base_price: 19.99,
          max_buildings: 0,
          max_units: 0,
          included_modules: ['finanzen', 'banking', 'steuer'],
          available_addons: ['dokumentation', 'kommunikation', 'aufgaben']
        },
        {
          package_type: 'easyHome',
          package_name: 'Easy Home',
          base_price: 29.99,
          max_buildings: 1,
          max_units: 1,
          included_modules: ['finanzen', 'banking', 'steuer', 'objekte', 'eigentuemer'],
          available_addons: ['dokumentation', 'kommunikation', 'aufgaben']
        },
        {
          package_type: 'easyVermieter',
          package_name: 'Easy Vermieter',
          base_price: 39.99,
          max_buildings: 1,
          max_units: 999,
          included_modules: ['finanzen', 'banking', 'steuer', 'objekte', 'eigentuemer', 'mieter', 'vertraege', 'betriebskosten'],
          available_addons: ['dokumentation', 'kommunikation', 'aufgaben']
        },
        {
          package_type: 'easyGewerbe',
          package_name: 'Easy Gewerbe',
          base_price: 49.99,
          max_buildings: 0,
          max_units: 0,
          included_modules: ['finanzen', 'banking', 'steuer', 'erweiterte_features'],
          available_addons: ['dokumentation', 'kommunikation', 'aufgaben']
        }
      ];

      await base44.asServiceRole.entities.PackageTemplate.bulkCreate(packageDefs);
      console.log('[MIGRATION] Package templates created');
    }

    // 3. Erstelle UserPackageConfiguration für jeden User
    let existingConfigs = await base44.asServiceRole.entities.UserPackageConfiguration.list();
    const configuredUserIds = new Set(existingConfigs.map(c => c.user_id));

    const newConfigs = allUsers
      .filter(u => !configuredUserIds.has(u.id))
      .map(u => ({
        user_id: u.id,
        package_type: 'easyVermieter',
        max_buildings: 1,
        max_units: 999,
        additional_modules: [],
        valid_from: new Date().toISOString().split('T')[0],
        price_per_month: 39.99,
        is_active: true
      }));

    if (newConfigs.length > 0) {
      await base44.asServiceRole.entities.UserPackageConfiguration.bulkCreate(newConfigs);
      console.log(`[MIGRATION] Created configurations for ${newConfigs.length} new users`);
    }

    return Response.json({
      success: true,
      total_users: allUsers.length,
      new_configurations: newConfigs.length,
      message: `Migration complete: ${newConfigs.length} users migrated to easyVermieter`
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});