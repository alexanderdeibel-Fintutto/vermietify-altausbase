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

    // Fetch all relevant data
    const [filings, calculations, documents, alerts, deadlines, compliance] = await Promise.all([
      base44.entities.TaxFiling.filter({ user_email: user.email, country, tax_year: taxYear }),
      base44.entities.TaxCalculation.filter({ user_email: user.email, country, tax_year: taxYear }),
      base44.entities.TaxDocument.filter({ user_email: user.email, country, tax_year: taxYear }),
      base44.entities.TaxAlert.filter({ user_email: user.email, country, is_resolved: false }),
      base44.entities.TaxDeadline.filter({ country, deadline_date: { $gte: new Date().toISOString().split('T')[0] } }),
      base44.entities.TaxCompliance.filter({ user_email: user.email, country, tax_year: taxYear })
    ]);

    // Calculate summary statistics
    const totalTax = calculations.reduce((sum, c) => sum + (c.total_tax || 0), 0);
    const documentCount = documents.length;
    const unresolvedAlerts = alerts.length;
    const complianceRate = compliance.length > 0 
      ? (compliance.filter(c => c.status === 'completed').length / compliance.length * 100).toFixed(0)
      : 0;

    // Determine overall status
    let overallStatus = 'on_track';
    if (unresolvedAlerts > 5 || complianceRate < 50) {
      overallStatus = 'at_risk';
    } else if (unresolvedAlerts > 2) {
      overallStatus = 'needs_attention';
    }

    // Generate recommendations
    const recommendations = [];
    if (documentCount < 10) {
      recommendations.push('Sammeln Sie mehr Belege zur vollständigen Dokumentation');
    }
    if (unresolvedAlerts > 0) {
      recommendations.push(`Lösen Sie ${unresolvedAlerts} ausstehende Alerts`);
    }
    if (complianceRate < 100) {
      recommendations.push('Vervollständigen Sie alle Compliance-Anforderungen');
    }
    if (recommendations.length === 0) {
      recommendations.push('Alle Anforderungen sind erfüllt - Steuererklärung bereit');
    }

    return Response.json({
      status: 'success',
      report: {
        country,
        tax_year: taxYear,
        generated_at: new Date().toISOString(),
        summary: {
          total_tax: totalTax,
          documents_collected: documentCount,
          unresolved_alerts: unresolvedAlerts,
          compliance_rate: parseFloat(complianceRate),
          overall_status: overallStatus
        },
        filings: {
          count: filings.length,
          status: filings[0]?.status || 'draft',
          completion_percentage: filings[0]?.completion_percentage || 0
        },
        calculations: {
          count: calculations.length,
          total_tax: totalTax
        },
        documents: {
          count: documentCount,
          by_type: documents.reduce((acc, d) => {
            acc[d.document_type] = (acc[d.document_type] || 0) + 1;
            return acc;
          }, {})
        },
        alerts: {
          count: unresolvedAlerts,
          critical: alerts.filter(a => a.severity === 'critical').length,
          warnings: alerts.filter(a => a.severity === 'warning').length
        },
        deadlines: {
          total: deadlines.length,
          urgent: deadlines.filter(d => {
            const daysUntil = Math.floor((new Date(d.deadline_date) - new Date()) / (1000 * 60 * 60 * 24));
            return daysUntil <= 14;
          }).length
        },
        compliance: {
          total: compliance.length,
          completed: compliance.filter(c => c.status === 'completed').length,
          pending: compliance.filter(c => c.status === 'pending').length,
          at_risk: compliance.filter(c => c.status === 'at_risk').length
        },
        recommendations
      }
    });
  } catch (error) {
    console.error('Tax report generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});