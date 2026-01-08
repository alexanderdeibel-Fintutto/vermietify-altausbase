import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }
    
    console.log("Starting user system migration...");
    
    // 1. Alle User auf is_tester = false setzen (falls Feld nicht existiert)
    const users = await base44.asServiceRole.entities.User.list();
    console.log(`Found ${users.length} users`);
    
    // 2. System-Rollen initialisieren
    console.log("Initializing roles and permissions...");
    await base44.asServiceRole.functions.invoke('initializeRolesAndPermissions', {});
    
    // 3. Admin-Benutzer mit Super-Admin Rolle ausstatten
    const adminUsers = users.filter(u => u.role === 'admin');
    const roles = await base44.asServiceRole.entities.Role.list();
    const superAdminRole = roles.find(r => r.name === 'Super Admin');
    
    if (superAdminRole) {
      for (const admin of adminUsers) {
        const existingAssignment = await base44.asServiceRole.entities.UserRoleAssignment.filter({
          user_id: admin.id,
          role_id: superAdminRole.id
        });
        
        if (existingAssignment.length === 0) {
          await base44.asServiceRole.entities.UserRoleAssignment.create({
            user_id: admin.id,
            role_id: superAdminRole.id,
            building_restrictions: null,
            valid_from: new Date().toISOString().split('T')[0],
            valid_until: null,
            assigned_by: user.id,
            notes: 'Auto-assigned during migration',
            is_active: true
          });
          console.log(`Assigned Super Admin role to ${admin.email}`);
        }
      }
    }
    
    console.log("Migration completed successfully");
    
    return Response.json({
      success: true,
      message: "User system migration completed",
      stats: {
        totalUsers: users.length,
        adminUsers: adminUsers.length,
        rolesCreated: roles.length
      }
    });
    
  } catch (error) {
    console.error("Migration error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});