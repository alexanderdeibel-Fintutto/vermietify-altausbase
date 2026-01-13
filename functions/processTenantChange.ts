import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { unit_id, old_tenant, new_tenant, move_out_date, move_in_date } = await req.json();

    // 1. Get old contract and end it
    const contracts = await base44.entities.LeaseContract.list();
    const oldContract = contracts.find(c => c.unit_id === unit_id && c.status === 'active');
    
    if (oldContract) {
      await base44.entities.LeaseContract.update(oldContract.id, {
        status: 'ended',
        end_date: move_out_date
      });
    }

    // 2. Create new contract
    const unit = await base44.entities.Unit.read(unit_id);
    const newContract = await base44.entities.LeaseContract.create({
      unit_id: unit_id,
      building_id: unit.building_id,
      tenant_name: new_tenant,
      rent_amount: oldContract?.rent_amount || 0,
      start_date: move_in_date,
      status: 'active'
    });

    // 3. Log the change
    await base44.entities.AuditLog.create({
      entity_type: 'LeaseContract',
      action: 'TENANT_CHANGE',
      old_tenant: old_tenant,
      new_tenant: new_tenant,
      unit_id: unit_id,
      old_contract_id: oldContract?.id,
      new_contract_id: newContract.id,
      move_out_date: move_out_date,
      move_in_date: move_in_date
    });

    return Response.json({ 
      success: true, 
      old_contract_id: oldContract?.id,
      new_contract_id: newContract.id 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});