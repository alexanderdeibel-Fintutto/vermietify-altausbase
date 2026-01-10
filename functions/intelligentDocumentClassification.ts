import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { company_id, document_id, document_content } = await req.json();

    // Get active classification rules
    const rules = await base44.asServiceRole.entities.DocumentClassificationRule.filter({
      company_id,
      is_active: true
    });

    // AI-based classification
    const aiResult = await base44.integrations.Core.InvokeLLM({
      prompt: `Klassifiziere das folgende Dokument. Gib eine JSON mit "type", "confidence", "tags" und "risks" zurück:\n\n${document_content}`,
      response_json_schema: {
        type: 'object',
        properties: {
          type: { type: 'string' },
          confidence: { type: 'number' },
          tags: { type: 'array', items: { type: 'string' } },
          risks: { type: 'array', items: { type: 'string' } }
        }
      }
    });

    // Apply matching rules
    const matchedRules = rules.filter(rule => {
      const keywords = rule.keywords || [];
      const contentLower = document_content.toLowerCase();
      return keywords.some(kw => contentLower.includes(kw.toLowerCase()));
    });

    // Get document and update
    const doc = await base44.asServiceRole.entities.Document.read(document_id);
    
    const classification = {
      type: aiResult.type,
      confidence: aiResult.confidence,
      ai_tags: aiResult.tags,
      rule_based_tags: matchedRules.flatMap(r => r.auto_tags || []),
      identified_risks: aiResult.risks,
      classified_at: new Date().toISOString(),
      classified_by_ai: true
    };

    // Trigger auto-workflows if applicable
    const autoWorkflows = matchedRules.filter(r => r.auto_workflow_id);
    const workflowIds = [];
    
    for (const rule of autoWorkflows) {
      try {
        const exec = await base44.asServiceRole.entities.WorkflowExecution.create({
          workflow_id: rule.auto_workflow_id,
          company_id,
          status: 'running',
          started_by: user.email,
          started_at: new Date().toISOString(),
          variables: { document_id }
        });
        workflowIds.push(exec.id);
      } catch (err) {
        console.error('Workflow trigger failed:', err);
      }
    }

    return Response.json({
      success: true,
      classification,
      triggered_workflows: workflowIds
    });
  } catch (error) {
    console.error('Classification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});