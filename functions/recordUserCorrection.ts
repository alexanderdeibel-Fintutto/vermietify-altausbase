import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      entity_type, 
      entity_id, 
      field_name, 
      ai_value, 
      corrected_value,
      confidence_before
    } = await req.json();

    console.log('[CORRECTION] User correction recorded:', entity_type, field_name);

    // 1. Lerne aus der Korrektur
    const learningEvent = {
      entity_type,
      field_name,
      ai_value,
      corrected_value,
      pattern: `${entity_type}.${field_name}`,
      confidence_impact: confidence_before > 80 ? 'high' : 'medium',
      user_id: user.id
    };

    // 2. Prüfe ob Pattern bereits existiert (häufige Fehler)
    const gaps = await base44.entities.KnowledgeGap.filter({
      gap_type: "USER_CORRECTION"
    });

    const existingPattern = gaps.find(g => 
      g.description.includes(learningEvent.pattern)
    );

    if (existingPattern) {
      // Frequency erhöhen
      await base44.entities.KnowledgeGap.update(existingPattern.id, {
        frequency: existingPattern.frequency + 1
      });

      // Wenn häufig genug: Claude-Report generieren
      if (existingPattern.frequency + 1 >= 5 && !existingPattern.claude_report_generated) {
        await base44.functions.invoke('generateClaudeAnalysisReport', {
          gap_type: "USER_CORRECTION",
          description: `Häufige KI-Fehler beim Feld '${field_name}' in ${entity_type}`,
          context: {
            entity_type,
            field_name,
            examples: [
              { ai: ai_value, correct: corrected_value }
            ],
            frequency: existingPattern.frequency + 1
          },
          priority: 6
        });
      }
    } else {
      // Neue Korrektur-Pattern erstellen
      await base44.entities.KnowledgeGap.create({
        gap_type: "USER_CORRECTION",
        description: `KI-Fehler: ${entity_type}.${field_name}`,
        context_data: learningEvent,
        frequency: 1,
        business_impact: confidence_before > 90 ? "HIGH" : "MEDIUM",
        assigned_priority: 5,
        affected_users: [user.id],
        research_status: "IDENTIFIED"
      });
    }

    return Response.json({
      success: true,
      learning_recorded: true,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});