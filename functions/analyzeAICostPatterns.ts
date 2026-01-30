import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (user?.role !== 'admin') {
            return Response.json({ error: 'Admin access required' }, { status: 403 });
        }

        const { days = 30 } = await req.json();
        
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        
        const logs = await base44.asServiceRole.entities.AIUsageLog.filter({
            created_date: { $gte: startDate.toISOString() }
        });

        // Kosten pro User
        const costByUser = {};
        const costByFeature = {};
        const usagePatterns = {};

        logs.forEach(log => {
            // Pro User
            if (!costByUser[log.user_email]) {
                costByUser[log.user_email] = {
                    total_cost: 0,
                    total_requests: 0,
                    total_tokens: 0,
                    features_used: new Set()
                };
            }
            costByUser[log.user_email].total_cost += log.cost_eur;
            costByUser[log.user_email].total_requests += 1;
            costByUser[log.user_email].total_tokens += log.input_tokens + log.output_tokens;
            costByUser[log.user_email].features_used.add(log.feature);

            // Pro Feature
            if (!costByFeature[log.feature]) {
                costByFeature[log.feature] = {
                    total_cost: 0,
                    total_requests: 0,
                    avg_cost_per_request: 0,
                    cache_savings: 0
                };
            }
            costByFeature[log.feature].total_cost += log.cost_eur;
            costByFeature[log.feature].total_requests += 1;
            costByFeature[log.feature].cache_savings += (log.cost_without_cache_eur - log.cost_eur);

            // Nutzungsmuster
            const hour = new Date(log.created_date).getHours();
            if (!usagePatterns[hour]) usagePatterns[hour] = 0;
            usagePatterns[hour] += 1;
        });

        // Konvertiere Sets zu Arrays
        Object.keys(costByUser).forEach(email => {
            costByUser[email].features_used = Array.from(costByUser[email].features_used);
        });

        // Berechne avg_cost_per_request
        Object.keys(costByFeature).forEach(feature => {
            costByFeature[feature].avg_cost_per_request = 
                costByFeature[feature].total_cost / costByFeature[feature].total_requests;
        });

        // Top Einsparpotenziale identifizieren
        const opportunities = [];

        // 1. Cache-Optimierung
        Object.entries(costByFeature).forEach(([feature, stats]) => {
            if (stats.cache_savings < stats.total_cost * 0.5 && stats.total_requests > 10) {
                opportunities.push({
                    opportunity_type: 'cache_optimization',
                    title: `Cache-Optimierung für ${feature}`,
                    description: `Feature nutzt Caching nicht optimal. Aktuell nur ${((stats.cache_savings / stats.total_cost) * 100).toFixed(1)}% Cache-Ersparnis.`,
                    current_cost_eur: stats.total_cost,
                    potential_savings_eur: stats.total_cost * 0.3,
                    affected_feature: feature,
                    implementation_effort: 'low',
                    priority_score: 80
                });
            }
        });

        // 2. Teure User
        Object.entries(costByUser).forEach(([email, stats]) => {
            if (stats.total_cost > 10) {
                opportunities.push({
                    opportunity_type: 'reduce_frequency',
                    title: `Hohe Nutzung durch ${email}`,
                    description: `User hat ${stats.total_requests} Anfragen mit ${stats.total_cost.toFixed(2)}€ Kosten. Ggf. Schulung oder Limit sinnvoll.`,
                    current_cost_eur: stats.total_cost,
                    potential_savings_eur: stats.total_cost * 0.2,
                    affected_users: [email],
                    implementation_effort: 'medium',
                    priority_score: 70
                });
            }
        });

        // 3. Ineffiziente Features
        Object.entries(costByFeature).forEach(([feature, stats]) => {
            if (stats.avg_cost_per_request > 0.5) {
                opportunities.push({
                    opportunity_type: 'model_downgrade',
                    title: `Feature ${feature} sehr teuer`,
                    description: `Durchschnittlich ${stats.avg_cost_per_request.toFixed(3)}€ pro Anfrage. Prüfe ob kleineres Modell ausreicht.`,
                    current_cost_eur: stats.total_cost,
                    potential_savings_eur: stats.total_cost * 0.4,
                    affected_feature: feature,
                    implementation_effort: 'low',
                    priority_score: 85
                });
            }
        });

        // Top 5 sortieren
        const top5Opportunities = opportunities
            .sort((a, b) => b.priority_score - a.priority_score)
            .slice(0, 5);

        return Response.json({
            success: true,
            cost_by_user: costByUser,
            cost_by_feature: costByFeature,
            usage_patterns: usagePatterns,
            top_opportunities: top5Opportunities,
            total_cost: logs.reduce((sum, l) => sum + l.cost_eur, 0),
            total_requests: logs.length,
            date_range: { start: startDate.toISOString(), end: new Date().toISOString() }
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});