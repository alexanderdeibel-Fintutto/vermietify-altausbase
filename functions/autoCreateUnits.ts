import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { building_id, unit_count = 1 } = await req.json();

    const building = await base44.entities.Building.read(building_id);
    if (!building) return Response.json({ error: 'Gebäude nicht gefunden' }, { status: 404 });

    const units = [];
    for (let i = 1; i <= unit_count; i++) {
      units.push({
        building_id: building_id,
        unit_number: `${i}`,
        sqm: 80,
        rooms: 3,
        status: 'vacant'
      });
    }

    const created = await base44.entities.Unit.bulkCreate(units);

    return Response.json({
      success: true,
      created_count: created.length,
      units: created
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});