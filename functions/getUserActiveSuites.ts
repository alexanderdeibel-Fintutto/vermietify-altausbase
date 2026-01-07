import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Hole alle aktiven Subscriptions des Users
        const subscriptions = await base44.entities.UserSuiteSubscription.filter({
            user_id: user.id,
            status: 'active'
        });

        // Hole die Suite-Details
        const suites = [];
        for (const sub of subscriptions) {
            const suiteData = await base44.entities.AppSuite.filter({ id: sub.suite_id });
            if (suiteData.length > 0 && suiteData[0].active) {
                suites.push({
                    ...suiteData[0],
                    subscription: sub
                });
            }
        }

        // Hole alle Module die der User hat
        const moduleAccess = await base44.entities.UserModuleAccess.filter({
            user_id: user.id
        });

        // Filtere aktive Zugriffe (nicht abgelaufen)
        const activeModuleAccess = moduleAccess.filter(access => {
            if (!access.expires_at) return true;
            return new Date(access.expires_at) > new Date();
        });

        // Hole Modul-Details
        const modules = [];
        for (const access of activeModuleAccess) {
            const moduleData = await base44.entities.ModuleDefinition.filter({ id: access.module_id });
            if (moduleData.length > 0) {
                modules.push({
                    ...moduleData[0],
                    access: access
                });
            }
        }

        return Response.json({
            suites: suites,
            modules: modules,
            total_suites: suites.length,
            total_modules: modules.length
        });

    } catch (error) {
        console.error('Error getting user suites:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});