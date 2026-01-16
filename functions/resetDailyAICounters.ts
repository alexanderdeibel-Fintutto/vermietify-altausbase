import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (user?.role !== 'admin') {
            return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        const features = await base44.asServiceRole.entities.AIFeatureConfig.list();
        const today = new Date().toISOString().split('T')[0];

        let resetCount = 0;
        for (const feature of features) {
            if (feature.last_reset_date !== today) {
                await base44.asServiceRole.entities.AIFeatureConfig.update(feature.id, {
                    requests_today: 0,
                    last_reset_date: today
                });
                resetCount++;
            }
        }

        return Response.json({
            success: true,
            message: `${resetCount} Features zurückgesetzt`
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});