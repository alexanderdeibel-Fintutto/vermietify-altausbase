import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { invoice_id, tenant_id } = await req.json();

    if (!invoice_id || !tenant_id) {
      return Response.json({ error: 'Missing fields' }, { status: 400 });
    }

    const invoice = await base44.asServiceRole.entities.Invoice.read(invoice_id);
    const tenant = await base44.asServiceRole.entities.Tenant.read(tenant_id);
    const contract = await base44.asServiceRole.entities.LeaseContract.filter(
      { tenant_id },
      '-created_date',
      1
    );

    const prompt = `Generiere eine höfliche und professionelle Zahlungserinnerungs-Email auf Deutsch für einen Mieter.

Mieter: ${tenant.first_name} ${tenant.last_name}
Rechnungsnummer: ${invoice.invoice_number}
Betrag: €${invoice.total_amount}
Fälligkeitsdatum: ${new Date(invoice.due_date).toLocaleDateString('de-DE')}
Wohnung/Einheit: ${contract[0]?.unit_id || 'N/A'}

Die Email sollte:
1. Den Mieter höflich ansprechen
2. Die Rechnungsdetails enthalten
3. Eine Zahlungsaufforderung mit der Bitte um baldige Zahlung enthalten
4. Zahlungsoptionen erwähnen (online Portal)
5. Kontaktinformation für Fragen anbieten

Gib nur die Email aus, ohne Anführungszeichen oder Formatierung.`;

    const emailContent = await base44.integrations.Core.InvokeLLM({
      prompt,
    });

    return Response.json({
      subject: `Zahlungserinnerung: Rechnung ${invoice.invoice_number}`,
      content: emailContent,
    });
  } catch (error) {
    console.error('Rent reminder generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});