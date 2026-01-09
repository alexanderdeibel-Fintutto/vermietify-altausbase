import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const problemData = body;

    if (!problemData) {
      return Response.json({ success: false, error: 'Problem data erforderlich' }, { status: 400 });
    }

    // Priority calculation algorithm
    let priorityScore = 0;
    let breakdown = {};

    // 1. FUNCTIONAL SEVERITY (0-400 points)
    const functionalSeverity = {
      'app_breaking': 400,
      'feature_blocking': 300,
      'workflow_impacting': 200,
      'minor_bug': 100,
      'cosmetic': 50
    };

    const functionalScore = functionalSeverity[problemData.functional_severity] || 0;
    breakdown.functional = functionalScore;
    priorityScore += functionalScore;

    // 2. DATA LOSS / BLOCKING (0-300 points)
    if (problemData.functional_details?.causes_data_loss) priorityScore += 300;
    if (problemData.functional_details?.breaks_core_workflow) priorityScore += 250;
    breakdown.data_loss_and_blocking = 
      (problemData.functional_details?.causes_data_loss ? 300 : 0) +
      (problemData.functional_details?.breaks_core_workflow ? 250 : 0);

    // 3. REPRODUCIBILITY (0-100 points)
    const reproducibility = {
      'always': 100,
      'sometimes': 60,
      'intermittent': 40,
      'once': 20
    };
    const reproduceScore = reproducibility[problemData.functional_details?.reproducible] || 0;
    breakdown.reproducibility = reproduceScore;
    priorityScore += reproduceScore;

    // 4. BUSINESS IMPACT (0-300 points)
    const businessImpact = {
      'revenue_blocking': 300,
      'compliance_risk': 280,
      'user_retention_risk': 200,
      'efficiency_impact': 100,
      'nice_to_have': 20
    };
    const businessScore = businessImpact[problemData.business_impact] || 0;
    breakdown.business_impact = businessScore;
    priorityScore += businessScore;

    // 5. AFFECTED USERS (0-200 points)
    const userCount = {
      'all_users': 200,
      'most_users': 150,
      'some_users': 100,
      'few_users': 50,
      'single_user': 20
    };
    const userScore = userCount[problemData.affected_user_count_estimate] || 0;
    breakdown.user_count = userScore;
    priorityScore += userScore;

    // 6. COMPLIANCE / LEGAL (0-250 points)
    if (problemData.business_details?.affects_legal_compliance) priorityScore += 250;
    if (problemData.business_details?.affects_billing) priorityScore += 180;
    breakdown.compliance = 
      (problemData.business_details?.affects_legal_compliance ? 250 : 0) +
      (problemData.business_details?.affects_billing ? 180 : 0);

    // 7. USER JOURNEY STAGE (0-150 points)
    const journeyStage = {
      'first_login': 150,
      'onboarding': 140,
      'daily_work': 120,
      'monthly_tasks': 80,
      'yearly_tasks': 40,
      'edge_case': 20
    };
    const journeyScore = journeyStage[problemData.user_journey_stage] || 0;
    breakdown.user_journey = journeyScore;
    priorityScore += journeyScore;

    // 8. UX SEVERITY (0-100 points)
    const uxSeverity = {
      'unusable': 100,
      'highly_confusing': 80,
      'moderately_confusing': 60,
      'inconvenient': 30,
      'polish_opportunity': 10
    };
    const uxScore = uxSeverity[problemData.ux_severity] || 0;
    breakdown.ux_severity = uxScore;
    priorityScore += uxScore;

    // 9. ACCESSIBILITY (0-150 points)
    if (problemData.ux_details?.accessibility_issue) {
      priorityScore += 150;
      breakdown.accessibility = 150;
    }

    // Normalize to 0-1000 range if it exceeds
    const maxScore = 400 + 550 + 100 + 300 + 200 + 430 + 150 + 100 + 150;
    const normalizedScore = Math.min(priorityScore, 1000);

    // Determine priority level
    let businessPriority = 'p4_low';
    if (normalizedScore >= 800) businessPriority = 'p1_critical';
    else if (normalizedScore >= 600) businessPriority = 'p2_high';
    else if (normalizedScore >= 400) businessPriority = 'p3_medium';

    return Response.json({
      success: true,
      priority_score: normalizedScore,
      business_priority: businessPriority,
      breakdown: breakdown,
      raw_score: priorityScore,
      max_possible: maxScore
    });
  } catch (error) {
    console.error('Priority calculation error:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});