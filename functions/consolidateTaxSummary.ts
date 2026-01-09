import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taxYear } = await req.json();

    if (!taxYear) {
      return Response.json({ error: 'Missing tax year' }, { status: 400 });
    }

    // Fetch all tax data across all countries
    const [
      atCalcs, chCalcs, deCalcs,
      atFiled, chFiled, deFiled,
      atDocs, chDocs, deDocs,
      atCompliance, chCompliance, deCompliance,
      atAlerts, chAlerts, deAlerts
    ] = await Promise.all([
      base44.entities.TaxCalculation.filter({ user_email: user.email, country: 'AT', tax_year: taxYear }) || [],
      base44.entities.TaxCalculation.filter({ user_email: user.email, country: 'CH', tax_year: taxYear }) || [],
      base44.entities.TaxCalculation.filter({ user_email: user.email, country: 'DE', tax_year: taxYear }) || [],
      base44.entities.TaxFiling.filter({ user_email: user.email, country: 'AT', tax_year: taxYear }) || [],
      base44.entities.TaxFiling.filter({ user_email: user.email, country: 'CH', tax_year: taxYear }) || [],
      base44.entities.TaxFiling.filter({ user_email: user.email, country: 'DE', tax_year: taxYear }) || [],
      base44.entities.TaxDocument.filter({ user_email: user.email, country: 'AT', tax_year: taxYear }) || [],
      base44.entities.TaxDocument.filter({ user_email: user.email, country: 'CH', tax_year: taxYear }) || [],
      base44.entities.TaxDocument.filter({ user_email: user.email, country: 'DE', tax_year: taxYear }) || [],
      base44.entities.TaxCompliance.filter({ user_email: user.email, country: 'AT', tax_year: taxYear }) || [],
      base44.entities.TaxCompliance.filter({ user_email: user.email, country: 'CH', tax_year: taxYear }) || [],
      base44.entities.TaxCompliance.filter({ user_email: user.email, country: 'DE', tax_year: taxYear }) || [],
      base44.entities.TaxAlert.filter({ user_email: user.email, country: 'AT', tax_year: taxYear }) || [],
      base44.entities.TaxAlert.filter({ user_email: user.email, country: 'CH', tax_year: taxYear }) || [],
      base44.entities.TaxAlert.filter({ user_email: user.email, country: 'DE', tax_year: taxYear }) || []
    ]);

    const summary = {
      AT: {
        total_tax: atCalcs.reduce((s, c) => s + (c.total_tax || 0), 0),
        filings: atFiled.length,
        submitted: atFiled.filter(f => f.status === 'submitted').length,
        documents: atDocs.length,
        compliance: atCompliance.length,
        completed_compliance: atCompliance.filter(c => c.status === 'completed').length,
        alerts: atAlerts.length,
        critical_alerts: atAlerts.filter(a => a.severity === 'critical').length
      },
      CH: {
        total_tax: chCalcs.reduce((s, c) => s + (c.total_tax || 0), 0),
        filings: chFiled.length,
        submitted: chFiled.filter(f => f.status === 'submitted').length,
        documents: chDocs.length,
        compliance: chCompliance.length,
        completed_compliance: chCompliance.filter(c => c.status === 'completed').length,
        alerts: chAlerts.length,
        critical_alerts: chAlerts.filter(a => a.severity === 'critical').length
      },
      DE: {
        total_tax: deCalcs.reduce((s, c) => s + (c.total_tax || 0), 0),
        filings: deFiled.length,
        submitted: deFiled.filter(f => f.status === 'submitted').length,
        documents: deDocs.length,
        compliance: deCompliance.length,
        completed_compliance: deCompliance.filter(c => c.status === 'completed').length,
        alerts: deAlerts.length,
        critical_alerts: deAlerts.filter(a => a.severity === 'critical').length
      }
    };

    const consolidation = await base44.integrations.Core.InvokeLLM({
      prompt: `Create consolidated tax summary for tax year ${taxYear} across all DACH countries.

Summary Data:
${JSON.stringify(summary, null, 2)}

Provide:
1. Overall tax burden summary
2. Filing progress status
3. Documentation completeness
4. Compliance status overview
5. Critical alerts summary
6. Key actions needed
7. Overall readiness score`,
      response_json_schema: {
        type: 'object',
        properties: {
          overall_status: { type: 'string' },
          total_tax_burden: { type: 'number' },
          filing_progress: { type: 'number' },
          documentation_completeness: { type: 'number' },
          compliance_rate: { type: 'number' },
          overall_readiness: { type: 'number' },
          critical_issues: { type: 'array', items: { type: 'string' } },
          key_actions: { type: 'array', items: { type: 'string' } },
          next_milestones: { type: 'array', items: { type: 'string' } }
        }
      }
    });

    return Response.json({
      status: 'success',
      summary: {
        tax_year: taxYear,
        countries: summary,
        consolidation: consolidation
      }
    });
  } catch (error) {
    console.error('Consolidate tax summary error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});