import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Hole alle User
    const allUsers = await base44.asServiceRole.entities.User.list();
    let migrated = 0;
    let skipped = 0;
    const errors = [];

    for (const targetUser of allUsers) {
      try {
        // Check ob User bereits Package Config hat
        const existing = await base44.asServiceRole.entities.UserPackageConfiguration.filter({
          user_id: targetUser.id
        });

        if (existing.length > 0) {
          skipped++;
          continue;
        }

        // Erstelle easyVermieter Config (Full-Access)
        await base44.asServiceRole.entities.UserPackageConfiguration.create({
          user_id: targetUser.id,
          package_type: 'easyVermieter',
          max_buildings: 999,
          max_units: 999,
          additional_modules: ['dokumentation', 'kommunikation', 'aufgaben'],
          valid_from: new Date().toISOString().split('T')[0],
          price_per_month: 39.99,
          is_active: true
        });

        migrated++;
      } catch (error) {
        errors.push({ user_id: targetUser.id, error: error.message });
      }
    }

    return Response.json({
      success: true,
      migrated,
      skipped,
      total: allUsers.length,
      errors: errors.length > 0 ? errors : null
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});