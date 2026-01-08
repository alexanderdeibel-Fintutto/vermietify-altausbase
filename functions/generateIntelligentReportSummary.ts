import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { date_from, date_to, summary_type = "weekly" } = await req.json();

    const reports = await base44.asServiceRole.entities.UserProblem.list();
    
    const filteredReports = reports.filter(r => {
      if (!r.created_date) return false;
      const created = new Date(r.created_date);
      return created >= new Date(date_from) && created <= new Date(date_to);
    });

    // EXECUTIVE SUMMARY
    const criticalReports = filteredReports.filter(r => r.business_priority === "p1_critical");
    const highReports = filteredReports.filter(r => r.business_priority === "p2_high");
    const resolvedReports = filteredReports.filter(r => r.status === "resolved" || r.status === "Gelöst");
    
    const avgResolutionTime = resolvedReports.length > 0
      ? resolvedReports.reduce((sum, r) => sum + (r.loesungszeit_stunden || 0), 0) / resolvedReports.length
      : 0;

    const executiveSummary = {
      total_reports: filteredReports.length,
      critical_blockers: criticalReports.length,
      high_priority: highReports.length,
      avg_resolution_time: avgResolutionTime.toFixed(1),
      unresolved_critical: criticalReports.filter(r => r.status !== "resolved" && r.status !== "Gelöst").length
    };

    // BUSINESS IMPACT ANALYSIS
    const businessImpactAnalysis = {
      revenue_blocking_count: filteredReports.filter(r => r.business_impact === "revenue_blocking").length,
      compliance_risk_count: filteredReports.filter(r => r.business_impact === "compliance_risk").length,
      onboarding_blocking_issues: filteredReports.filter(r => 
        r.user_journey_stage === "onboarding" && r.business_priority !== "p4_low"
      ).length
    };

    // TOP PROBLEMBEREICHE
    const areaGroups = {};
    filteredReports.forEach(r => {
      const area = r.business_area || r.betroffenes_modul || "unknown";
      if (!areaGroups[area]) {
        areaGroups[area] = [];
      }
      areaGroups[area].push(r);
    });

    const areaAnalysis = Object.entries(areaGroups).map(([area, items]) => {
      const avgPriority = items.reduce((sum, r) => sum + (r.priority_score || 0), 0) / items.length;
      const criticalCount = items.filter(r => r.business_priority === "p1_critical").length;
      
      return {
        area,
        count: items.length,
        avg_priority_score: avgPriority,
        critical_count: criticalCount
      };
    }).sort((a, b) => b.avg_priority_score - a.avg_priority_score);

    // FUNKTIONALITÄT vs UX
    const functionalBugs = filteredReports.filter(r => r.problem_type === "functional_bug");
    const uxIssues = filteredReports.filter(r => r.problem_type === "ux_issue");

    const functionalityVsUxAnalysis = {
      functional_bugs: {
        count: functionalBugs.length,
        avg_priority: functionalBugs.length > 0 
          ? functionalBugs.reduce((sum, r) => sum + (r.priority_score || 0), 0) / functionalBugs.length 
          : 0,
        critical_count: functionalBugs.filter(r => r.business_priority === "p1_critical").length
      },
      ux_issues: {
        count: uxIssues.length,
        avg_priority: uxIssues.length > 0 
          ? uxIssues.reduce((sum, r) => sum + (r.priority_score || 0), 0) / uxIssues.length 
          : 0,
        usability_blocking: uxIssues.filter(r => r.ux_severity === "unusable").length
      }
    };

    // RECOMMENDATIONS
    const recommendations = {
      immediate_actions: [],
      focus_areas: [],
      process_improvements: []
    };

    if (criticalReports.length > 0) {
      recommendations.immediate_actions.push({
        action: "Critical Blockers beheben",
        reason: `${criticalReports.length} kritische Issues blockieren Kern-Funktionalität`,
        affected_areas: [...new Set(criticalReports.map(r => r.business_area || r.betroffenes_modul).filter(Boolean))]
      });
    }

    if (businessImpactAnalysis.onboarding_blocking_issues > 3) {
      recommendations.immediate_actions.push({
        action: "Onboarding-Bugs priorisieren",
        reason: `${businessImpactAnalysis.onboarding_blocking_issues} Issues blockieren neue User`,
        affected_areas: ["onboarding"]
      });
    }

    areaAnalysis.slice(0, 3).forEach(area => {
      if (area.critical_count > 0 || area.avg_priority_score > 100) {
        recommendations.focus_areas.push({
          area: area.area,
          reason: `${area.count} Issues mit durchschnittlich ${Math.round(area.avg_priority_score)} Priority-Score`,
          priority_level: area.critical_count > 0 ? "urgent" : "high"
        });
      }
    });

    if (functionalBugs.length > uxIssues.length * 2) {
      recommendations.process_improvements.push({
        improvement: "Unit-Testing verbessern",
        reason: "Hohe Anzahl funktionaler Bugs deutet auf Testing-Lücken hin"
      });
    }

    // STAKEHOLDER SUMMARY
    const stakeholderSummary = `
📊 ${summary_type.toUpperCase()} REPORT (${new Date(date_from).toLocaleDateString('de-DE')} - ${new Date(date_to).toLocaleDateString('de-DE')})

ZUSAMMENFASSUNG:
• ${filteredReports.length} Reports gesamt
• ${criticalReports.length} kritische Blocker
• ${executiveSummary.unresolved_critical} ungelöste kritische Issues
• Ø ${avgResolutionTime.toFixed(1)}h Lösungszeit

TOP PROBLEMBEREICHE:
${areaAnalysis.slice(0, 5).map((a, i) => `${i + 1}. ${a.area}: ${a.count} Issues (${a.critical_count} kritisch)`).join('\n')}

⚠️ SOFORTMASSNAHMEN ERFORDERLICH:
${recommendations.immediate_actions.map(a => `• ${a.action}: ${a.reason}`).join('\n')}
    `.trim();

    const summary = {
      summary_type,
      date_from,
      date_to,
      generated_by: user.id,
      total_reports: filteredReports.length,
      reports_by_priority: {
        p1: criticalReports.length,
        p2: highReports.length,
        p3: filteredReports.filter(r => r.business_priority === "p3_medium").length,
        p4: filteredReports.filter(r => r.business_priority === "p4_low").length
      },
      reports_by_area: Object.fromEntries(
        Object.entries(areaGroups).map(([k, v]) => [k, v.length])
      ),
      resolution_stats: {
        avg_resolution_time: avgResolutionTime,
        resolved_count: resolvedReports.length
      },
      top_problem_areas: areaAnalysis.slice(0, 10),
      most_critical_issues: filteredReports
        .filter(r => r.business_priority === "p1_critical")
        .sort((a, b) => (b.priority_score || 0) - (a.priority_score || 0))
        .slice(0, 10)
        .map(r => ({ id: r.id, title: r.problem_titel, score: r.priority_score })),
      revenue_blocking_issues: filteredReports
        .filter(r => r.business_impact === "revenue_blocking")
        .map(r => r.id),
      compliance_risk_issues: filteredReports
        .filter(r => r.business_impact === "compliance_risk")
        .map(r => r.id),
      onboarding_blocking_issues: filteredReports
        .filter(r => r.user_journey_stage === "onboarding" && r.business_priority !== "p4_low")
        .map(r => r.id),
      immediate_actions_needed: recommendations.immediate_actions,
      suggested_focus_areas: recommendations.focus_areas,
      stakeholder_summary: stakeholderSummary,
      technical_summary: JSON.stringify({
        functionality_vs_ux: functionalityVsUxAnalysis,
        area_analysis: areaAnalysis,
        recommendations: recommendations
      }, null, 2)
    };

    const createdSummary = await base44.asServiceRole.entities.ProblemReportSummary.create(summary);

    return Response.json(createdSummary);

  } catch (error) {
    console.error('Error generating report summary:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});