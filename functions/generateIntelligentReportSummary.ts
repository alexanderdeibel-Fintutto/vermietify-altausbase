import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { summary_type, date_from, date_to } = await req.json();

    const fromDate = new Date(date_from);
    const toDate = new Date(date_to);

    // Alle Reports im Zeitraum holen
    const allReports = await base44.asServiceRole.entities.UserProblem.list('-created_date', 1000);
    const reports = allReports.filter(r => {
      const reportDate = new Date(r.created_date);
      return reportDate >= fromDate && reportDate <= toDate;
    });

    // Statistiken berechnen
    const reportsByPriority = {
      p1: reports.filter(r => r.business_priority === 'p1_critical').length,
      p2: reports.filter(r => r.business_priority === 'p2_high').length,
      p3: reports.filter(r => r.business_priority === 'p3_medium').length,
      p4: reports.filter(r => r.business_priority === 'p4_low').length
    };

    const reportsByArea = reports.reduce((acc, r) => {
      acc[r.business_area] = (acc[r.business_area] || 0) + 1;
      return acc;
    }, {});

    // Resolution Stats
    const resolvedReports = reports.filter(r => r.status === 'resolved' && r.resolution_time);
    const avgResolutionTime = resolvedReports.length > 0
      ? resolvedReports.reduce((sum, r) => sum + r.resolution_time, 0) / resolvedReports.length
      : 0;

    // Top Problem Areas
    const topProblems = Object.entries(reportsByArea)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([area, count]) => ({ area, count, percentage: (count / reports.length * 100).toFixed(1) }));

    // Critical Issues
    const criticalIssues = reports
      .filter(r => r.business_priority === 'p1_critical' && r.status !== 'resolved')
      .sort((a, b) => (b.priority_score || 0) - (a.priority_score || 0))
      .slice(0, 10)
      .map(r => ({
        id: r.id,
        title: r.problem_titel,
        priority_score: r.priority_score,
        business_area: r.business_area,
        created_date: r.created_date,
        affects_users: r.affected_user_count_estimate
      }));

    // Trending Issues (häufige Reports)
    const trendingIssues = reports
      .filter(r => r.frequency_count > 1)
      .sort((a, b) => (b.frequency_count || 0) - (a.frequency_count || 0))
      .slice(0, 10)
      .map(r => ({
        id: r.id,
        title: r.problem_titel,
        frequency: r.frequency_count,
        trend: r.trend_direction,
        last_occurrence: r.last_occurrence
      }));

    // Revenue-Blocking Issues
    const revenueBlocking = reports
      .filter(r => r.business_impact === 'revenue_blocking' && r.status !== 'resolved')
      .map(r => r.id);

    // Compliance Risks
    const complianceRisks = reports
      .filter(r => r.business_impact === 'compliance_risk' && r.status !== 'resolved')
      .map(r => r.id);

    // Onboarding Blockers
    const onboardingBlockers = reports
      .filter(r => r.user_journey_stage === 'onboarding' && r.status !== 'resolved')
      .map(r => r.id);

    // Immediate Actions
    const immediateActions = [];
    if (revenueBlocking.length > 0) {
      immediateActions.push({
        priority: 'critical',
        action: `${revenueBlocking.length} Revenue-blockierende Issues sofort beheben`,
        issue_ids: revenueBlocking
      });
    }
    if (complianceRisks.length > 0) {
      immediateActions.push({
        priority: 'high',
        action: `${complianceRisks.length} Compliance-Risiken adressieren`,
        issue_ids: complianceRisks
      });
    }
    if (criticalIssues.length > 0) {
      immediateActions.push({
        priority: 'high',
        action: `${criticalIssues.length} kritische Issues bearbeiten`,
        issue_ids: criticalIssues.map(i => i.id)
      });
    }

    // Suggested Focus Areas
    const focusAreas = topProblems.slice(0, 3).map(area => ({
      area: area.area,
      count: area.count,
      recommendation: `Fokus auf ${area.area} - ${area.percentage}% aller Reports`
    }));

    // Stakeholder Summary
    const stakeholderSummary = `
Im Zeitraum ${date_from} bis ${date_to} wurden ${reports.length} Problem-Reports erfasst.
${reportsByPriority.p1} kritische, ${reportsByPriority.p2} hohe Priorität.
Durchschnittliche Lösungszeit: ${avgResolutionTime.toFixed(1)} Stunden.
${revenueBlocking.length > 0 ? `⚠️ ${revenueBlocking.length} Revenue-blockierende Issues!` : ''}
Top-Problembereiche: ${topProblems.slice(0, 3).map(p => p.area).join(', ')}.
    `.trim();

    // Summary erstellen
    const summary = await base44.asServiceRole.entities.ProblemReportSummary.create({
      summary_type,
      date_from: fromDate.toISOString(),
      date_to: toDate.toISOString(),
      generated_by: user.id,
      total_reports: reports.length,
      reports_by_priority: reportsByPriority,
      reports_by_area: reportsByArea,
      resolution_stats: {
        total_resolved: resolvedReports.length,
        avg_resolution_hours: avgResolutionTime,
        resolution_rate: (resolvedReports.length / reports.length * 100).toFixed(1)
      },
      top_problem_areas: topProblems,
      most_critical_issues: criticalIssues,
      trending_issues: trendingIssues,
      revenue_blocking_issues: revenueBlocking,
      compliance_risk_issues: complianceRisks,
      onboarding_blocking_issues: onboardingBlockers,
      immediate_actions_needed: immediateActions,
      suggested_focus_areas: focusAreas,
      stakeholder_summary: stakeholderSummary
    });

    return Response.json({
      summary,
      insights: {
        total_reports: reports.length,
        critical_count: reportsByPriority.p1,
        avg_resolution_hours: avgResolutionTime,
        top_problem_area: topProblems[0]?.area,
        needs_immediate_action: immediateActions.length > 0
      }
    });

  } catch (error) {
    console.error('Error generating report summary:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});