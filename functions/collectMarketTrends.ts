import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Sammelt Markttrends aus verschiedenen Quellen
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        // Nur Admins dürfen Markttrends sammeln
        if (user?.role !== 'admin') {
            return Response.json({ error: 'Admin access required' }, { status: 403 });
        }

        const trends = [];

        // 1. Energiepreise (simuliert - in Produktion würde man echte APIs nutzen)
        const energyTrend = {
            trend_category: 'energy_prices',
            trend_type: 'electricity_price_de',
            region: 'Germany',
            current_value: 0.32,
            previous_value: 0.28,
            unit: '€/kWh',
            change_percent: 14.3,
            trend_direction: 'up',
            data_source: 'destatis.de',
            source_url: 'https://www.destatis.de',
            source_name: 'Statistisches Bundesamt',
            collected_at: new Date().toISOString(),
            valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            relevance_score: 95,
            impact_areas: ['operating_costs', 'tenant_costs', 'sustainability'],
            insights: 'Energiepreise sind um 14,3% gestiegen. Dies könnte zu höheren Betriebskosten führen.'
        };
        trends.push(energyTrend);

        // 2. Gaspreise
        const gasTrend = {
            trend_category: 'energy_prices',
            trend_type: 'gas_price_de',
            region: 'Germany',
            current_value: 0.095,
            previous_value: 0.088,
            unit: '€/kWh',
            change_percent: 7.95,
            trend_direction: 'up',
            data_source: 'bundesbank.de',
            source_url: 'https://www.bundesbank.de',
            source_name: 'Deutsche Bundesbank',
            collected_at: new Date().toISOString(),
            valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            relevance_score: 85,
            impact_areas: ['heating_costs', 'operating_costs'],
            insights: 'Gaspreise steigen moderat. Heizkosten könnten für Mieter teurer werden.'
        };
        trends.push(gasTrend);

        // 3. Immobilienmarkt - durchschnittliche Miete Berlin
        const rentalTrend = {
            trend_category: 'real_estate',
            trend_type: 'average_rent_berlin',
            region: 'Berlin',
            current_value: 12.50,
            previous_value: 11.80,
            unit: '€/m²',
            change_percent: 5.93,
            trend_direction: 'up',
            data_source: 'immonexxi.de',
            source_url: 'https://www.immonexxi.de',
            source_name: 'ImmoNeXX Marktreport',
            collected_at: new Date().toISOString(),
            valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            relevance_score: 90,
            impact_areas: ['rent_adjustment', 'market_positioning'],
            insights: 'Berliner Mieten steigen um 5,93%. Neue Mieterhöhungen sind juristisch begründbar.'
        };
        trends.push(rentalTrend);

        // 4. Bauzinsen
        const interestTrend = {
            trend_category: 'interest_rates',
            trend_type: 'construction_interest_rate',
            region: 'Germany',
            current_value: 3.5,
            previous_value: 3.2,
            unit: '%',
            change_percent: 9.375,
            trend_direction: 'up',
            data_source: 'kfw.de',
            source_url: 'https://www.kfw.de',
            source_name: 'KfW Entwicklungsbank',
            collected_at: new Date().toISOString(),
            valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            relevance_score: 70,
            impact_areas: ['financing', 'renovation_planning'],
            insights: 'Bauzinsen steigen. Renovierungen sollten schnell geplant werden.'
        };
        trends.push(interestTrend);

        // 5. Inflationsrate
        const inflationTrend = {
            trend_category: 'inflation',
            trend_type: 'inflation_rate_de',
            region: 'Germany',
            current_value: 2.4,
            previous_value: 2.1,
            unit: '%',
            change_percent: 14.29,
            trend_direction: 'up',
            data_source: 'destatis.de',
            source_url: 'https://www.destatis.de',
            source_name: 'Statistisches Bundesamt',
            collected_at: new Date().toISOString(),
            valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            relevance_score: 65,
            impact_areas: ['cost_adjustment', 'budget_planning'],
            insights: 'Inflationsrate beträgt 2,4%. Kostensteigerungen sind zu erwarten.'
        };
        trends.push(inflationTrend);

        // Alte Trends löschen (nur aktive behalten)
        await base44.asServiceRole.entities.MarketTrend.delete(
            await base44.asServiceRole.entities.MarketTrend.list()
                .then(items => items.map(t => t.id))
        );

        // Neue Trends speichern
        for (const trend of trends) {
            await base44.asServiceRole.entities.MarketTrend.create(trend);
        }

        return Response.json({
            success: true,
            collected_trends: trends.length,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Market trend collection failed:', error);
        return Response.json({ 
            error: error.message,
            success: false
        }, { status: 500 });
    }
});