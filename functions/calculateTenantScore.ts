import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { tenant_id } = await req.json();

  const payments = await base44.entities.Payment.filter({ tenant_id }, null, 100);
  const onTimePayments = payments.filter(p => !p.is_late).length;
  const payment_score = (onTimePayments / payments.length * 100) || 85;

  const communication_score = 90;
  const maintenance_score = 88;
  const total_score = Math.round((payment_score + communication_score + maintenance_score) / 3);

  const risk_level = total_score > 80 ? 'low' : total_score > 60 ? 'medium' : 'high';

  return Response.json({
    total_score,
    payment_score: Math.round(payment_score),
    communication_score,
    maintenance_score,
    risk_level
  });
});