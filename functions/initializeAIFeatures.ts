import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const AI_FEATURES = [
  {
    feature_key: "beleg_scanner",
    feature_name: "Beleg-Scanner (OCR)",
    feature_description: "Extrahiert Daten aus Fotos von Belegen, Quittungen, Rechnungen",
    temperature: 0.1,
    max_tokens_per_request: 2000
  },
  {
    feature_key: "steuerbescheid_erklaerer",
    feature_name: "Steuerbescheid-Erklärer",
    feature_description: "Erklärt Steuerbescheide in einfacher Sprache",
    temperature: 0.3,
    max_tokens_per_request: 4096
  },
  {
    feature_key: "steuer_assistent",
    feature_name: "Steuer-Assistent (Chat)",
    feature_description: "Führt durch die Steuererklärung im Chat-Format",
    temperature: 0.7,
    max_tokens_per_request: 2000
  },
  {
    feature_key: "mietvertrag_pruefer",
    feature_name: "Mietvertrag-Prüfer",
    feature_description: "Analysiert Mietverträge auf problematische Klauseln",
    temperature: 0.2,
    max_tokens_per_request: 4096
  },
  {
    feature_key: "buchungs_kategorisierer",
    feature_name: "Buchungs-Kategorisierer (SKR03)",
    feature_description: "Ordnet Buchungen den korrekten SKR03-Konten zu",
    temperature: 0.1,
    max_tokens_per_request: 3000
  },
  {
    feature_key: "nebenkosten_pruefer",
    feature_name: "Nebenkostenabrechnung-Prüfer",
    feature_description: "Prüft Nebenkostenabrechnungen auf Fehler",
    temperature: 0.2,
    max_tokens_per_request: 4096
  },
  {
    feature_key: "rendite_analyse",
    feature_name: "Immobilien-Rendite-Analyse",
    feature_description: "Berechnet Renditekennzahlen für Kaufentscheidungen",
    temperature: 0.2,
    max_tokens_per_request: 3000
  },
  {
    feature_key: "brief_generator",
    feature_name: "Brief-Generator",
    feature_description: "Erstellt rechtssichere Geschäftsbriefe",
    temperature: 0.4,
    max_tokens_per_request: 2000
  },
  {
    feature_key: "portfolio_analyse",
    feature_name: "Portfolio-Analyse",
    feature_description: "Analysiert Anlageportfolios und gibt strategische Hinweise",
    temperature: 0.3,
    max_tokens_per_request: 3000
  },
  {
    feature_key: "dokument_zusammenfasser",
    feature_name: "Dokument-Zusammenfasser",
    feature_description: "Fasst Dokumente strukturiert zusammen",
    temperature: 0.3,
    max_tokens_per_request: 2000
  },
  {
    feature_key: "steuer_optimierer",
    feature_name: "Steuer-Optimierer",
    feature_description: "Zeigt legale Steuerspar-Möglichkeiten auf",
    temperature: 0.3,
    max_tokens_per_request: 3000
  },
  {
    feature_key: "finanz_faq_bot",
    feature_name: "Finanz-FAQ-Bot",
    feature_description: "Beantwortet Fragen zu Finanzen, Steuern, Miete",
    temperature: 0.5,
    max_tokens_per_request: 1500
  }
];

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);

    try {
        const user = await base44.auth.me();
        if (user?.role !== 'admin') {
            return Response.json({ error: 'Admin access required' }, { status: 403 });
        }

        let created = 0;
        let existing = 0;

        for (const feature of AI_FEATURES) {
            const existingFeatures = await base44.asServiceRole.entities.AIFeatureConfig.filter({
                feature_key: feature.feature_key
            });

            if (existingFeatures.length === 0) {
                await base44.asServiceRole.entities.AIFeatureConfig.create({
                    ...feature,
                    enabled: false,
                    preferred_provider: "global",
                    requests_today: 0,
                    total_requests: 0,
                    total_input_tokens: 0,
                    total_output_tokens: 0,
                    estimated_cost_eur: 0
                });
                created++;
            } else {
                existing++;
            }
        }

        const settingsCount = await base44.asServiceRole.entities.AISettings.list();
        if (settingsCount.length === 0) {
            await base44.asServiceRole.entities.AISettings.create({
                claude_enabled: false,
                openai_enabled: false,
                preferred_provider: "auto",
                budget_warning_threshold: 80
            });
        }

        return Response.json({
            success: true,
            created,
            existing,
            total: AI_FEATURES.length,
            message: `${created} Features erstellt, ${existing} bereits vorhanden`
        });

    } catch (error) {
        console.error('Initialize AI features error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});