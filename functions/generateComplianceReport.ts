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

    const requirements = {
      AT: [
        { type: 'filing_deadline', requirement: 'Steuererklärung einreichen', deadline_offset: 180 },
        { type: 'documentation', requirement: 'Anlage KAP vorbereiten', deadline_offset: 120 },
        { type: 'documentation', requirement: 'Rechnungen sammeln', deadline_offset: 90 },
        { type: 'record_retention', requirement: 'Belege 7 Jahre aufbewahren', deadline_offset: -2555 },
        { type: 'audit_readiness', requirement: 'Bankkontoauszüge archivieren', deadline_offset: 60 },
        { type: 'tax_law_change', requirement: 'KESt-Regelung aktualisieren', deadline_offset: 30 }
      ],
      CH: [
        { type: 'filing_deadline', requirement: 'Steuererklärung (Bund) einreichen', deadline_offset: 74 },
        { type: 'filing_deadline', requirement: 'Kantonale Steuererklärung einreichen', deadline_offset: 90 },
        { type: 'documentation', requirement: 'Wertschriftenverzeichnis', deadline_offset: 60 },
        { type: 'documentation', requirement: 'Liegenschaftenverzeichnis', deadline_offset: 60 },
        { type: 'record_retention', requirement: 'Steuerunterlagen 10 Jahre aufbewahren', deadline_offset: -3650 },
        { type: 'audit_readiness', requirement: 'Vermögensaufstellung', deadline_offset: 30 }
      ],
      DE: [
        { type: 'filing_deadline', requirement: 'Einkommensteuer-Erklärung', deadline_offset: 152 },
        { type: 'filing_deadline', requirement: 'ELSTER-Submission', deadline_offset: 152 },
        { type: 'documentation', requirement: 'Kontoauszüge für Abgeltungssteuer', deadline_offset: 90 },
        { type: 'documentation', requirement: 'Anlage U (Überschusseinkünfte)', deadline_offset: 120 },
        { type: 'record_retention', requirement: 'Geschäftsunterlagen 10 Jahre archivieren', deadline_offset: -3650 },
        { type: 'audit_readiness', requirement: 'Kassenführung prüfen', deadline_offset: 30 }
      ]
    };

    const countryReqs = requirements[country] || [];
    const currentYear = new Date().getFullYear();
    const taxYearStart = new Date(taxYear, 0, 1);

    const compliance = [];

    for (const req of countryReqs) {
      const deadline = new Date(taxYearStart);
      deadline.setDate(deadline.getDate() + req.deadline_offset);

      const daysUntil = Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24));
      let status = 'pending';
      let priority = 'medium';

      if (daysUntil < 0) {
        status = 'overdue';
        priority = 'critical';
      } else if (daysUntil < 7) {
        status = 'at_risk';
        priority = 'critical';
      } else if (daysUntil < 30) {
        priority = 'high';
      }

      const riskFlags = [];
      if (daysUntil < 0) riskFlags.push('Überfällig');
      if (daysUntil < 7 && daysUntil >= 0) riskFlags.push('Kurzfristig');
      if (req.type === 'record_retention') riskFlags.push('Langfristige Aufbewahrung');

      compliance.push({
        user_email: user.email,
        country,
        tax_year: taxYear,
        compliance_type: req.type,
        requirement: req.requirement,
        description: `${req.requirement} für Steuerjahr ${taxYear}`,
        status,
        priority,
        deadline: deadline.toISOString().split('T')[0],
        completion_percentage: status === 'completed' ? 100 : 0,
        risk_flags: riskFlags,
        required_documents: [],
        documents_collected: []
      });
    }

    // Calculate statistics
    const stats = {
      total: compliance.length,
      completed: compliance.filter(c => c.status === 'completed').length,
      at_risk: compliance.filter(c => c.status === 'at_risk').length,
      overdue: compliance.filter(c => c.status === 'overdue').length,
      overall_compliance_score: Math.round(
        (compliance.filter(c => c.status === 'completed').length / compliance.length) * 100
      )
    };

    return Response.json({
      status: 'success',
      country,
      tax_year: taxYear,
      generated_at: new Date().toISOString(),
      compliance_items: compliance,
      statistics: stats
    });
  } catch (error) {
    console.error('Compliance report error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});