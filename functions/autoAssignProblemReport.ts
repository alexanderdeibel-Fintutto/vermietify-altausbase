import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { report_id } = await req.json();

    const reports = await base44.entities.UserProblem.filter({ id: report_id });
    if (!reports || reports.length === 0) {
      return Response.json({ error: 'Report not found' }, { status: 404 });
    }

    const report = reports[0];

    // Auto-Assignment basierend auf Business-Area
    const areaAssignments = {
      auth_login: 'security-team@example.com',
      finances: 'backend-team@example.com',
      objects: 'core-team@example.com',
      tenants: 'core-team@example.com',
      documents: 'frontend-team@example.com',
      taxes: 'backend-team@example.com',
      operating_costs: 'backend-team@example.com',
      reports: 'data-team@example.com',
      dashboard: 'frontend-team@example.com',
      settings: 'platform-team@example.com'
    };

    const suggestedAssignee = areaAssignments[report.business_area] || 'platform-team@example.com';

    // Auto-Estimate für Fix-Aufwand
    let estimatedEffort = 'medium';
    if (report.functional_severity === 'cosmetic' || report.ux_severity === 'polish_opportunity') {
      estimatedEffort = 'quick_fix';
    } else if (report.functional_severity === 'minor_bug' || report.ux_severity === 'inconvenient') {
      estimatedEffort = 'small';
    } else if (report.functional_severity === 'app_breaking' || report.ux_severity === 'unusable') {
      estimatedEffort = 'large';
    } else if (report.business_impact === 'revenue_blocking' || report.business_impact === 'compliance_risk') {
      estimatedEffort = 'medium';
    }

    await base44.asServiceRole.entities.UserProblem.update(report_id, {
      assigned_to: suggestedAssignee,
      estimated_fix_effort: estimatedEffort,
      status: 'triaged'
    });

    return Response.json({ 
      success: true,
      assigned_to: suggestedAssignee,
      estimated_effort: estimatedEffort
    });

  } catch (error) {
    console.error('Error auto-assigning report:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});