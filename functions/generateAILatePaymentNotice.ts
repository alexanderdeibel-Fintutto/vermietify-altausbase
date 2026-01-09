import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { invoice_id, tenant_id, days_overdue } = await req.json();

    if (!invoice_id || !tenant_id || !days_overdue) {
      return Response.json({ error: 'Missing fields' }, { status: 400 });
    }

    const invoice = await base44.asServiceRole.entities.Invoice.read(invoice_id);
    const tenant = await base44.asServiceRole.entities.Tenant.read(tenant_id);

    const prompt = `Generiere eine professionelle Mahnschreiben-Email auf Deutsch für einen Mieter mit überfälligen Zahlungen.

Mieter: ${tenant.first_name} ${tenant.last_name}
Rechnungsnummer: ${invoice.invoice_number}
Betrag: €${invoice.total_amount}
Ursprüngliches Fälligkeitsdatum: ${new Date(invoice.due_date).toLocaleDateString('de-DE')}
Tage überfällig: ${days_overdue}

Das Schreiben sollte:
1. Den Mieter höflich aber bestimmt ansprechen
2. Klar machen, dass die Zahlung überfällig ist
3. Zahlungskonsequenzen erwähnen (ohne Drohungen)
4. Eine Zahlungsfrist setzen (z.B. 5 Geschäftstage)
5. Einen Kontakt für Zahlungsvereinbarungen anbieten
6. Professional und sachlich bleiben

Gib nur das Schreiben aus, ohne Anführungszeichen oder Formatierung.`;

    const noticeContent = await base44.integrations.Core.InvokeLLM({
      prompt,
    });

    return Response.json({
      subject: `Zahlungsaufforderung: Rechnungs-Mahnung ${invoice.invoice_number}`,
      content: noticeContent,
    });
  } catch (error) {
    console.error('Late payment notice generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});