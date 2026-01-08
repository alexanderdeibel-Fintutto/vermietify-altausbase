import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }
    
    const { userId, moduleCode, expiresInDays } = await req.json();
    
    if (!userId || !moduleCode) {
      return Response.json({ error: "userId and moduleCode required" }, { status: 400 });
    }
    
    // Prüfen ob bereits vorhanden
    const existing = await base44.asServiceRole.entities.UserModuleAccess.filter({
      user_id: userId,
      module_id: moduleCode
    });
    
    if (existing.length > 0) {
      return Response.json({ error: "Module access already granted" }, { status: 400 });
    }
    
    const expiresAt = expiresInDays 
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
      : null;
    
    await base44.asServiceRole.entities.UserModuleAccess.create({
      user_id: userId,
      module_id: moduleCode,
      access_level: 'full',
      granted_via: 'admin_grant',
      expires_at: expiresAt
    });
    
    return Response.json({
      success: true,
      message: `Module ${moduleCode} granted to user`
    });
    
  } catch (error) {
    console.error("Grant module access error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});