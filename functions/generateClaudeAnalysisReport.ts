import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin required' }, { status: 403 });
    }

    const { gap_type, description, context, priority } = await req.json();

    console.log('[CLAUDE-REPORT] Generating analysis for:', gap_type);

    // Generiere spezialisierten Prompt
    const claudePrompt = generateSpecializedPrompt(gap_type, description, context, priority);

    // Rufe Claude über Base44-Integration auf
    const claudeResponse = await base44.integrations.Core.InvokeLLM({
      prompt: claudePrompt,
      add_context_from_internet: gap_type === "LAW_CHANGE"
    });

    // Speichere Report
    const report = await base44.entities.ClaudeAnalysisReport.create({
      report_type: gap_type === "ELSTER_REJECTION" ? "KNOWLEDGE_GAP_ANALYSIS" : 
                   gap_type === "LAW_CHANGE" ? "LEGAL_UPDATE_IMPACT" : "SYSTEM_OPTIMIZATION",
      generated_date: new Date().toISOString(),
      data_snapshot: context,
      claude_prompt: claudePrompt,
      claude_response: claudeResponse,
      implementation_priority: priority,
      status: "GENERATED"
    });

    console.log('[SUCCESS] Report created:', report.id);

    return Response.json({
      success: true,
      report_id: report.id,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function generateSpecializedPrompt(gap_type, description, context, priority) {
  const basePrompt = `
# AUTONOME PROBLEM-ANALYSE

**Problem:** ${description}
**Typ:** ${gap_type}
**Priorität:** ${priority}/10
**Kontext:** ${JSON.stringify(context, null, 2)}

## Analyse-Auftrag

Analysiere dieses Problem für eine deutsche Immobilienverwaltungs-Software und erstelle konkrete Lösungsempfehlungen:

### 1. ROOT-CAUSE-ANALYSE
- Warum tritt dieses Problem auf?
- Welche Systemkomponenten sind betroffen?
- Gibt es Muster oder Abhängigkeiten?

### 2. LÖSUNGSOPTIONEN
- Sofort-Maßnahmen (< 1 Tag)
- Mittelfristige Lösungen (1-2 Wochen)
- Langfristige Verbesserungen

### 3. IMPLEMENTIERUNGS-PLAN
- Technische Spezifikationen
- Betroffene Entities/Funktionen
- Validierungs-Regeln
- Test-Szenarien

### 4. WISSENSBASIS-UPDATE
- Neue KI-Entscheidungsregeln
- Verbesserte Kategorisierungslogik
- Zusätzliche Validierungen

## Output-Format

Struktur die Antwort als actionable Implementation Plan (JSON-kompatibel).
  `;

  // Spezifische Ergänzungen je Gap-Typ
  switch (gap_type) {
    case "ELSTER_REJECTION":
      return basePrompt + `

## ELSTER-SPEZIFISCHE ANALYSE
- Analysiere den XML-Fehler
- Prüfe ERiC-Kompatibilität
- Validierungsregel-Anpassungen nötig?
- Test vs. Produktions-Modus-Unterschied?
      `;

    case "LAW_CHANGE":
      return basePrompt + `

## GESETZESÄNDERUNGS-ANALYSE  
- Übergangsfristen?
- Rückwirkung auf Altdaten?
- Welche Rechtsformen betroffen?
- Compliance-Timeline?
      `;

    case "USER_CORRECTION":
      return basePrompt + `

## USER-LEARNING-ANALYSE
- Welche KI-Logik ist fehlerhaft?
- Wie können wir das automatisieren?
- Neue Training-Daten nötig?
- UI-Verbesserungen möglich?
      `;
  }

  return basePrompt;
}