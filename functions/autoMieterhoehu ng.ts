import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { contract_id, percentage, effective_date } = await req.json();

    const contract = await base44.entities.LeaseContract.read(contract_id);
    if (!contract) return Response.json({ error: 'Vertrag nicht gefunden' }, { status: 404 });

    const old_rent = contract.rent_amount || 0;
    const new_rent = old_rent * (1 + percentage / 100);
    const increase_amount = new_rent - old_rent;

    // Check 3-year rule: not more than 20% every 3 years
    const now = new Date();
    const threeYearsAgo = new Date(now.getFullYear() - 3, now.getMonth(), now.getDate());

    const recentIncreases = await base44.entities.RentChange?.filter?.({
      contract_id: contract_id,
      effective_date: { $gte: threeYearsAgo.toISOString() }
    }) || [];

    const totalIncreasePercent = recentIncreases.reduce((sum, change) => sum + (change.percentage || 0), 0) + percentage;

    return Response.json({
      contract_id: contract_id,
      old_rent: old_rent,
      new_rent: new_rent,
      increase_amount: increase_amount,
      increase_percentage: percentage,
      effective_date: effective_date,
      legal_compliance: {
        within_3_year_limit: totalIncreasePercent <= 20,
        total_3_year_increase: totalIncreasePercent,
        status: totalIncreasePercent <= 20 ? 'VALID' : 'EXCEEDS_3_YEAR_LIMIT'
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});