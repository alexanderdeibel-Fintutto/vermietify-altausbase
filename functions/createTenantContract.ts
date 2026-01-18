import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { 
      unit_id, 
      tenant_id, 
      beginn_datum,
      kaltmiete,
      nebenkosten_vorauszahlung,
      kaution_betrag,
      vertragsart 
    } = payload;

    // Validate unit is available
    const existingContracts = await base44.entities.LeaseContract.filter({ 
      unit_id, 
      status: 'Aktiv' 
    });
    
    if (existingContracts.length > 0) {
      return Response.json({ 
        error: 'Unit already has an active contract' 
      }, { status: 400 });
    }

    // Create contract
    const contract = await base44.entities.LeaseContract.create({
      unit_id,
      tenant_id,
      beginn_datum,
      kaltmiete: parseFloat(kaltmiete),
      nebenkosten_vorauszahlung: parseFloat(nebenkosten_vorauszahlung),
      kaution_betrag: parseFloat(kaution_betrag),
      vertragsart: vertragsart || 'Unbefristet',
      status: 'Aktiv',
      zahlungsweise: 'Monatlich'
    });

    // Create initial deposit record
    if (kaution_betrag > 0) {
      await base44.entities.Deposit.create({
        contract_id: contract.id,
        tenant_id,
        betrag: parseFloat(kaution_betrag),
        status: 'hinterlegt',
        hinterlegungsdatum: beginn_datum,
        typ: 'Barkaution'
      });
    }

    // Create welcome task
    await base44.entities.Task.create({
      titel: `Mietvertrag erstellen - ${tenant_id}`,
      beschreibung: 'Mietvertrag generieren und zur Unterschrift senden',
      prioritaet: 'Hoch',
      kategorie: 'Verwaltung',
      status: 'Offen',
      contract_id: contract.id,
      faelligkeitsdatum: beginn_datum
    });

    return Response.json({
      success: true,
      contract_id: contract.id
    });

  } catch (error) {
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});