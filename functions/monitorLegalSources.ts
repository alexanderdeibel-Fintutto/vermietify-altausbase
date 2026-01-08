import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin required' }, { status: 403 });
    }

    console.log('[LEGAL-MONITOR] Checking legal sources for updates...');

    const sources = [
      {
        name: "BMF Schreiben",
        url: "https://www.bundesfinanzministerium.de/Web/DE/Service/RSS/rss_node.html",
        type: "RSS_FEED",
        keywords: ["Steuer", "Immobilien", "Vermietung", "AfA", "EÜR", "Anlage V"]
      },
      {
        name: "ELSTER Entwickler Updates",
        url: "https://www.elster.de/elsterweb/entwickler",
        type: "WEBSITE_SCRAPING",
        keywords: ["ERiC", "Schema", "Version", "XML", "Update"]
      }
    ];

    let processed = 0;
    let criticalUpdates = [];

    for (const source of sources) {
      try {
        // Hole Monitor-Config aus DB
        const monitors = await base44.entities.LegalUpdateMonitor.filter({
          source_name: source.name
        });

        if (monitors.length === 0) {
          await base44.entities.LegalUpdateMonitor.create({
            source_name: source.name,
            source_url: source.url,
            monitor_type: source.type,
            check_frequency: "DAILY",
            keywords: source.keywords,
            auto_process: true,
            notification_recipients: []
          });
          continue;
        }

        const monitor = monitors[0];

        // Simuliere Change-Detection (in Produktion würde echte API/RSS-Verarbeitung stattfinden)
        const changes = await simulateSourceCheck(source);

        if (changes.length > 0) {
          for (const change of changes) {
            // Bewerte Relevanz mit KI
            const relevance = await assessRelevanceWithKI(change, source.keywords);

            if (relevance.isRelevant) {
              processed++;
              
              if (relevance.urgency === "CRITICAL") {
                criticalUpdates.push({
                  source: source.name,
                  change: change.title,
                  urgency: relevance.urgency
                });

                // Erstelle Claude-Report für kritische Updates
                await base44.entities.ClaudeAnalysisReport.create({
                  report_type: "LEGAL_UPDATE_IMPACT",
                  generated_date: new Date().toISOString(),
                  data_snapshot: {
                    source: source.name,
                    change,
                    relevance
                  },
                  claude_prompt: generateClaudePrompt(change, relevance),
                  implementation_priority: 10,
                  status: "GENERATED"
                });
              }

              // Aktualisiere Monitor
              await base44.entities.LegalUpdateMonitor.update(monitor.id, {
                last_check: new Date().toISOString(),
                change_detected: true,
                latest_changes: [change]
              });
            }
          }
        } else {
          // Auch erfolgreiche Prüfungen ohne Änderungen loggen
          await base44.entities.LegalUpdateMonitor.update(monitor.id, {
            last_check: new Date().toISOString(),
            change_detected: false
          });
        }

      } catch (error) {
        console.error(`[ERROR] Source ${source.name}:`, error.message);
      }
    }

    return Response.json({
      success: true,
      processed_count: processed,
      critical_updates: criticalUpdates.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function simulateSourceCheck(source) {
  // In Produktion würde hier echte RSS/Web-Scraping stattfinden
  // Für Demo: Gebe leere oder Beispiel-Array zurück
  return [];
}

async function assessRelevanceWithKI(change, keywords) {
  // Vereinfachte KI-Bewertung
  const relevantKeywords = keywords.filter(k => 
    change.title?.toLowerCase().includes(k.toLowerCase()) ||
    change.content?.toLowerCase().includes(k.toLowerCase())
  );

  return {
    isRelevant: relevantKeywords.length > 0,
    confidence: Math.min(100, relevantKeywords.length * 25),
    urgency: relevantKeywords.length > 2 ? "CRITICAL" : "MEDIUM",
    affectedModules: [],
    reasoning: `Gefundene Keywords: ${relevantKeywords.join(', ')}`
  };
}

function generateClaudePrompt(change, relevance) {
  return `
# NEUE GESETZESÄNDERUNG ERKANNT

**Quelle:** ${change.source}
**Thema:** ${change.title}
**Dringlichkeit:** ${relevance.urgency}

## Änderungs-Details
${change.content || change.description || 'Siehe Quelle'}

## Analyse-Auftrag

Analysiere die Auswirkungen dieser Änderung auf eine deutsche Immobilienverwaltungs-Software:

1. **Relevanz-Bewertung**: Wie relevant ist das für unsere Zielgruppe?
2. **Betroffene Module**: Welche System-Komponenten müssen angepasst werden?
3. **Rechtliche Implikationen**: Was ist zu beachten?
4. **Implementierungs-Roadmap**: Wie sollten wir vorgehen?

Struktur die Antwort für automatische Implementierung.
  `;
}