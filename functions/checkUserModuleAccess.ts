import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { userId, moduleCode } = await req.json();
    
    if (!userId || !moduleCode) {
      return Response.json({ error: "userId and moduleCode required" }, { status: 400 });
    }
    
    // Direkte Modul-Zugriffe
    const directAccess = await base44.asServiceRole.entities.UserModuleAccess.filter({
      user_id: userId,
      module_id: moduleCode,
      access_level: { $ne: 'none' },
      $or: [
        { expires_at: null },
        { expires_at: { $gte: new Date().toISOString() } }
      ]
    });
    
    if (directAccess.length > 0) {
      return Response.json({
        hasAccess: true,
        accessLevel: directAccess[0].access_level,
        grantedVia: directAccess[0].granted_via
      });
    }
    
    // Suite-basierte Zugriffe
    const userSuites = await base44.asServiceRole.entities.UserSuiteSubscription.filter({
      user_id: userId,
      status: 'active'
    });
    
    for (const subscription of userSuites) {
      const suite = await base44.asServiceRole.entities.AppSuite.filter({
        id: subscription.suite_id
      });
      
      if (suite.length > 0 && suite[0].included_modules?.includes(moduleCode)) {
        return Response.json({
          hasAccess: true,
          accessLevel: 'full',
          grantedVia: 'suite_inclusion',
          suiteName: suite[0].name
        });
      }
    }
    
    return Response.json({
      hasAccess: false,
      accessLevel: 'none'
    });
    
  } catch (error) {
    console.error("Check module access error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});