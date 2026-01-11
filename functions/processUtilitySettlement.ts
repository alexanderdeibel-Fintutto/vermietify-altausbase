import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { settlement_id, action } = await req.json();
    const settlement = await base44.asServiceRole.entities.UtilitySettlement.read(settlement_id);

    const balance = settlement.actual_costs - settlement.advance_payments;

    if (action === 'calculate') {
      await base44.asServiceRole.entities.UtilitySettlement.update(settlement_id, {
        balance: Math.round(balance * 100) / 100
      });

      return Response.json({ 
        success: true, 
        balance: Math.round(balance * 100) / 100,
        type: balance > 0 ? 'Nachzahlung' : 'Rückerstattung'
      });
    }

    if (action === 'send') {
      const contract = await base44.asServiceRole.entities.LeaseContract.read(settlement.contract_id);
      const tenant = await base44.asServiceRole.entities.Tenant.read(settlement.tenant_id);

      await base44.integrations.Core.SendEmail({
        to: tenant.email,
        subject: 'Nebenkostenabrechnung',
        body: `Sehr geehrte/r ${tenant.first_name} ${tenant.last_name},

anbei erhalten Sie Ihre Nebenkostenabrechnung für den Zeitraum ${settlement.period_start} bis ${settlement.period_end}.

Vorauszahlungen: ${settlement.advance_payments}€
Tatsächliche Kosten: ${settlement.actual_costs}€
${balance > 0 ? 'Nachzahlung' : 'Rückerstattung'}: ${Math.abs(balance)}€

Mit freundlichen Grüßen`
      });

      await base44.asServiceRole.entities.UtilitySettlement.update(settlement_id, {
        status: 'sent'
      });

      return Response.json({ success: true });
    }

    if (action === 'mark_paid') {
      await base44.asServiceRole.entities.UtilitySettlement.update(settlement_id, {
        status: balance > 0 ? 'paid' : 'refunded',
        payment_date: new Date().toISOString().split('T')[0]
      });

      return Response.json({ success: true });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});