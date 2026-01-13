import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { entityType } = await req.json();

    // Fetch entities to validate
    const entities = await base44.entities[entityType]?.list?.() || [];
    const issues = [];
    let score = 100;

    // Validation rules by entity type
    const rules = {
      Invoice: [
        { check: (e) => !e.number, field: 'number', message: 'Rechnungsnummer fehlt', severity: 'error' },
        { check: (e) => !e.amount, field: 'amount', message: 'Betrag fehlt', severity: 'error' },
        { check: (e) => e.amount < 0, field: 'amount', message: 'Betrag ist negativ', severity: 'warning' }
      ],
      Contract: [
        { check: (e) => !e.tenant_id, field: 'tenant_id', message: 'Mieter nicht zugeordnet', severity: 'error' },
        { check: (e) => !e.start_date, field: 'start_date', message: 'Startdatum fehlt', severity: 'error' },
        { check: (e) => e.start_date > e.end_date, field: 'dates', message: 'Enddatum vor Startdatum', severity: 'error' }
      ]
    };

    // Run validations
    const applicableRules = rules[entityType] || [];
    entities.forEach(entity => {
      applicableRules.forEach(rule => {
        if (rule.check(entity)) {
          issues.push({
            ...rule,
            entityId: entity.id
          });
          score -= 5;
        }
      });
    });

    const summary = issues.length === 0
      ? 'Alle Daten sind valide'
      : `${issues.filter(i => i.severity === 'error').length} kritische Fehler gefunden`;

    return Response.json({
      data: {
        issues: issues.slice(0, 20),
        score: Math.max(0, score),
        summary: summary,
        totalIssues: issues.length
      }
    });

  } catch (error) {
    console.error('Validation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});