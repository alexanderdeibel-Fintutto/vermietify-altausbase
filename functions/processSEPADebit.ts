import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { mandate_id, amount, purpose } = await req.json();
    const mandate = await base44.asServiceRole.entities.SEPAMandate.read(mandate_id);

    if (mandate.status !== 'active') {
      return Response.json({ error: 'Mandate not active' }, { status: 400 });
    }

    // Simulate SEPA debit creation (in production, integrate with bank API)
    const debit = {
      mandate_reference: mandate.mandate_reference,
      iban: mandate.iban,
      bic: mandate.bic,
      account_holder: mandate.account_holder,
      amount,
      purpose,
      execution_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 5 days pre-notification
      status: 'pending'
    };

    await base44.asServiceRole.entities.SEPAMandate.update(mandate_id, {
      last_debit_date: new Date().toISOString().split('T')[0]
    });

    const tenant = await base44.asServiceRole.entities.Tenant.read(mandate.tenant_id);
    await base44.integrations.Core.SendEmail({
      to: tenant.email,
      subject: 'SEPA-Lastschrift Vorabinformation',
      body: `Sehr geehrte/r ${tenant.first_name} ${tenant.last_name},

hiermit informieren wir Sie über eine bevorstehende SEPA-Lastschrift:

Betrag: ${amount}€
Verwendungszweck: ${purpose}
Fälligkeitsdatum: ${debit.execution_date}
Mandatsreferenz: ${mandate.mandate_reference}

Mit freundlichen Grüßen`
    });

    return Response.json({ success: true, debit });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});