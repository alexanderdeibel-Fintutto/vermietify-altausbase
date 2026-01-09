import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  const user = await base44.auth.me();
  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Admin access required' }, { status: 403 });
  }
  
  try {
    const { tax_law_update_id } = await req.json();
    
    const taxLawUpdate = await base44.entities.TaxLawUpdate.get(tax_law_update_id);
    if (!taxLawUpdate) {
      return Response.json({ error: 'TaxLawUpdate not found' }, { status: 404 });
    }
    
    const existingConfigs = await base44.entities.TaxConfig.filter({ is_active: true });
    const existingRules = await base44.entities.TaxRule.filter({ is_active: true });
    
    const existingConfigSummary = existingConfigs.slice(0, 20).map(c => ({
      key: c.config_key,
      name: c.display_name,
      value: c.value,
      valid_from: c.valid_from_tax_year
    }));
    
    const existingRuleSummary = existingRules.slice(0, 20).map(r => ({
      code: r.rule_code,
      name: r.display_name,
      type: r.rule_type,
      valid_from: r.valid_from_tax_year
    }));
    
    const analysisPrompt = `
Du bist ein Experte für deutsches Steuerrecht.

GESETZESÄNDERUNG:
Titel: ${taxLawUpdate.title}
Zusammenfassung: ${taxLawUpdate.summary || 'Keine Zusammenfassung'}
Betroffene Steuerarten: ${(taxLawUpdate.affected_tax_types || []).join(', ')}
Betroffene Paragraphen: ${(taxLawUpdate.affected_paragraphs || []).join(', ')}
Inkrafttreten: ${taxLawUpdate.effective_date || 'Unbekannt'}

ANALYSE ERFORDERLICH:
1. Zusammenfassung der Auswirkungen
2. Impact Level (HIGH/MEDIUM/LOW/NONE)
3. Konkrete Config-Änderungen
4. Konkrete Rule-Änderungen
5. Ist Handlung erforderlich?

Für Config-Vorschläge (if action=CREATE):
{ "config_key": "...", "display_name": "...", "value_type": "PERCENTAGE|CURRENCY|INTEGER|DECIMAL|BOOLEAN|STRING|DATE", "suggested_value": "..." }

Für Rule-Vorschläge (if action=CREATE):
{ "rule_code": "...", "display_name": "...", "rule_type": "CALCULATION|VALIDATION|...", "conditions": {...}, "actions": {...} }
`;

    const aiResponse = await base44.integrations.Core.InvokeLLM({
      prompt: analysisPrompt,
      response_json_schema: {
        type: 'object',
        properties: {
          analysis_summary: { type: 'string' },
          impact_level: { type: 'string', enum: ['HIGH', 'MEDIUM', 'LOW', 'NONE'] },
          suggested_config_changes: { type: 'array', items: { type: 'object' } },
          suggested_rule_changes: { type: 'array', items: { type: 'object' } },
          action_required: { type: 'boolean' },
          confidence_score: { type: 'number' }
        },
        required: ['analysis_summary', 'impact_level', 'action_required', 'confidence_score']
      }
    });
    
    await base44.entities.TaxLawUpdate.update(tax_law_update_id, {
      ai_analysis: aiResponse,
      suggested_config_changes: aiResponse.suggested_config_changes || [],
      suggested_rule_changes: aiResponse.suggested_rule_changes || [],
      status: aiResponse.action_required ? 'PENDING_REVIEW' : 'NOT_RELEVANT',
      relevance_score: aiResponse.confidence_score
    });
    
    await base44.entities.TaxRuleAuditLog.create({
      entity_type: 'TaxLawUpdate',
      entity_id: tax_law_update_id,
      action: 'UPDATE',
      new_values: { status: 'ANALYZED', ai_analysis: 'completed' },
      change_reason: 'AI analysis completed',
      performed_by: user.email,
      performed_at: new Date().toISOString()
    });
    
    return Response.json({
      success: true,
      analysis: aiResponse,
      status: aiResponse.action_required ? 'PENDING_REVIEW' : 'NOT_RELEVANT'
    });
    
  } catch (error) {
    console.error('Error analyzing tax law change:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});