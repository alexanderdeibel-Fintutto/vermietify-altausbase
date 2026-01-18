import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { contract_id } = payload;

    const contract = await base44.entities.LeaseContract.get(contract_id);
    const tenant = await base44.entities.Tenant.get(contract.tenant_id);
    const unit = await base44.entities.Unit.get(contract.unit_id);
    const building = await base44.entities.Building.get(unit.building_id);

    const totalRent = (contract.kaltmiete || 0) + (contract.nebenkosten_vorauszahlung || 0);

    await base44.integrations.Core.SendEmail({
      from_name: 'Vermitify',
      to: tenant.email,
      subject: 'Erinnerung: Mietzahlung fällig',
      body: `
Sehr geehrte/r ${tenant.name},

dies ist eine freundliche Erinnerung, dass die Miete für ${unit.bezeichnung || unit.einheit_nummer} 
in ${building.adresse} zum ${new Date().toLocaleDateString('de-DE')} fällig ist.

Betrag: ${totalRent.toFixed(2)} €
Kaltmiete: ${contract.kaltmiete?.toFixed(2) || 0} €
Nebenkosten: ${contract.nebenkosten_vorauszahlung?.toFixed(2) || 0} €

Bitte überweisen Sie den Betrag auf das hinterlegte Konto.

Mit freundlichen Grüßen
Ihre Hausverwaltung
      `
    });

    await base44.entities.Notification.create({
      title: 'Mieterinnerung versendet',
      message: `Zahlungserinnerung an ${tenant.name} gesendet`,
      type: 'success',
      recipient_email: user.email
    });

    return Response.json({ success: true });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});