import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        const { user_id, module_id, access_level, expires_at } = await req.json();

        if (!user_id || !module_id || !access_level) {
            return Response.json({ 
                error: 'user_id, module_id, and access_level are required' 
            }, { status: 400 });
        }

        // Prüfe ob User und Modul existieren
        const targetUser = await base44.asServiceRole.entities.User.filter({ id: user_id });
        if (targetUser.length === 0) {
            return Response.json({ error: 'User not found' }, { status: 404 });
        }

        const module = await base44.entities.ModuleDefinition.filter({ id: module_id });
        if (module.length === 0) {
            return Response.json({ error: 'Module not found' }, { status: 404 });
        }

        // Prüfe ob bereits Zugriff existiert
        const existing = await base44.entities.UserModuleAccess.filter({
            user_id: user_id,
            module_id: module_id
        });

        let result;
        if (existing.length > 0) {
            // Update
            result = await base44.entities.UserModuleAccess.update(existing[0].id, {
                access_level: access_level,
                granted_via: 'admin_grant',
                expires_at: expires_at || null
            });
        } else {
            // Create
            result = await base44.entities.UserModuleAccess.create({
                user_id: user_id,
                module_id: module_id,
                access_level: access_level,
                granted_via: 'admin_grant',
                expires_at: expires_at || null
            });
        }

        return Response.json({
            success: true,
            access: result,
            message: `Module access granted to user`
        });

    } catch (error) {
        console.error('Error granting module access:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});