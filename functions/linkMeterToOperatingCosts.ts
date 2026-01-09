import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reading_id, auto_create_cost_items = true } = await req.json();

    // Fetch reading and meter
    const readings = await base44.entities.MeterReading.filter({ id: reading_id }, null, 1);
    const reading = readings[0];

    if (!reading) {
      return Response.json({ error: 'Reading not found' }, { status: 404 });
    }

    const meters = await base44.entities.Meter.filter({ id: reading.meter_id }, null, 1);
    const meter = meters[0];

    // Find active contracts for this building
    const contracts = await base44.entities.LeaseContract.filter({
      status: 'active'
    }, null, 500);

    // Filter contracts by building (need to fetch units)
    const units = await base44.entities.Unit.list(null, 500);
    const buildingUnits = units.filter(u => u.building_id === meter.building_id);
    const relevantContracts = contracts.filter(c => 
      buildingUnits.find(u => u.id === c.unit_id)
    );

    const linkedItems = [];

    if (auto_create_cost_items && reading.consumption) {
      // Create cost allocation based on consumption
      for (const contract of relevantContracts) {
        const unit = buildingUnits.find(u => u.id === contract.unit_id);
        
        // Calculate share (simplified - equal distribution)
        const share = reading.consumption / relevantContracts.length;

        // Create financial item for this consumption
        try {
          const item = await base44.asServiceRole.entities.FinancialItem.create({
            contract_id: contract.id,
            building_id: meter.building_id,
            unit_id: unit.id,
            tenant_id: contract.tenant_id,
            description: `${meter.meter_type} - ${meter.location}`,
            category: meter.meter_type === 'electricity' ? 'Strom' :
                     meter.meter_type === 'water' ? 'Wasser' :
                     meter.meter_type === 'gas' ? 'Gas' :
                     meter.meter_type === 'heating' ? 'Heizung' : 'Nebenkosten',
            amount: share,
            item_date: reading.reading_date,
            is_expense: true,
            metadata: {
              meter_id: meter.id,
              meter_reading_id: reading.id,
              consumption: share
            }
          });

          linkedItems.push(item);
        } catch (error) {
          console.error('Failed to create financial item:', error);
        }
      }
    }

    return Response.json({
      success: true,
      linked_contracts: relevantContracts.length,
      created_items: linkedItems.length,
      items: linkedItems
    });

  } catch (error) {
    console.error('Link to operating costs error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});