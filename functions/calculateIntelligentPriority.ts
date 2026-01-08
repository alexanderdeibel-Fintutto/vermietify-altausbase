import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { problem } = await req.json();

    // Funktionale Schwere berechnen (0-300 Punkte)
    let functionalScore = 0;
    switch (problem.functional_severity) {
      case 'app_breaking': functionalScore = 300; break;
      case 'feature_blocking': functionalScore = 200; break;
      case 'workflow_impacting': functionalScore = 100; break;
      case 'minor_bug': functionalScore = 50; break;
      case 'cosmetic': functionalScore = 10; break;
    }

    // Funktionale Details (0-100 Punkte)
    const details = problem.functional_details || {};
    if (details.causes_data_loss) functionalScore += 100;
    if (details.breaks_core_workflow) functionalScore += 50;
    if (!details.has_workaround) functionalScore += 30;
    if (details.affects_multiple_users) functionalScore += 20;
    if (details.reproducible === 'always') functionalScore += 20;

    // UX Schweregrad (0-200 Punkte)
    let uxScore = 0;
    switch (problem.ux_severity) {
      case 'unusable': uxScore = 200; break;
      case 'highly_confusing': uxScore = 150; break;
      case 'moderately_confusing': uxScore = 80; break;
      case 'inconvenient': uxScore = 40; break;
      case 'polish_opportunity': uxScore = 10; break;
    }

    const uxDetails = problem.ux_details || {};
    if (uxDetails.prevents_task_completion) uxScore += 50;
    if (uxDetails.requires_external_help) uxScore += 30;
    if (uxDetails.accessibility_issue) uxScore += 20;

    // Business Impact (0-400 Punkte)
    let businessScore = 0;
    switch (problem.business_impact) {
      case 'revenue_blocking': businessScore = 400; break;
      case 'compliance_risk': businessScore = 350; break;
      case 'user_retention_risk': businessScore = 200; break;
      case 'efficiency_impact': businessScore = 100; break;
      case 'nice_to_have': businessScore = 20; break;
    }

    const businessDetails = problem.business_details || {};
    if (businessDetails.affects_billing) businessScore += 100;
    if (businessDetails.affects_legal_compliance) businessScore += 80;
    if (businessDetails.affects_daily_workflow) businessScore += 50;
    if (businessDetails.affects_onboarding) businessScore += 40;

    // User Journey Stage (0-100 Punkte)
    let journeyScore = 0;
    switch (problem.user_journey_stage) {
      case 'first_login': journeyScore = 100; break;
      case 'onboarding': journeyScore = 90; break;
      case 'daily_work': journeyScore = 60; break;
      case 'monthly_tasks': journeyScore = 30; break;
      case 'yearly_tasks': journeyScore = 10; break;
      case 'edge_case': journeyScore = 5; break;
    }

    // Betroffene User (0-100 Punkte)
    let userCountScore = 0;
    switch (problem.affected_user_count_estimate) {
      case 'all_users': userCountScore = 100; break;
      case 'most_users': userCountScore = 80; break;
      case 'some_users': userCountScore = 50; break;
      case 'few_users': userCountScore = 20; break;
      case 'single_user': userCountScore = 5; break;
    }

    // Gesamtscore berechnen
    const totalScore = functionalScore + uxScore + businessScore + journeyScore + userCountScore;

    // Business Priority ableiten
    let businessPriority;
    if (totalScore >= 700) businessPriority = 'p1_critical';
    else if (totalScore >= 450) businessPriority = 'p2_high';
    else if (totalScore >= 200) businessPriority = 'p3_medium';
    else businessPriority = 'p4_low';

    // Detaillierte Aufschlüsselung
    const breakdown = {
      functional_score: functionalScore,
      ux_score: uxScore,
      business_score: businessScore,
      journey_score: journeyScore,
      user_count_score: userCountScore,
      total_score: totalScore,
      factors: {
        data_loss: details.causes_data_loss,
        blocks_workflow: details.breaks_core_workflow,
        no_workaround: !details.has_workaround,
        affects_multiple: details.affects_multiple_users,
        always_reproducible: details.reproducible === 'always',
        prevents_completion: uxDetails.prevents_task_completion,
        needs_help: uxDetails.requires_external_help,
        accessibility: uxDetails.accessibility_issue,
        revenue_impact: businessDetails.affects_billing,
        compliance: businessDetails.affects_legal_compliance,
        daily_workflow: businessDetails.affects_daily_workflow,
        onboarding_impact: businessDetails.affects_onboarding
      }
    };

    return Response.json({
      priority_score: totalScore,
      business_priority: businessPriority,
      priority_breakdown: breakdown,
      recommendation: totalScore >= 700 
        ? 'Sofortige Bearbeitung erforderlich - kritisches Problem'
        : totalScore >= 450
        ? 'Hohe Priorität - schnelle Bearbeitung empfohlen'
        : totalScore >= 200
        ? 'Mittlere Priorität - in nächsten Sprint einplanen'
        : 'Niedrige Priorität - Backlog'
    });

  } catch (error) {
    console.error('Error calculating priority:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});