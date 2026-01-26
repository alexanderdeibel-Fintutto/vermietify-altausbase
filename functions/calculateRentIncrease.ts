import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { contract_id, proposed_rent, reason, local_reference_rent } = await req.json();

    const contract = await base44.asServiceRole.entities.LeaseContract.read(contract_id);
    const currentRent = contract.monthly_rent;

    const increaseAmount = proposed_rent - currentRent;
    const increasePercentage = (increaseAmount / currentRent) * 100;

    // Kappungsgrenze: Max 15% in 3 Jahren (vereinfacht: 5% pro Jahr)
    const threeYearCap = currentRent * 0.15;
    const isCompliant = increaseAmount <= threeYearCap;
    const maxAllowed = currentRent + threeYearCap;

    const rentIncrease = await base44.asServiceRole.entities.RentIncrease.create({
      contract_id,
      tenant_id: contract.tenant_id,
      company_id: contract.company_id,
      current_rent: currentRent,
      proposed_rent,
      increase_amount: Math.round(increaseAmount * 100) / 100,
      increase_percentage: Math.round(increasePercentage * 100) / 100,
      reason,
      local_reference_rent,
      cap_limit_check: {
        three_year_cap: Math.round(threeYearCap * 100) / 100,
        is_compliant: isCompliant,
        max_allowed: Math.round(maxAllowed * 100) / 100
      },
      notice_date: new Date().toISOString().split('T')[0],
      status: 'planned'
    });

    return Response.json({ 
      success: true, 
      rent_increase: rentIncrease,
      warning: !isCompliant ? 'Kappungsgrenze überschritten!' : null
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});