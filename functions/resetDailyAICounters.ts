import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);

    try {
        const user = await base44.auth.me();
        if (user?.role !== 'admin') {
            return Response.json({ error: 'Admin access required' }, { status: 403 });
        }

        const features = await base44.asServiceRole.entities.AIFeatureConfig.list();

        for (const feature of features) {
            await base44.asServiceRole.entities.AIFeatureConfig.update(feature.id, {
                requests_today: 0
            });
        }

        return Response.json({
            success: true,
            message: `${features.length} Feature-Zähler zurückgesetzt`,
            resetCount: features.length
        });

    } catch (error) {
        console.error('Reset counters error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});