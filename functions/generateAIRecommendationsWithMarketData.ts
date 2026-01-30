import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Generiert AI-Empfehlungen basierend auf aktuellen Markttrends
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { building_id, focus_area } = await req.json();

        // Hole aktuelle Markttrends
        const marketTrends = await base44.asServiceRole.entities.MarketTrend.list();
        
        if (!marketTrends || marketTrends.length === 0) {
            return Response.json({ 
                error: 'No market trends available',
                success: false
            }, { status: 400 });
        }

        // Filter für relevante Trends
        const relevantTrends = marketTrends.filter(t => 
            !focus_area || t.impact_areas?.includes(focus_area)
        );

        // Baue Kontext aus Marktdaten
        const marketContext = relevantTrends
            .map(t => `${t.trend_type}: ${t.current_value}${t.unit} (${t.trend_direction}, ${t.change_percent}% Änderung). Quelle: ${t.source_name}`)
            .join('\n');

        // Rufe AI-Funktion auf (ähnlich wie AIProactiveRecommendation generator)
        const { data: aiResponse } = await base44.asServiceRole.functions.invoke('aiCoreService', {
            action: 'recommendation',
            prompt: `Basierend auf folgenden aktuellen Markttrends, generiere konkrete, datengetriebene Empfehlungen für eine Immobilie in Deutschland:

${marketContext}

Gib 3-5 konkrete Handlungsempfehlungen mit:
1. Titel
2. Begründung basierend auf den Marktdaten
3. Geschätztes Sparpotenzial in Euro oder Prozent
4. Umsetzungsaufwand (minimal/niedrig/mittel/hoch)
5. Quellen der verwendeten Marktdaten

Antworte als JSON-Array mit den Empfehlungen.`,
            featureKey: 'recommendation'
        });

        // Parse AI-Antwort
        let recommendations = [];
        try {
            const responseText = aiResponse.content || aiResponse;
            const jsonMatch = responseText.match(/\[[\s\S]*\]/);
            recommendations = JSON.parse(jsonMatch[0]);
        } catch (e) {
            console.error('Failed to parse AI recommendations:', e);
            recommendations = [{
                title: 'Markttrends beobachten',
                description: 'Die aktuellen Markttrends deuten auf steigende Energiekosten hin',
                potential_savings_eur: 0,
                implementation_effort: 'minimal'
            }];
        }

        // Speichere Empfehlungen mit Markttrend-Referenzen
        const savedRecommendations = [];
        for (const rec of recommendations) {
            const saved = await base44.asServiceRole.entities.AIProactiveRecommendation.create({
                recommendation_type: 'cost_optimization',
                title: rec.title,
                description: rec.description,
                potential_savings_eur: rec.potential_savings_eur || 0,
                implementation_effort: rec.implementation_effort,
                priority_score: calculatePriorityScore(rec, relevantTrends),
                target_entity_type: 'Building',
                target_entity_id: building_id,
                data_sources: relevantTrends.map(t => t.source_name),
                market_trends_ids: relevantTrends.map(t => t.id),
                trend_analysis: marketContext,
                status: 'new',
                ai_confidence: 85
            }).catch(() => null);
            
            if (saved) savedRecommendations.push(saved);
        }

        return Response.json({
            success: true,
            recommendations: savedRecommendations,
            market_trends_used: relevantTrends.map(t => ({
                type: t.trend_type,
                current_value: t.current_value,
                unit: t.unit,
                source: t.source_name,
                source_url: t.source_url
            }))
        });

    } catch (error) {
        console.error('Recommendation generation failed:', error);
        return Response.json({ 
            error: error.message,
            success: false
        }, { status: 500 });
    }
});

function calculatePriorityScore(recommendation, trends) {
    let score = 50;
    
    // Höher wenn hohes Sparpotenzial
    if (recommendation.potential_savings_eur > 5000) score += 25;
    else if (recommendation.potential_savings_eur > 1000) score += 15;
    
    // Höher wenn niedriger Aufwand
    if (recommendation.implementation_effort === 'minimal') score += 20;
    else if (recommendation.implementation_effort === 'low') score += 10;
    
    // Höher wenn mehrere Trends relevant sind
    score += Math.min(trends.length * 5, 15);
    
    return Math.min(score, 100);
}