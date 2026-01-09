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

    // Fetch audit-relevant data
    const [documents, filings, compliance, calculations, alerts] = await Promise.all([
      base44.entities.TaxDocument.filter({ user_email: user.email, country, tax_year: taxYear }),
      base44.entities.TaxFiling.filter({ user_email: user.email, country, tax_year: taxYear }),
      base44.entities.TaxCompliance.filter({ user_email: user.email, country, tax_year: taxYear }),
      base44.entities.TaxCalculation.filter({ user_email: user.email, country, tax_year: taxYear }),
      base44.entities.TaxAlert.filter({ user_email: user.email, country, is_resolved: false })
    ]);

    // Use LLM to assess audit readiness
    const assessment = await base44.integrations.Core.InvokeLLM({
      prompt: `Assess tax audit readiness for a taxpayer in ${country} for tax year ${taxYear}.

Documentation Status:
- Tax Documents Collected: ${documents.length}
- Document Types: ${[...new Set(documents.map(d => d.document_type))].join(', ')}
- Filing Status: ${filings[0]?.status || 'not filed'}
- Filing Completeness: ${filings[0]?.completion_percentage || 0}%

Compliance Status:
- Total Requirements: ${compliance.length}
- Completed: ${compliance.filter(c => c.status === 'completed').length}
- Pending: ${compliance.filter(c => c.status === 'pending').length}
- At Risk: ${compliance.filter(c => c.status === 'at_risk').length}

Unresolved Issues:
- Tax Alerts: ${alerts.length}
- Critical Issues: ${alerts.filter(a => a.severity === 'critical').length}

Provide a detailed audit readiness assessment including:
1. Overall Readiness Score (0-100)
2. Strengths in documentation/compliance
3. Weaknesses and risk areas
4. Specific areas that could trigger audit focus
5. Documentation gaps
6. Recommended improvements
7. Timeline recommendations
8. Priority actions to improve readiness`,
      response_json_schema: {
        type: 'object',
        properties: {
          readiness_score: { type: 'number' },
          risk_level: { type: 'string' },
          strengths: { type: 'array', items: { type: 'string' } },
          weaknesses: { type: 'array', items: { type: 'string' } },
          documentation_gaps: { type: 'array', items: { type: 'string' } },
          audit_risk_areas: { type: 'array', items: { type: 'string' } },
          priority_improvements: { type: 'array', items: { type: 'string' } },
          summary: { type: 'string' }
        }
      }
    });

    // Calculate detailed metrics
    const docCompleteness = documents.length >= 15 ? 100 : (documents.length / 15) * 100;
    const complianceRate = compliance.length > 0 
      ? (compliance.filter(c => c.status === 'completed').length / compliance.length) * 100 
      : 0;
    const filingRate = filings.length > 0 ? 100 : 0;
    const alertSeverity = alerts.length > 0 ? (alerts.filter(a => a.severity === 'critical').length / alerts.length) * 100 : 0;

    return Response.json({
      status: 'success',
      assessment: {
        country,
        tax_year: taxYear,
        overall_readiness_score: assessment.readiness_score || 50,
        risk_level: assessment.risk_level || 'medium',
        metrics: {
          documentation_completeness: Math.round(docCompleteness),
          compliance_rate: Math.round(complianceRate),
          filing_rate: Math.round(filingRate),
          critical_issues_percentage: Math.round(alertSeverity)
        },
        documentation_status: {
          total_documents: documents.length,
          documents_by_type: Object.entries(
            documents.reduce((acc, d) => {
              acc[d.document_type] = (acc[d.document_type] || 0) + 1;
              return acc;
            }, {})
          ).map(([type, count]) => ({ type, count }))
        },
        compliance_status: {
          total_requirements: compliance.length,
          completed: compliance.filter(c => c.status === 'completed').length,
          pending: compliance.filter(c => c.status === 'pending').length,
          at_risk: compliance.filter(c => c.status === 'at_risk').length
        },
        audit_indicators: {
          unresolved_alerts: alerts.length,
          critical_issues: alerts.filter(a => a.severity === 'critical').length,
          warning_issues: alerts.filter(a => a.severity === 'warning').length
        },
        strengths: assessment.strengths || [],
        weaknesses: assessment.weaknesses || [],
        documentation_gaps: assessment.documentation_gaps || [],
        audit_risk_areas: assessment.audit_risk_areas || [],
        priority_improvements: assessment.priority_improvements || [],
        summary: assessment.summary || ''
      }
    });
  } catch (error) {
    console.error('Audit readiness assessment error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});