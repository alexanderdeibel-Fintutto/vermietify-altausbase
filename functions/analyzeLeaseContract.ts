import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { contract_id, contract_text, template_id } = await req.json();

    if (!contract_id && !contract_text) {
      return Response.json({ error: 'contract_id or contract_text required' }, { status: 400 });
    }

    let contractContent = contract_text;
    let contract = null;

    // Fetch contract if ID provided
    if (contract_id) {
      const contracts = await base44.asServiceRole.entities.LeaseContract.filter({ id: contract_id }, null, 1);
      contract = contracts[0];
      if (!contract) {
        return Response.json({ error: 'Contract not found' }, { status: 404 });
      }
      contractContent = contract.contract_text || contract.notes || '';
    }

    // Fetch template if provided for comparison
    let templateContent = null;
    if (template_id) {
      const templates = await base44.asServiceRole.entities.Template.filter({ id: template_id }, null, 1);
      if (templates[0]) {
        templateContent = templates[0].content;
      }
    }

    // AI Analysis
    const analysisPrompt = `Analysiere den folgenden Mietvertrag gründlich und strukturiert:

MIETVERTRAG:
${contractContent}

${templateContent ? `\n\nSTANDARD-VORLAGE ZUM VERGLEICH:\n${templateContent}\n\n` : ''}

Erstelle eine umfassende Analyse mit folgenden Schwerpunkten:

1. WICHTIGSTE KLAUSELN UND BEDINGUNGEN:
   - Mietdauer und Kündigungsfristen
   - Miethöhe und Nebenkosten
   - Kaution und Sicherheiten
   - Besondere Vereinbarungen
   - Instandhaltungspflichten

2. RISIKO-ANALYSE:
   - Ungewöhnliche oder problematische Klauseln
   - Potenzielle rechtliche Risiken
   - Unwirksame oder fragwürdige Bestimmungen
   - Fehlende wichtige Klauseln

3. ZUSAMMENFASSUNG:
   - Prägnante Übersicht der wichtigsten Punkte
   - Besondere Aufmerksamkeitspunkte

${templateContent ? `4. ABWEICHUNGEN VON STANDARD-VORLAGE:
   - Hinzugefügte Klauseln
   - Geänderte Bestimmungen
   - Fehlende Standard-Klauseln
   - Bewertung der Abweichungen` : ''}

Gib die Analyse in strukturiertem JSON-Format zurück.`;

    const analysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: analysisPrompt,
      response_json_schema: {
        type: 'object',
        properties: {
          key_clauses: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                category: { type: 'string' },
                clause: { type: 'string' },
                details: { type: 'string' },
                importance: { type: 'string', enum: ['high', 'medium', 'low'] }
              }
            }
          },
          risks: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                risk_type: { type: 'string' },
                description: { type: 'string' },
                severity: { type: 'string', enum: ['high', 'medium', 'low'] },
                recommendation: { type: 'string' }
              }
            }
          },
          summary: {
            type: 'object',
            properties: {
              overview: { type: 'string' },
              key_points: { type: 'array', items: { type: 'string' } },
              attention_required: { type: 'array', items: { type: 'string' } }
            }
          },
          template_comparison: {
            type: 'object',
            properties: {
              added_clauses: { type: 'array', items: { type: 'string' } },
              modified_clauses: { type: 'array', items: { type: 'string' } },
              missing_clauses: { type: 'array', items: { type: 'string' } },
              deviation_score: { type: 'number' }
            }
          },
          compliance_score: { type: 'number' },
          overall_assessment: { type: 'string' }
        }
      }
    });

    // Save analysis to database if contract_id provided
    if (contract_id) {
      await base44.asServiceRole.entities.LeaseContract.update(contract_id, {
        ai_analysis: analysis,
        last_analyzed_at: new Date().toISOString()
      });
    }

    return Response.json({
      success: true,
      analysis,
      contract_id,
      analyzed_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error analyzing lease contract:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});