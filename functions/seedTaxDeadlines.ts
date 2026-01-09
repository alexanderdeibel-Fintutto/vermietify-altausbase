import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const currentYear = new Date().getFullYear();
    
    const deadlines = [
      // Germany 2026
      {
        country: 'DE',
        title: 'Einkommensteuererklärung 2025',
        description: 'Frist für Einreichung der Steuererklärung',
        deadline_date: '2026-05-31',
        tax_year: 2025,
        deadline_type: 'submission',
        priority: 'critical',
        reminder_days_before: 30
      },
      {
        country: 'DE',
        title: 'Anlage KAP einreichen',
        description: 'Kapitalvermögen-Anlage',
        deadline_date: '2026-05-31',
        tax_year: 2025,
        deadline_type: 'documentation',
        priority: 'high',
        reminder_days_before: 21
      },
      {
        country: 'DE',
        title: 'Steuerzahlung 2025',
        description: 'Zahlung der Einkommensteuer',
        deadline_date: '2026-06-15',
        tax_year: 2025,
        deadline_type: 'payment',
        priority: 'critical',
        reminder_days_before: 14
      },
      // Austria 2026
      {
        country: 'AT',
        title: 'Steuererklärung Österreich 2025',
        description: 'Frist für Einreichung der E1kv',
        deadline_date: '2026-05-31',
        tax_year: 2025,
        deadline_type: 'submission',
        priority: 'critical',
        reminder_days_before: 30
      },
      {
        country: 'AT',
        title: 'E1kv Kapitalvermögen',
        description: 'Beilage E1kv einreichen',
        deadline_date: '2026-05-31',
        tax_year: 2025,
        deadline_type: 'documentation',
        priority: 'high',
        reminder_days_before: 21
      },
      // Switzerland 2026
      {
        country: 'CH',
        title: 'Steuererklärung Schweiz 2025 - Zürich',
        description: 'Steuerdeklaration Kanton Zürich',
        deadline_date: '2026-03-31',
        tax_year: 2025,
        deadline_type: 'submission',
        priority: 'critical',
        reminder_days_before: 45
      },
      {
        country: 'CH',
        title: 'Vermögenssteuer Erklärung',
        description: 'Vermögenssteuer einreichen',
        deadline_date: '2026-03-31',
        tax_year: 2025,
        deadline_type: 'documentation',
        priority: 'high',
        reminder_days_before: 60
      }
    ];

    const created = [];
    for (const deadline of deadlines) {
      const result = await base44.entities.TaxDeadline.create(deadline);
      created.push(result);
    }

    return Response.json({
      success: true,
      created: created.length,
      deadlines: created
    });
  } catch (error) {
    console.error('Seed error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});