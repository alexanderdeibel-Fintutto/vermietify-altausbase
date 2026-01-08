import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { filter } = await req.json();

    // Alle relevanten Problems holen
    let problems;
    if (filter) {
      problems = await base44.asServiceRole.entities.UserProblem.filter(filter);
    } else {
      problems = await base44.asServiceRole.entities.UserProblem.list('-created_date', 1000);
    }

    const updated = [];
    const errors = [];

    // Für jedes Problem Priorität neu berechnen
    for (const problem of problems) {
      try {
        // Priorität berechnen mit derselben Logik wie calculateIntelligentPriority
        const result = await calculatePriority(problem);
        
        await base44.asServiceRole.entities.UserProblem.update(problem.id, {
          priority_score: result.priority_score,
          business_priority: result.business_priority,
          priority_breakdown: result.priority_breakdown
        });

        updated.push({
          id: problem.id,
          title: problem.problem_titel,
          old_priority: problem.business_priority,
          new_priority: result.business_priority,
          score: result.priority_score
        });

      } catch (error) {
        errors.push({
          id: problem.id,
          error: error.message
        });
      }
    }

    return Response.json({
      success: true,
      total_processed: problems.length,
      updated: updated.length,
      errors: errors.length,
      updated_items: updated,
      error_items: errors
    });

  } catch (error) {
    console.error('Error batch recalculating priorities:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function calculatePriority(problem) {
  let functionalScore = 0;
  switch (problem.functional_severity) {
    case 'app_breaking': functionalScore = 300; break;
    case 'feature_blocking': functionalScore = 200; break;
    case 'workflow_impacting': functionalScore = 100; break;
    case 'minor_bug': functionalScore = 50; break;
    case 'cosmetic': functionalScore = 10; break;
  }

  const details = problem.functional_details || {};
  if (details.causes_data_loss) functionalScore += 100;
  if (details.breaks_core_workflow) functionalScore += 50;
  if (!details.has_workaround) functionalScore += 30;
  if (details.affects_multiple_users) functionalScore += 20;
  if (details.reproducible === 'always') functionalScore += 20;

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

  let journeyScore = 0;
  switch (problem.user_journey_stage) {
    case 'first_login': journeyScore = 100; break;
    case 'onboarding': journeyScore = 90; break;
    case 'daily_work': journeyScore = 60; break;
    case 'monthly_tasks': journeyScore = 30; break;
    case 'yearly_tasks': journeyScore = 10; break;
    case 'edge_case': journeyScore = 5; break;
  }

  let userCountScore = 0;
  switch (problem.affected_user_count_estimate) {
    case 'all_users': userCountScore = 100; break;
    case 'most_users': userCountScore = 80; break;
    case 'some_users': userCountScore = 50; break;
    case 'few_users': userCountScore = 20; break;
    case 'single_user': userCountScore = 5; break;
  }

  const totalScore = functionalScore + uxScore + businessScore + journeyScore + userCountScore;

  let businessPriority;
  if (totalScore >= 700) businessPriority = 'p1_critical';
  else if (totalScore >= 450) businessPriority = 'p2_high';
  else if (totalScore >= 200) businessPriority = 'p3_medium';
  else businessPriority = 'p4_low';

  return {
    priority_score: totalScore,
    business_priority: businessPriority,
    priority_breakdown: {
      functional_score: functionalScore,
      ux_score: uxScore,
      business_score: businessScore,
      journey_score: journeyScore,
      user_count_score: userCountScore,
      total_score: totalScore
    }
  };
}