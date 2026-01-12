import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { contract_id, proposed_rent } = await req.json();

    const contract = await base44.entities.LeaseContract.filter({ id: contract_id }).then(r => r[0]);
    if (!contract) {
      return Response.json({ error: 'Contract not found' }, { status: 404 });
    }

    const unit = await base44.entities.Unit.filter({ id: contract.unit_id }).then(r => r[0]);
    const building = await base44.entities.Building.filter({ id: unit.gebaeude_id }).then(r => r[0]);

    const currentRent = contract.kaltmiete;
    const increase = proposed_rent - currentRent;
    const increasePercent = (increase / currentRent * 100);

    // Check Kappungsgrenze (15% in 3 Jahren)
    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);

    const recentIncreases = await base44.entities.RentChange.filter({
      contract_id: contract_id
    });

    const relevantIncreases = recentIncreases.filter(inc => 
      new Date(inc.gueltig_ab) >= threeYearsAgo
    );

    const totalIncrease = relevantIncreases.reduce((sum, inc) => sum + (inc.erhoehung_betrag || 0), 0) + increase;
    const totalIncreasePercent = (totalIncrease / currentRent * 100);
    const kappungsgrenze_ok = totalIncreasePercent <= 15;

    // Check local rent index
    const rentIndices = await base44.entities.RentIndex.filter({
      city: building.city,
      wohnlage: unit.mietspiegel_lage || 'Mittel'
    });

    const relevantIndex = rentIndices.find(idx => {
      const unitArea = unit.wohnflaeche_qm;
      const inAreaRange = (!idx.qm_von || unitArea >= idx.qm_von) && 
                         (!idx.qm_bis || unitArea <= idx.qm_bis);
      return inAreaRange;
    });

    let within_local_index = null;
    let mietpreisbremse_ok = true;

    if (relevantIndex) {
      const proposedPerSqm = proposed_rent / unit.wohnflaeche_qm;
      within_local_index = proposedPerSqm >= relevantIndex.miete_min && 
                          proposedPerSqm <= relevantIndex.miete_max;

      if (relevantIndex.mietpreisbremse_aktiv) {
        mietpreisbremse_ok = proposedPerSqm <= (relevantIndex.miete_mittel * 1.1);
      }
    }

    const isLegal = kappungsgrenze_ok && mietpreisbremse_ok;

    return Response.json({
      current_rent: currentRent,
      proposed_rent: proposed_rent,
      increase: increase,
      increase_percent: increasePercent.toFixed(2),
      checks: {
        kappungsgrenze_ok,
        kappungsgrenze_percent: totalIncreasePercent.toFixed(2),
        within_local_index,
        mietpreisbremse_ok,
        local_index: relevantIndex
      },
      is_legal: isLegal,
      recommendation: isLegal 
        ? 'Mieterhöhung ist rechtlich zulässig'
        : 'Mieterhöhung überschreitet gesetzliche Grenzen'
    });
  } catch (error) {
    console.error('Rent increase check error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});