import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (user?.role !== 'admin') {
            return Response.json({ error: 'Admin access required' }, { status: 403 });
        }

        // Letzte 30 Tage analysieren
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        const logs = await base44.asServiceRole.entities.AIUsageLog.filter({
            created_date: { $gte: startDate.toISOString() }
        });

        const opportunities = [];

        // Analyse 1: Cache-Ineffizienz
        const featureStats = {};
        logs.forEach(log => {
            if (!featureStats[log.feature]) {
                featureStats[log.feature] = {
                    total_cost: 0,
                    cache_savings: 0,
                    requests: 0
                };
            }
            featureStats[log.feature].total_cost += log.cost_eur;
            featureStats[log.feature].cache_savings += (log.cost_without_cache_eur - log.cost_eur);
            featureStats[log.feature].requests += 1;
        });

        Object.entries(featureStats).forEach(([feature, stats]) => {
            const cacheEfficiency = stats.cache_savings / stats.total_cost;
            if (cacheEfficiency < 0.3 && stats.requests > 20) {
                opportunities.push({
                    opportunity_type: 'cache_optimization',
                    title: `Cache-Optimierung für ${feature}`,
                    description: `Cache-Effizienz nur ${(cacheEfficiency * 100).toFixed(1)}%. Durch bessere Prompt-Strukturierung könnten 30-40% gespart werden.`,
                    current_cost_eur: stats.total_cost,
                    potential_savings_eur: stats.total_cost * 0.35,
                    affected_feature: feature,
                    implementation_effort: 'low',
                    detected_at: new Date().toISOString(),
                    priority_score: 85,
                    status: 'identified'
                });
            }
        });

        // Analyse 2: Teure Einzelnutzer
        const userStats = {};
        logs.forEach(log => {
            if (!userStats[log.user_email]) {
                userStats[log.user_email] = { cost: 0, requests: 0 };
            }
            userStats[log.user_email].cost += log.cost_eur;
            userStats[log.user_email].requests += 1;
        });

        Object.entries(userStats).forEach(([email, stats]) => {
            if (stats.cost > 15) {
                opportunities.push({
                    opportunity_type: 'reduce_frequency',
                    title: `Hohe Nutzung: ${email}`,
                    description: `User hat ${stats.requests} Anfragen mit ${stats.cost.toFixed(2)}€ Kosten. Schulung oder Nutzungslimit empfohlen.`,
                    current_cost_eur: stats.cost,
                    potential_savings_eur: stats.cost * 0.25,
                    affected_users: [email],
                    implementation_effort: 'medium',
                    detected_at: new Date().toISOString(),
                    priority_score: 70,
                    status: 'identified'
                });
            }
        });

        // Analyse 3: Teure Features mit großen Tokens
        Object.entries(featureStats).forEach(([feature, stats]) => {
            const avgCost = stats.total_cost / stats.requests;
            if (avgCost > 0.3) {
                opportunities.push({
                    opportunity_type: 'model_downgrade',
                    title: `Feature ${feature} nutzt teures Modell`,
                    description: `Ø ${avgCost.toFixed(3)}€ pro Anfrage. Kleineres Modell könnte 40% sparen ohne Qualitätsverlust.`,
                    current_cost_eur: stats.total_cost,
                    potential_savings_eur: stats.total_cost * 0.4,
                    affected_feature: feature,
                    implementation_effort: 'low',
                    detected_at: new Date().toISOString(),
                    priority_score: 90,
                    status: 'identified'
                });
            }
        });

        // Top 5 sortieren und speichern
        const top5 = opportunities
            .sort((a, b) => b.priority_score - a.priority_score)
            .slice(0, 5);

        // Speichere neue Opportunities
        for (const opp of top5) {
            const existing = await base44.asServiceRole.entities.AICostSavingOpportunity.filter({
                opportunity_type: opp.opportunity_type,
                affected_feature: opp.affected_feature,
                status: { $in: ['identified', 'in_review', 'approved'] }
            });

            if (existing.length === 0) {
                await base44.asServiceRole.entities.AICostSavingOpportunity.create(opp);
            }
        }

        return Response.json({
            success: true,
            opportunities: top5,
            cost_by_user: userStats,
            cost_by_feature: featureStats
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});