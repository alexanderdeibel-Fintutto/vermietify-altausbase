import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (user?.role !== 'admin') {
            return Response.json({ error: 'Admin access required' }, { status: 403 });
        }

        const recommendations = [];

        // 1. AI-KOSTEN-OPTIMIERUNG
        const { data: costAnalysis } = await base44.asServiceRole.functions.invoke('analyzeAICostPatterns', { days: 30 });
        
        if (costAnalysis.success && costAnalysis.top_opportunities) {
            for (const opp of costAnalysis.top_opportunities) {
                recommendations.push({
                    recommendation_type: 'cost_optimization',
                    title: opp.title,
                    description: opp.description,
                    potential_savings_eur: opp.potential_savings_eur,
                    implementation_effort: opp.implementation_effort,
                    priority_score: opp.priority_score,
                    data_sources: ['AIUsageLog'],
                    ai_confidence: 90,
                    status: 'new'
                });
            }
        }

        // 2. METER-EFFIZIENZ
        const meters = await base44.asServiceRole.entities.Meter.filter({ aktiv: true });
        
        for (const meter of meters.slice(0, 5)) {
            const readings = await base44.asServiceRole.entities.MeterReading.filter({
                meter_id: meter.id
            }, '-ablesedatum', 6);

            if (readings.length >= 4) {
                const consumptions = readings.map(r => r.verbrauch_seit_letzter).filter(v => v > 0);
                
                if (consumptions.length >= 3) {
                    const avg = consumptions.reduce((a, b) => a + b, 0) / consumptions.length;
                    const trend = consumptions[0] - consumptions[consumptions.length - 1];

                    // Steigender Verbrauch?
                    if (trend > avg * 0.15) {
                        recommendations.push({
                            recommendation_type: 'efficiency_improvement',
                            title: `Steigender Verbrauch: ${meter.zaehler_typ}`,
                            description: `Verbrauch von Zähler ${meter.zaehler_nummer} ist um ${((trend / avg) * 100).toFixed(1)}% gestiegen. Ggf. Defekt oder ineffiziente Nutzung.`,
                            potential_savings_eur: avg * 0.15 * 0.30, // 15% Verbrauch * 30 Cent/kWh
                            implementation_effort: 'medium',
                            priority_score: 70,
                            target_entity_type: 'Meter',
                            target_entity_id: meter.id,
                            data_sources: ['MeterReading'],
                            action_items: [
                                { action: 'Zähler prüfen lassen', deadline: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0] },
                                { action: 'Verbrauch analysieren', deadline: new Date(Date.now() + 14*24*60*60*1000).toISOString().split('T')[0] }
                            ],
                            ai_confidence: 75,
                            status: 'new'
                        });
                    }
                }
            }
        }

        // 3. MARKT-TRENDS (vereinfachtes Beispiel)
        const buildings = await base44.asServiceRole.entities.Building.list();
        
        if (buildings.length > 0) {
            const totalArea = buildings.reduce((sum, b) => sum + (b.gesamtflaeche_wohn || 0), 0);
            
            recommendations.push({
                recommendation_type: 'market_opportunity',
                title: '📊 Portfolio-Analyse empfohlen',
                description: `Mit ${buildings.length} Objekten und ${totalArea.toFixed(0)}m² Wohnfläche könnte eine Portfolio-Optimierung sinnvoll sein. Markttrends zeigen steigendes Interesse an energieeffizienten Immobilien.`,
                potential_savings_eur: 0,
                implementation_effort: 'low',
                priority_score: 50,
                data_sources: ['Building', 'Market Data'],
                action_items: [
                    { action: 'Portfolio-Analyse durchführen', deadline: new Date(Date.now() + 60*24*60*60*1000).toISOString().split('T')[0] }
                ],
                ai_confidence: 65,
                status: 'new'
            });
        }

        // 4. COMPLIANCE-UPDATES
        const contracts = await base44.asServiceRole.entities.LeaseContract.filter({
            vertragsstatus: 'Aktiv'
        });

        if (contracts.length > 0) {
            const expiringSoon = contracts.filter(c => {
                if (!c.kuendigung_zum) return false;
                const daysUntil = (new Date(c.kuendigung_zum) - new Date()) / (1000 * 60 * 60 * 24);
                return daysUntil > 0 && daysUntil < 90;
            });

            if (expiringSoon.length > 0) {
                recommendations.push({
                    recommendation_type: 'compliance_update',
                    title: `${expiringSoon.length} Verträge laufen bald aus`,
                    description: `Handlungsbedarf: Vertragsverlängerungen prüfen oder Kündigungsfristen beachten.`,
                    implementation_effort: 'medium',
                    priority_score: 85,
                    data_sources: ['LeaseContract'],
                    action_items: expiringSoon.slice(0, 3).map(c => ({
                        action: `Vertrag prüfen (Einheit ${c.unit_id})`,
                        deadline: c.kuendigung_zum
                    })),
                    ai_confidence: 95,
                    status: 'new'
                });
            }
        }

        // Speichere Top-Empfehlungen
        const topRecommendations = recommendations
            .sort((a, b) => b.priority_score - a.priority_score)
            .slice(0, 10);

        for (const rec of topRecommendations) {
            // Prüfe auf Duplikate
            const existing = await base44.asServiceRole.entities.AIProactiveRecommendation.filter({
                title: rec.title,
                status: { $in: ['new', 'viewed', 'in_progress'] }
            });

            if (existing.length === 0) {
                await base44.asServiceRole.entities.AIProactiveRecommendation.create(rec);
            }
        }

        return Response.json({
            success: true,
            recommendations_generated: topRecommendations.length,
            top_recommendations: topRecommendations
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});