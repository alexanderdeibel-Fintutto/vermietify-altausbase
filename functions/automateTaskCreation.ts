import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Admin-only scheduled task
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const today = new Date();
    const in30Days = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
    const in90Days = new Date(today.getTime() + (90 * 24 * 60 * 60 * 1000));

    let tasksCreated = 0;

    // Check expiring contracts
    const contracts = await base44.asServiceRole.entities.LeaseContract.list();
    
    for (const contract of contracts) {
      if (contract.ende_datum && contract.status === 'Aktiv') {
        const endDate = new Date(contract.ende_datum);
        
        // 90 days before: renewal reminder
        if (endDate >= today && endDate <= in90Days) {
          const existing = await base44.asServiceRole.entities.Task.filter({
            contract_id: contract.id,
            kategorie: 'Frist',
            status: 'Offen'
          });

          if (existing.length === 0) {
            await base44.asServiceRole.entities.Task.create({
              titel: 'Vertragsverlängerung prüfen',
              beschreibung: `Mietvertrag läuft am ${contract.ende_datum} aus`,
              prioritaet: 'Hoch',
              kategorie: 'Frist',
              contract_id: contract.id,
              faelligkeitsdatum: new Date(endDate.getTime() - (60 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
              status: 'Offen'
            });
            tasksCreated++;
          }
        }
      }
    }

    // Check insurance expiration
    const insurances = await base44.asServiceRole.entities.InsurancePolicy.filter({ 
      status: 'Aktiv' 
    });
    
    for (const insurance of insurances) {
      if (insurance.vertragsende) {
        const endDate = new Date(insurance.vertragsende);
        
        if (endDate >= today && endDate <= in90Days) {
          const existing = await base44.asServiceRole.entities.Task.filter({
            quelle_typ: 'InsurancePolicy',
            quelle_id: insurance.id,
            status: 'Offen'
          });

          if (existing.length === 0) {
            await base44.asServiceRole.entities.Task.create({
              titel: `Versicherung ${insurance.versicherungsart} prüfen`,
              beschreibung: `Versicherung läuft am ${insurance.vertragsende} aus`,
              prioritaet: 'Mittel',
              kategorie: 'Frist',
              building_id: insurance.building_id,
              quelle_typ: 'InsurancePolicy',
              quelle_id: insurance.id,
              faelligkeitsdatum: new Date(endDate.getTime() - (30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
              status: 'Offen'
            });
            tasksCreated++;
          }
        }
      }
    }

    return Response.json({
      success: true,
      tasks_created: tasksCreated
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});