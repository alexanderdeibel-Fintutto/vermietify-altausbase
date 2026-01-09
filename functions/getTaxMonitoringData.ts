import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { country } = await req.json();

    const [filings, deadlines, alerts] = await Promise.all([
      base44.entities.TaxFiling.filter({ user_email: user.email, country }, '-updated_date', 10),
      base44.entities.TaxDeadline.filter({ country }, 'deadline_date', 10),
      base44.entities.TaxAlert.filter({ user_email: user.email, is_read: false }, '-created_at', 5)
    ]);

    return Response.json({
      success: true,
      filings: filings.map(f => ({
        id: f.id,
        tax_year: f.tax_year,
        status: f.status,
        completion_percentage: f.completion_percentage || 0,
        updated_date: f.updated_date
      })),
      upcoming_deadlines: deadlines.slice(0, 5).map(d => ({
        id: d.id,
        title: d.title,
        deadline_date: d.deadline_date,
        days_remaining: Math.ceil((new Date(d.deadline_date) - new Date()) / (1000 * 60 * 60 * 24)),
        priority: d.priority
      })),
      pending_alerts: alerts.map(a => ({
        id: a.id,
        type: a.alert_type,
        title: a.title,
        severity: a.severity
      })),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});