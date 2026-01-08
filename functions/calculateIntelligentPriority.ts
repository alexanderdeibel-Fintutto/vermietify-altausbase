import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const calculateProblemPriority = (report) => {
  let baseScore = 0;
  const breakdown = {
    functional_impact: 0,
    ux_impact: 0,
    business_criticality: 0,
    user_impact: 0,
    frequency_bonus: 0,
    urgency_factor: 0
  };

  // 1. FUNKTIONALE SCHWERE (0-200 Punkte)
  if (report.problem_type === "functional_bug" && report.functional_severity) {
    const functionalScores = {
      app_breaking: 200,
      feature_blocking: 150,
      workflow_impacting: 100,
      minor_bug: 50,
      cosmetic: 10
    };
    
    breakdown.functional_impact = functionalScores[report.functional_severity] || 0;
    baseScore += breakdown.functional_impact;
    
    if (report.functional_details) {
      if (report.functional_details.causes_data_loss) baseScore += 100;
      if (report.functional_details.breaks_core_workflow) baseScore += 50;
      if (report.functional_details.affects_multiple_users) baseScore += 25;
      if (!report.functional_details.has_workaround) baseScore += 30;
      if (report.functional_details.reproducible === "always") baseScore += 20;
    }
  }

  // 2. UX SCHWERE (0-100 Punkte)
  if (report.problem_type === "ux_issue" && report.ux_severity) {
    const uxScores = {
      unusable: 80,
      highly_confusing: 50,
      moderately_confusing: 30,
      inconvenient: 15,
      polish_opportunity: 5
    };
    
    breakdown.ux_impact = uxScores[report.ux_severity] || 0;
    baseScore += breakdown.ux_impact;
    
    if (report.ux_details) {
      if (report.ux_details.prevents_task_completion) baseScore += 40;
      if (report.ux_details.requires_external_help) baseScore += 25;
      if (report.ux_details.accessibility_issue) baseScore += 20;
    }
  }

  // 3. BUSINESS-KRITIKALITÄT (Multiplikator)
  const businessAreaWeights = {
    auth_login: 3.0,
    finances: 2.8,
    objects: 2.5,
    tenants: 2.5,
    documents: 2.0,
    taxes: 2.0,
    operating_costs: 2.0,
    reports: 1.5,
    dashboard: 1.3,
    settings: 1.0
  };
  
  const businessImpactWeights = {
    revenue_blocking: 2.5,
    compliance_risk: 2.2,
    user_retention_risk: 1.8,
    efficiency_impact: 1.4,
    nice_to_have: 1.0
  };
  
  const areaMultiplier = businessAreaWeights[report.business_area] || 1.0;
  const impactMultiplier = businessImpactWeights[report.business_impact] || 1.0;
  
  breakdown.business_criticality = baseScore * (areaMultiplier * impactMultiplier - 1);
  baseScore *= (areaMultiplier * impactMultiplier);

  // 4. USER-JOURNEY KRITIKALITÄT
  const journeyWeights = {
    first_login: 2.0,
    onboarding: 1.8,
    daily_work: 1.6,
    monthly_tasks: 1.2,
    yearly_tasks: 1.0,
    edge_case: 0.8
  };
  
  const journeyMultiplier = journeyWeights[report.user_journey_stage] || 1.0;
  breakdown.user_impact = baseScore * (journeyMultiplier - 1);
  baseScore *= journeyMultiplier;

  // 5. BETROFFENE USER-ANZAHL
  const userCountWeights = {
    all_users: 2.0,
    most_users: 1.7,
    some_users: 1.3,
    few_users: 1.0,
    single_user: 0.5
  };
  
  const userCountMultiplier = userCountWeights[report.affected_user_count_estimate] || 1.0;
  baseScore *= userCountMultiplier;

  // 6. HÄUFIGKEIT BONUS
  breakdown.frequency_bonus = Math.min((report.frequency_count || 1) * 8, 50);
  baseScore += breakdown.frequency_bonus;

  // 7. URGENCY FACTOR
  let urgencyBonus = 0;
  if (report.business_details) {
    if (report.business_details.affects_billing) urgencyBonus += 30;
    if (report.business_details.affects_legal_compliance) urgencyBonus += 40;
    if (report.business_details.affects_onboarding) urgencyBonus += 25;
    if (report.business_details.affects_data_accuracy) urgencyBonus += 20;
  }
  
  breakdown.urgency_factor = urgencyBonus;
  baseScore += urgencyBonus;

  // 8. ZEIT-FAKTOR
  if (report.created_date) {
    const ageInDays = (new Date() - new Date(report.created_date)) / (1000 * 60 * 60 * 24);
    const agePenalty = Math.min(ageInDays * 2, 20);
    baseScore = Math.max(baseScore - agePenalty, 0);
  }

  // 9. BUSINESS PRIORITY KLASSIFIZIERUNG
  let businessPriority;
  if (baseScore >= 300) businessPriority = "p1_critical";
  else if (baseScore >= 150) businessPriority = "p2_high";
  else if (baseScore >= 75) businessPriority = "p3_medium";
  else businessPriority = "p4_low";

  return {
    priority_score: Math.round(baseScore),
    business_priority: businessPriority,
    priority_breakdown: breakdown
  };
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { report_id } = await req.json();

    const report = await base44.entities.UserProblem.filter({ id: report_id });
    if (!report || report.length === 0) {
      return Response.json({ error: 'Report not found' }, { status: 404 });
    }

    const priorityResult = calculateProblemPriority(report[0]);

    await base44.asServiceRole.entities.UserProblem.update(report_id, {
      priority_score: priorityResult.priority_score,
      business_priority: priorityResult.business_priority,
      priority_breakdown: priorityResult.priority_breakdown
    });

    return Response.json(priorityResult);

  } catch (error) {
    console.error('Error calculating priority:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});