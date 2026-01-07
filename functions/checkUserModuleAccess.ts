import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { module_name } = await req.json();

        if (!module_name) {
            return Response.json({ error: 'module_name is required' }, { status: 400 });
        }

        // Finde das Modul
        const modules = await base44.entities.ModuleDefinition.filter({ name: module_name });
        if (modules.length === 0) {
            return Response.json({ has_access: false, reason: 'module_not_found' });
        }
        const module = modules[0];

        // Prüfe direkten Zugriff
        const access = await base44.entities.UserModuleAccess.filter({
            user_id: user.id,
            module_id: module.id
        });

        if (access.length > 0) {
            const userAccess = access[0];
            
            // Prüfe Ablaufdatum
            if (userAccess.expires_at && new Date(userAccess.expires_at) < new Date()) {
                return Response.json({ 
                    has_access: false, 
                    reason: 'access_expired',
                    expired_at: userAccess.expires_at
                });
            }

            return Response.json({ 
                has_access: userAccess.access_level !== 'none',
                access_level: userAccess.access_level,
                granted_via: userAccess.granted_via
            });
        }

        // Prüfe über Suite-Subscriptions
        const subscriptions = await base44.entities.UserSuiteSubscription.filter({
            user_id: user.id,
            status: 'active'
        });

        for (const sub of subscriptions) {
            const suites = await base44.entities.AppSuite.filter({ id: sub.suite_id });
            if (suites.length > 0) {
                const suite = suites[0];
                if (suite.included_modules && suite.included_modules.includes(module_name)) {
                    return Response.json({ 
                        has_access: true,
                        access_level: 'full',
                        granted_via: 'suite_inclusion',
                        suite_name: suite.display_name
                    });
                }
            }
        }

        return Response.json({ 
            has_access: false,
            reason: 'no_access_granted'
        });

    } catch (error) {
        console.error('Error checking module access:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});