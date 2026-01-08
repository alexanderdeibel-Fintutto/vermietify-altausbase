import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin required' }, { status: 403 });
    }

    console.log('[DETECT-GAPS] Scanning for knowledge gaps...');

    const gaps = [];

    // 1. ELSTER-Ablehnungen analysieren
    const rejections = await base44.entities.ElsterSubmission.filter({
      status: "REJECTED"
    });

    console.log(`[GAPS] Found ${rejections.length} ELSTER rejections`);

    for (const rejection of rejections.slice(0, 10)) {
      if (rejection.validation_errors?.length > 0) {
        // Gruppiere Fehler
        const errorPattern = rejection.validation_errors[0];
        
        gaps.push({
          type: "ELSTER_REJECTION",
          description: `ELSTER-Ablehnung: ${errorPattern.message || JSON.stringify(errorPattern)}`,
          context: {
            submission_id: rejection.id,
            form_type: rejection.tax_form_type,
            errors: rejection.validation_errors
          },
          frequency: 1,
          priority: 7
        });
      }
    }

    // 2. Niedrige KI-Confidence-Bereiche
    const lowConfidence = await base44.entities.ElsterSubmission.filter();
    const lowConfidenceSubmissions = lowConfidence.filter(
      s => s.ai_confidence_score && s.ai_confidence_score < 75
    );

    if (lowConfidenceSubmissions.length > 5) {
      gaps.push({
        type: "UNKNOWN_SCENARIO",
        description: `Häufig niedrige KI-Confidence (${lowConfidenceSubmissions.length} Fälle)`,
        context: {
          count: lowConfidenceSubmissions.length,
          avg_confidence: Math.round(
            lowConfidenceSubmissions.reduce((sum, s) => sum + (s.ai_confidence_score || 0), 0) /
            lowConfidenceSubmissions.length
          )
        },
        frequency: lowConfidenceSubmissions.length,
        priority: 6
      });
    }

    // 3. Verarbeite Wissenslücken
    let created = 0;
    for (const gap of gaps) {
      try {
        // Prüfe auf Duplikate
        const existing = await base44.entities.KnowledgeGap.filter({
          gap_type: gap.type,
          description: gap.description
        });

        if (existing.length > 0) {
          // Frequency erhöhen
          await base44.entities.KnowledgeGap.update(existing[0].id, {
            frequency: existing[0].frequency + gap.frequency
          });
        } else {
          // Neue KnowledgeGap erstellen
          await base44.entities.KnowledgeGap.create({
            gap_type: gap.type,
            description: gap.description,
            context_data: gap.context,
            frequency: gap.frequency,
            business_impact: calculateImpact(gap.priority),
            assigned_priority: gap.priority,
            affected_users: [],
            research_status: "IDENTIFIED"
          });
          created++;
        }

        // Bei kritischen Lücken: Claude-Report generieren
        if (gap.priority >= 8) {
          await base44.functions.invoke('generateClaudeAnalysisReport', {
            gap_type: gap.type,
            description: gap.description,
            context: gap.context,
            priority: gap.priority
          });
        }

      } catch (error) {
        console.error('[ERROR] Processing gap:', error.message);
      }
    }

    return Response.json({
      success: true,
      gaps_detected: gaps.length,
      gaps_created: created,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function calculateImpact(priority) {
  if (priority >= 9) return "CRITICAL";
  if (priority >= 7) return "HIGH";
  if (priority >= 5) return "MEDIUM";
  return "LOW";
}