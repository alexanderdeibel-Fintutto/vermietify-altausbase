import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        const { user_id, suite_id, status, trial_days } = await req.json();

        if (!user_id || !suite_id) {
            return Response.json({ 
                error: 'user_id and suite_id are required' 
            }, { status: 400 });
        }

        // Prüfe ob Suite existiert
        const suites = await base44.entities.AppSuite.filter({ id: suite_id });
        if (suites.length === 0) {
            return Response.json({ error: 'Suite not found' }, { status: 404 });
        }
        const suite = suites[0];

        // Prüfe ob User existiert
        const users = await base44.asServiceRole.entities.User.filter({ id: user_id });
        if (users.length === 0) {
            return Response.json({ error: 'User not found' }, { status: 404 });
        }

        // Prüfe ob bereits Subscription existiert
        const existing = await base44.entities.UserSuiteSubscription.filter({
            user_id: user_id,
            suite_id: suite_id
        });

        let subscription;
        const subscriptionData = {
            user_id: user_id,
            suite_id: suite_id,
            status: status || 'active',
            activated_at: new Date().toISOString(),
            auto_renewal: true
        };

        if (trial_days) {
            subscriptionData.status = 'trial';
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + trial_days);
            subscriptionData.trial_expires_at = expiresAt.toISOString();
        }

        if (existing.length > 0) {
            subscription = await base44.entities.UserSuiteSubscription.update(
                existing[0].id,
                subscriptionData
            );
        } else {
            subscription = await base44.entities.UserSuiteSubscription.create(subscriptionData);
        }

        // Erstelle automatisch Modul-Zugriffe für alle enthaltenen Module
        const modulesCreated = [];
        if (suite.included_modules) {
            for (const moduleName of suite.included_modules) {
                const modules = await base44.entities.ModuleDefinition.filter({ name: moduleName });
                if (modules.length > 0) {
                    const module = modules[0];
                    
                    const existingAccess = await base44.entities.UserModuleAccess.filter({
                        user_id: user_id,
                        module_id: module.id
                    });

                    if (existingAccess.length === 0) {
                        await base44.entities.UserModuleAccess.create({
                            user_id: user_id,
                            module_id: module.id,
                            access_level: 'full',
                            granted_via: 'suite_inclusion'
                        });
                        modulesCreated.push(moduleName);
                    }
                }
            }
        }

        return Response.json({
            success: true,
            subscription: subscription,
            modules_granted: modulesCreated.length,
            modules: modulesCreated,
            message: `Suite ${suite.display_name} activated for user`
        });

    } catch (error) {
        console.error('Error activating suite:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});