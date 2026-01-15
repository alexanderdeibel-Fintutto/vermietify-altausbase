import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    const { userEmail, limitType } = await req.json();

    try {
        // Nutzer-Subscription laden
        const subscription = await base44.entities.UserSubscription.filter({
            user_email: userEmail,
            status: { $in: ['ACTIVE', 'TRIAL'] }
        });

        if (!subscription || subscription.length === 0) {
            return new Response(JSON.stringify({
                allowed: false,
                reason: 'NO_SUBSCRIPTION',
                message: 'Bitte wähle einen Tarif'
            }), { status: 200 });
        }

        const sub = subscription[0];
        const plan = await base44.entities.SubscriptionPlan.get(sub.plan_id);

        let currentCount = 0;
        let limit = 0;

        // Aktuelle Nutzung zählen
        if (limitType === 'BUILDINGS') {
            const buildings = await base44.entities.Building.filter({
                created_by: userEmail
            });
            currentCount = buildings.length;
            limit = plan.max_buildings;
        } else if (limitType === 'UNITS') {
            const units = await base44.entities.Unit.filter({
                created_by: userEmail
            });
            currentCount = units.length;
            limit = plan.max_units;
        }

        // -1 = unbegrenzt
        if (limit === -1) {
            return new Response(JSON.stringify({
                allowed: true,
                current: currentCount,
                limit: 'unbegrenzt'
            }), { status: 200 });
        }

        if (currentCount >= limit) {
            return new Response(JSON.stringify({
                allowed: false,
                reason: 'LIMIT_REACHED',
                current: currentCount,
                limit: limit,
                message: `Du hast das Maximum von ${limit} ${limitType === 'BUILDINGS' ? 'Gebäuden' : 'Einheiten'} erreicht`,
                upgrade_cta: true
            }), { status: 200 });
        }

        return new Response(JSON.stringify({
            allowed: true,
            current: currentCount,
            limit: limit
        }), { status: 200 });

    } catch (error) {
        console.error('Error in checkLimitAccess:', error);
        return new Response(JSON.stringify({
            allowed: false,
            reason: 'ERROR',
            message: error.message
        }), { status: 500 });
    }
});