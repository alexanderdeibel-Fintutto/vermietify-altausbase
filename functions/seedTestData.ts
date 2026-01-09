import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Sample buildings
    const building1 = await base44.asServiceRole.entities.Building.create({
      name: 'Beispiel-Immobilie: Berliner Altbau',
      address: 'Kurfürstendamm 42, 10719 Berlin',
      property_type: 'residential',
      year_built: 1920,
      square_meters: 1500,
      units_count: 6,
      total_units: 6,
      status: 'active',
      description: 'Wunderschöner Berliner Gründerzeitbau mit Stuckdecken'
    });

    const building2 = await base44.asServiceRole.entities.Building.create({
      name: 'Beispiel-Immobilie: München Mehrfamilienhaus',
      address: 'Ludwigstraße 123, 80539 München',
      property_type: 'residential',
      year_built: 1975,
      square_meters: 2800,
      units_count: 12,
      total_units: 12,
      status: 'active',
      description: 'Modernes Mehrfamilienhaus in Zentrumslage'
    });

    // Sample units
    const unit1 = await base44.asServiceRole.entities.Unit.create({
      building_id: building1.id,
      unit_number: '1',
      floor: 'EG',
      square_meters: 250,
      rooms: 3,
      status: 'occupied',
      description: 'Erdgeschoß mit Gartennutzung'
    });

    const unit2 = await base44.asServiceRole.entities.Unit.create({
      building_id: building1.id,
      unit_number: '2',
      floor: '1',
      square_meters: 220,
      rooms: 2,
      status: 'occupied',
      description: 'Erste Etage'
    });

    const unit3 = await base44.asServiceRole.entities.Unit.create({
      building_id: building2.id,
      unit_number: '101',
      floor: '1',
      square_meters: 85,
      rooms: 2,
      status: 'free',
      description: 'Studio mit Balkon'
    });

    // Sample tenants
    const tenant1 = await base44.asServiceRole.entities.Tenant.create({
      first_name: 'Max',
      last_name: 'Mustermann',
      email: 'max@example.com',
      phone: '030/12345678',
      unit_id: unit1.id,
      building_id: building1.id,
      status: 'active'
    });

    const tenant2 = await base44.asServiceRole.entities.Tenant.create({
      first_name: 'Erika',
      last_name: 'Musterfrau',
      email: 'erika@example.com',
      phone: '089/87654321',
      unit_id: unit2.id,
      building_id: building1.id,
      status: 'active'
    });

    // Sample contracts
    const contract1 = await base44.asServiceRole.entities.LeaseContract.create({
      building_id: building1.id,
      unit_id: unit1.id,
      tenant_id: tenant1.id,
      start_date: '2023-01-01',
      end_date: '2026-12-31',
      base_rent: 800,
      operating_cost_advance: 120,
      deposit: 2400,
      status: 'active'
    });

    const contract2 = await base44.asServiceRole.entities.LeaseContract.create({
      building_id: building1.id,
      unit_id: unit2.id,
      tenant_id: tenant2.id,
      start_date: '2022-06-01',
      end_date: '2025-05-31',
      base_rent: 700,
      operating_cost_advance: 100,
      deposit: 2100,
      status: 'active'
    });

    // Sample financial items
    const financialItem1 = await base44.asServiceRole.entities.FinancialItem.create({
      building_id: building1.id,
      type: 'income',
      category: 'rent',
      amount: 1500,
      description: 'Mieteinnahmen Januar',
      due_date: '2024-02-15',
      status: 'pending'
    });

    const financialItem2 = await base44.asServiceRole.entities.FinancialItem.create({
      building_id: building1.id,
      type: 'expense',
      category: 'maintenance',
      amount: 250,
      description: 'Reparatur Dachrinne',
      due_date: '2024-01-20',
      status: 'completed'
    });

    return Response.json({
      success: true,
      message: 'Test-Daten erfolgreich erstellt',
      data: {
        buildings: [building1, building2],
        units: [unit1, unit2, unit3],
        tenants: [tenant1, tenant2],
        contracts: [contract1, contract2],
        financial_items: [financialItem1, financialItem2]
      }
    });
  } catch (error) {
    console.error('Seed test data error:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});