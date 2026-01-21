import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();
    
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { generatedTypes = [], userActivity = {} } = await req.json();

    // Verfügbare Dokumentationstypen
    const allTypes = [
      'sample_data', 'user_issues', 'database_structure', 'module_architecture',
      'master_data', 'business_logic', 'external_integrations', 'document_generation',
      'user_workflows', 'permissions_roles', 'error_handling', 'data_migration',
      'executive_summary', 'timeline_calendar', 'performance_data', 
      'coding_conventions', 'testing_qa'
    ];

    const missingTypes = allTypes.filter(t => !generatedTypes.includes(t));

    // KI-basierte Empfehlungen
    const recommendationPrompt = `Du bist ein Experte für technische Dokumentation von Software-Projekten.

BEREITS GENERIERTE DOKUMENTATIONEN:
${generatedTypes.map(t => `- ${t}`).join('\n')}

NOCH FEHLENDE DOKUMENTATIONEN:
${missingTypes.map(t => `- ${t}`).join('\n')}

USER-AKTIVITÄT:
${JSON.stringify(userActivity, null, 2)}

AUFGABE:
Empfehle die nächsten 3-5 Dokumentationstypen, die generiert werden sollten, basierend auf:
1. Wichtigkeit für die App-Entwicklung
2. Abhängigkeiten zwischen Dokumentationen
3. Nutzungsverhalten des Users
4. Typische Entwicklungs-Workflows

Für jede Empfehlung gib an:
- Dokumentationstyp
- Grund der Empfehlung
- Priorität (HIGH, MEDIUM, LOW)
- Geschätzter Nutzen (1-10)`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: recommendationPrompt,
      response_json_schema: {
        type: "object",
        properties: {
          recommendations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                documentation_type: { type: "string" },
                reason: { type: "string" },
                priority: { 
                  type: "string",
                  enum: ["HIGH", "MEDIUM", "LOW"]
                },
                estimated_value: { 
                  type: "number",
                  minimum: 1,
                  maximum: 10
                },
                dependencies: {
                  type: "array",
                  items: { type: "string" }
                }
              }
            }
          },
          next_best_action: {
            type: "string",
            description: "Konkrete nächste Handlungsempfehlung"
          },
          completion_percentage: {
            type: "number",
            description: "Wie viel % der kritischen Dokumentation ist bereits fertig"
          }
        }
      }
    });

    // Anreichern mit zusätzlichen Metadaten
    const enrichedRecommendations = response.output.recommendations.map(rec => {
      const typeConfig = getTypeConfig(rec.documentation_type);
      return {
        ...rec,
        title: typeConfig?.title || rec.documentation_type,
        description: typeConfig?.description || '',
        estimatedDuration: typeConfig?.estimatedDuration || 0,
        estimatedSize: typeConfig?.estimatedSize || 'unbekannt'
      };
    });

    return Response.json({ 
      success: true,
      recommendations: enrichedRecommendations,
      next_best_action: response.output.next_best_action,
      completion_percentage: response.output.completion_percentage,
      missing_count: missingTypes.length,
      total_count: allTypes.length
    });

  } catch (error) {
    console.error('Recommendation Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function getTypeConfig(type) {
  const configs = {
    'sample_data': { title: 'Beispiel-Daten & Szenarien', description: 'Anonymisierte Beispiel-Daten', estimatedSize: '600 KB', estimatedDuration: 40 },
    'user_issues': { title: 'Häufige Probleme & FAQ', description: 'Top 20 User-Fragen', estimatedSize: '300 KB', estimatedDuration: 25 },
    'database_structure': { title: 'Datenbankstruktur', description: 'Vollständige Datenbank-Dokumentation', estimatedSize: '500 KB', estimatedDuration: 30 },
    'module_architecture': { title: 'Modul-Architektur', description: 'Übersicht aller Module', estimatedSize: '200 KB', estimatedDuration: 20 },
    'master_data': { title: 'Master Data & Konstanten', description: 'Alle Auswahloptionen', estimatedSize: '300 KB', estimatedDuration: 15 },
    'business_logic': { title: 'Geschäftslogik & Validierungen', description: 'Alle Geschäftsregeln', estimatedSize: '400 KB', estimatedDuration: 25 },
    'external_integrations': { title: 'Externe Integrationen', description: 'Dokumentation aller APIs', estimatedSize: '150 KB', estimatedDuration: 10 },
    'document_generation': { title: 'Dokumenten-Generierung', description: 'Alle automatischen Templates', estimatedSize: '350 KB', estimatedDuration: 20 },
    'user_workflows': { title: 'User-Workflows', description: 'Schritt-für-Schritt Prozesse', estimatedSize: '400 KB', estimatedDuration: 25 },
    'permissions_roles': { title: 'Berechtigungen & Rollen', description: 'Rollensystem-Dokumentation', estimatedSize: '100 KB', estimatedDuration: 10 },
    'error_handling': { title: 'Fehlerbehandlung & Logging', description: 'Error Handling Übersicht', estimatedSize: '150 KB', estimatedDuration: 10 },
    'data_migration': { title: 'Daten-Migration & Historisierung', description: 'Historisierungs-Dokumentation', estimatedSize: '100 KB', estimatedDuration: 10 },
    'executive_summary': { title: 'Executive Summary', description: 'Kompakte Gesamtübersicht', estimatedSize: '50 KB', estimatedDuration: 5 },
    'timeline_calendar': { title: 'Geschäftsprozesse & Zeitplanung', description: 'Jahreskalender und Fristen', estimatedSize: '200 KB', estimatedDuration: 15 },
    'performance_data': { title: 'Performance-Metriken & Limits', description: 'Performance-kritische Daten', estimatedSize: '150 KB', estimatedDuration: 10 },
    'coding_conventions': { title: 'Code-Standards & Konventionen', description: 'Naming Conventions', estimatedSize: '100 KB', estimatedDuration: 10 },
    'testing_qa': { title: 'Testing & Qualitätssicherung', description: 'Test-Strategie', estimatedSize: '150 KB', estimatedDuration: 10 }
  };
  
  return configs[type] || { title: type, description: '', estimatedSize: '0 KB', estimatedDuration: 0 };
}