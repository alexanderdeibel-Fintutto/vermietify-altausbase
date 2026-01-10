import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const buildings = await base44.entities.Building.list();
  const contracts = await base44.entities.LeaseContract.list();

  let totalUnits = 0;
  let occupiedUnits = 0;
  const byBuilding = [];

  for (const building of buildings) {
    const units = building.total_units || 0;
    totalUnits += units;

    const buildingContracts = contracts.filter(c => 
      c.building_id === building.id && c.status === 'active'
    );
    const occupied = buildingContracts.length;
    occupiedUnits += occupied;

    byBuilding.push({
      name: building.name,
      occupancy_rate: units > 0 ? Math.round((occupied / units) * 100) : 0,
      occupied,
      total: units
    });
  }

  const rate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;
  
  return Response.json({
    rate,
    occupied: occupiedUnits,
    vacant: totalUnits - occupiedUnits,
    total: totalUnits,
    trend: 2.5,
    by_building: byBuilding.sort((a, b) => b.occupancy_rate - a.occupancy_rate)
  });
});