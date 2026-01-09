import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const deadlines = [
      // Germany
      {
        country: 'DE',
        title: 'Einkommensteuererklärung',
        deadline_date: '2026-07-31',
        deadline_type: 'submission',
        priority: 'critical',
        applicable_entities: ['individual'],
        days_before_reminder: [30, 14, 7, 3, 1],
        extension_possible: true,
        extension_deadline: '2027-02-28',
        late_payment_interest_rate: 0.5
      },
      {
        country: 'DE',
        title: 'Körperschaftsteuererklärung',
        deadline_date: '2026-08-31',
        deadline_type: 'submission',
        priority: 'critical',
        applicable_entities: ['corporation'],
        days_before_reminder: [30, 14, 7],
        extension_possible: true,
        extension_deadline: '2027-03-31',
        late_payment_interest_rate: 0.5
      },
      // Austria
      {
        country: 'AT',
        title: 'Einkommensteuererklärung',
        deadline_date: '2026-06-30',
        deadline_type: 'submission',
        priority: 'critical',
        applicable_entities: ['individual'],
        days_before_reminder: [30, 14, 7, 3, 1],
        extension_possible: true,
        extension_deadline: '2026-12-31',
        late_payment_interest_rate: 0.48
      },
      // Switzerland
      {
        country: 'CH',
        title: 'Kantonale Steuererklärung',
        deadline_date: '2026-03-31',
        deadline_type: 'submission',
        priority: 'high',
        applicable_entities: ['individual'],
        days_before_reminder: [30, 14, 7],
        extension_possible: true,
        extension_deadline: '2026-05-31',
        late_payment_interest_rate: 0.5
      }
    ];

    const created = await base44.asServiceRole.entities.TaxDeadline.bulkCreate(deadlines);

    return Response.json({
      status: 'success',
      created: created.length,
      message: `${created.length} tax deadlines created`
    });
  } catch (error) {
    console.error('Seed deadlines error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});