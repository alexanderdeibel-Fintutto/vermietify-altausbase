import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { building_ids, assigned_to, scheduled_date } = await req.json();

    // Fetch all meters for selected buildings
    const allMeters = await base44.entities.Meter.list(null, 1000);
    const relevantMeters = allMeters.filter(m => building_ids.includes(m.building_id));

    // Fetch buildings for geolocation
    const buildings = await base44.entities.Building.filter(
      { id: { $in: building_ids } },
      null,
      100
    );

    // Sort meters by location for optimal route
    // Group by building, then by floor, then by location
    const optimizedMeters = [...relevantMeters].sort((a, b) => {
      // First by building
      const buildingCompare = buildings.findIndex(bldg => bldg.id === a.building_id) - 
                             buildings.findIndex(bldg => bldg.id === b.building_id);
      if (buildingCompare !== 0) return buildingCompare;

      // Then by floor if available
      const floorA = extractFloor(a.location);
      const floorB = extractFloor(b.location);
      if (floorA !== floorB) return floorA - floorB;

      // Then alphabetically by location
      return (a.location || '').localeCompare(b.location || '');
    });

    // Estimate duration (2 minutes per meter)
    const estimatedDuration = optimizedMeters.length * 2;

    // Create route
    const route = await base44.asServiceRole.entities.MeterReadingRoute.create({
      route_name: `Route ${new Date(scheduled_date).toLocaleDateString('de-DE')}`,
      assigned_to,
      building_ids,
      meter_ids: optimizedMeters.map(m => m.id),
      scheduled_date,
      status: 'planned',
      total_meters: optimizedMeters.length,
      estimated_duration_minutes: estimatedDuration
    });

    return Response.json({
      success: true,
      route,
      optimized_meters: optimizedMeters.map(m => ({
        id: m.id,
        meter_number: m.meter_number,
        location: m.location,
        building_name: buildings.find(b => b.id === m.building_id)?.name
      }))
    });

  } catch (error) {
    console.error('Generate route error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function extractFloor(location) {
  if (!location) return 0;
  const match = location.match(/(\d+)\.\s*OG|EG|UG/i);
  if (!match) return 0;
  if (location.includes('UG')) return -1;
  if (location.includes('EG')) return 0;
  return parseInt(match[1] || '0');
}