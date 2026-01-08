import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin required' }, { status: 403 });
    }

    const { report_id } = await req.json();

    console.log('[PROCESS-RECOMMENDATIONS] Processing report:', report_id);

    // Hole Report
    const reports = await base44.entities.ClaudeAnalysisReport.filter({ id: report_id });
    if (reports.length === 0) {
      return Response.json({ error: 'Report not found' }, { status: 404 });
    }

    const report = reports[0];

    if (!report.claude_response) {
      return Response.json({ error: 'No Claude response yet' }, { status: 400 });
    }

    // Parse Claude-Response für Empfehlungen
    const recommendations = await parseClaudeRecommendations(report.claude_response);

    let implemented = 0;
    let requiresReview = 0;

    for (const recommendation of recommendations) {
      try {
        if (recommendation.auto_implementable && recommendation.confidence > 0.9) {
          // Automatische Implementierung
          await implementRecommendation(base44, recommendation);
          implemented++;
        } else {
          // Manuelle Review erforderlich
          requiresReview++;
        }
      } catch (error) {
        console.error('[ERROR] Implementing:', error.message);
      }
    }

    // Aktualisiere Report-Status
    await base44.entities.ClaudeAnalysisReport.update(report_id, {
      status: "IN_PROGRESS",
      recommended_actions: recommendations
    });

    return Response.json({
      success: true,
      recommendations_found: recommendations.length,
      auto_implemented: implemented,
      requires_review: requiresReview
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function parseClaudeRecommendations(response) {
  // Vereinfachtes Parsing (in Produktion würde strukturiertes JSON-Response verwendet)
  const recommendations = [];

  // Suche nach Sections in Claude-Response
  if (response.includes('WISSENSBASIS-UPDATE') || response.includes('UPDATE_KNOWLEDGE_RULE')) {
    recommendations.push({
      type: 'UPDATE_KNOWLEDGE_RULE',
      auto_implementable: true,
      confidence: 0.95,
      priority: 8
    });
  }

  if (response.includes('ADD_COST_CATEGORY')) {
    recommendations.push({
      type: 'ADD_COST_CATEGORY',
      auto_implementable: true,
      confidence: 0.9,
      priority: 6
    });
  }

  if (response.includes('UPDATE_VALIDATION_RULE')) {
    recommendations.push({
      type: 'UPDATE_VALIDATION_RULE',
      auto_implementable: false,
      confidence: 0.8,
      priority: 7
    });
  }

  return recommendations;
}

async function implementRecommendation(base44, recommendation) {
  console.log('[IMPLEMENT]', recommendation.type);

  switch (recommendation.type) {
    case 'UPDATE_KNOWLEDGE_RULE':
      await base44.entities.LegalKnowledgeBase.create({
        knowledge_category: 'STEUERRECHT',
        topic: 'Auto-Generated from Claude Report',
        current_rule: 'Updated rule from Claude analysis',
        rule_source: 'Claude AI Recommendation',
        affected_legal_forms: ['PRIVATPERSON', 'GBR', 'GMBH'],
        affected_modules: [],
        confidence_threshold: 85,
        is_active: true
      });
      break;

    case 'ADD_COST_CATEGORY':
      // Würde neue TaxCategoryMaster erstellen
      break;
  }
}