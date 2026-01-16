import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (user?.role !== 'admin') {
            return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        const features = [
            { key: 'beleg_scanner', name: 'Beleg-Scanner', description: 'Scannt Belege und extrahiert Daten' },
            { key: 'steuerbescheid', name: 'Steuerbescheid Erklärer', description: 'Erklärt Steuerbescheide' },
            { key: 'steuer_chat', name: 'Steuer-Chat', description: 'Chatbot für Steuerfragen' },
            { key: 'mietvertrag', name: 'Mietvertrag Prüfer', description: 'Prüft Mietverträge' },
            { key: 'buchungen', name: 'SKR03 Buchungen', description: 'Kategorisiert Buchungen' },
            { key: 'nebenkosten', name: 'Nebenkosten Prüfer', description: 'Prüft Nebenkostenabrechnungen' },
            { key: 'rendite', name: 'Rendite-Analyse', description: 'Analysiert Immobilien-Rendite' },
            { key: 'brief', name: 'Brief Generator', description: 'Generiert Geschäftsbriefe' },
            { key: 'portfolio', name: 'Portfolio-Analyse', description: 'Analysiert Immobilien-Portfolio' },
            { key: 'dokument_zusammenfasser', name: 'Dokument Zusammenfasser', description: 'Fasst Dokumente zusammen' },
            { key: 'steuer_optimierung', name: 'Steuer-Optimierung', description: 'Optimiert Steuerstrategie' },
            { key: 'faq_bot', name: 'FAQ-Bot', description: 'Beantwortet häufige Fragen' }
        ];

        const today = new Date().toISOString().split('T')[0];
        let created = 0;
        let updated = 0;

        for (const feature of features) {
            const existing = await base44.asServiceRole.entities.AIFeatureConfig.filter({ 
                feature_key: feature.key 
            });

            if (existing.length === 0) {
                await base44.asServiceRole.entities.AIFeatureConfig.create({
                    feature_key: feature.key,
                    feature_name: feature.name,
                    feature_description: feature.description,
                    enabled: true,
                    max_requests_per_day: 100,
                    requests_today: 0,
                    total_requests: 0,
                    estimated_cost_eur: 0,
                    last_reset_date: today
                });
                created++;
            } else {
                updated++;
            }
        }

        const settingsList = await base44.asServiceRole.entities.AISettings.list();
        if (settingsList.length === 0) {
            await base44.asServiceRole.entities.AISettings.create({
                claude_enabled: true,
                claude_default_model: 'claude-sonnet-4-5-20250929',
                openai_enabled: false,
                preferred_provider: 'auto',
                monthly_budget_eur: 100,
                budget_warning_threshold: 80
            });
        }

        return Response.json({
            success: true,
            message: `${created} Features erstellt, ${updated} vorhanden, Settings initialisiert`
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});