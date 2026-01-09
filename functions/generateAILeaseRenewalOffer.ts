import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { tenant_id, contract_id, new_rent_amount, renewal_terms } = await req.json();

    if (!tenant_id || !contract_id) {
      return Response.json({ error: 'Missing fields' }, { status: 400 });
    }

    const tenant = await base44.asServiceRole.entities.Tenant.read(tenant_id);
    const contract = await base44.asServiceRole.entities.LeaseContract.read(contract_id);

    const prompt = `Generiere ein professionelles Mietvertragsverlängerungs-Angebot auf Deutsch.

Mieter: ${tenant.first_name} ${tenant.last_name}
Aktuelle Miete: €${contract.monthly_rent}
Neue Miete: €${new_rent_amount || contract.monthly_rent}
Vertragsendet: ${new Date(contract.end_date).toLocaleDateString('de-DE')}
Bedingungen: ${renewal_terms || 'Standard'}

Das Angebot sollte:
1. Den Mieter höflich ansprechen
2. Die bisherigen guten Erfahrungen erwähnen
3. Die neuen Vertragsbedingungen deutlich darstellen
4. Die neue Miete und Änderungen erklären
5. Eine Annahmefrist setzen
6. Kontakt für Fragen anbieten
7. Warm und einladend wirken

Gib nur das Angebot aus, ohne Anführungszeichen oder Formatierung.`;

    const offerContent = await base44.integrations.Core.InvokeLLM({
      prompt,
    });

    return Response.json({
      subject: `Angebot zur Mietvertragsverlängerung`,
      content: offerContent,
    });
  } catch (error) {
    console.error('Lease renewal offer generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});