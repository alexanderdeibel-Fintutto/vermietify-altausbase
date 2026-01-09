import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { country, taxYear } = await req.json();

    if (!country || !taxYear) {
      return Response.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Fetch compliance data
    const [compliance, documents, filings, alerts, deadlines] = await Promise.all([
      base44.entities.TaxCompliance.filter({ user_email: user.email, country, tax_year: taxYear }) || [],
      base44.entities.TaxDocument.filter({ user_email: user.email, country, tax_year: taxYear }) || [],
      base44.entities.TaxFiling.filter({ user_email: user.email, country, tax_year: taxYear }) || [],
      base44.entities.TaxAlert.filter({ user_email: user.email, country, is_resolved: false }) || [],
      base44.entities.TaxDeadline.filter({ country, is_active: true }) || []
    ]);

    // Calculate compliance metrics
    const totalRequirements = compliance.length;
    const completedRequirements = compliance.filter(c => c.status === 'completed').length;
    const pendingRequirements = compliance.filter(c => c.status === 'pending').length;
    const atRiskRequirements = compliance.filter(c => c.status === 'at_risk').length;

    const complianceRate = totalRequirements > 0 ? (completedRequirements / totalRequirements) * 100 : 0;
    const documentCompleteness = (documents.length / 15) * 100;
    const filingStatus = filings.length > 0 && filings.some(f => f.status === 'submitted') ? 100 : 0;

    // Use LLM to generate compliance report
    const report = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate a comprehensive compliance report for a taxpayer in ${country} for tax year ${taxYear}.

Compliance Status:
- Total Requirements: ${totalRequirements}
- Completed: ${completedRequirements}
- Pending: ${pendingRequirements}
- At Risk: ${atRiskRequirements}
- Overall Completion Rate: ${Math.round(complianceRate)}%

Documents:
- Collected: ${documents.length}/15 (${Math.round(documentCompleteness)}%)
- Types: ${[...new Set(documents.map(d => d.document_type))].join(', ')}

Filing Status:
- Forms Prepared: ${filings.length}
- Submitted: ${filings.filter(f => f.status === 'submitted').length}

Unresolved Issues:
- Total Alerts: ${alerts.length}
- Critical: ${alerts.filter(a => a.severity === 'critical').length}

Requirements Summary:
${compliance.map(c => `- ${c.requirement} (${c.status}): ${c.completion_percentage}% complete`).join('\n')}

Provide a detailed compliance report including:
1. Overall Compliance Status
2. Key Achievements
3. Areas at Risk
4. Priority Actions Required
5. Recommendations for Full Compliance
6. Risk Assessment
7. Timeline for Completion
8. Critical Path Items`,
      response_json_schema: {
        type: 'object',
        properties: {
          overall_status: { type: 'string' },
          compliance_score: { type: 'number' },
          key_achievements: { type: 'array', items: { type: 'string' } },
          risk_areas: { type: 'array', items: { type: 'string' } },
          priority_actions: { type: 'array', items: { type: 'string' } },
          recommendations: { type: 'array', items: { type: 'string' } },
          timeline_estimate: { type: 'string' },
          critical_items: { type: 'array', items: { type: 'string' } },
          next_steps: { type: 'string' }
        }
      }
    });

    return Response.json({
      status: 'success',
      report: {
        country,
        tax_year: taxYear,
        generated_at: new Date().toISOString(),
        metrics: {
          compliance_rate: Math.round(complianceRate),
          documentation_completeness: Math.round(documentCompleteness),
          filing_status: Math.round(filingStatus),
          alert_count: alerts.length,
          critical_alerts: alerts.filter(a => a.severity === 'critical').length
        },
        requirements_breakdown: {
          total: totalRequirements,
          completed: completedRequirements,
          pending: pendingRequirements,
          at_risk: atRiskRequirements
        },
        requirements_details: compliance.map(c => ({
          requirement: c.requirement,
          status: c.status,
          completion: c.completion_percentage,
          deadline: c.deadline,
          risk_flags: c.risk_flags || []
        })),
        overall_status: report.overall_status || 'In Progress',
        compliance_score: report.compliance_score || 50,
        key_achievements: report.key_achievements || [],
        risk_areas: report.risk_areas || [],
        priority_actions: report.priority_actions || [],
        recommendations: report.recommendations || [],
        timeline_estimate: report.timeline_estimate || '',
        critical_items: report.critical_items || [],
        next_steps: report.next_steps || ''
      }
    });
  } catch (error) {
    console.error('Generate compliance report error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});