import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { tenant_id, unit_id, rent_amount, start_date, end_date, building_id } = await req.json();

    if (!tenant_id || !rent_amount) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create lease contract
    const today = new Date();
    const contractStart = start_date ? new Date(start_date) : today;
    const contractEnd = end_date ? new Date(end_date) : new Date(contractStart.getFullYear() + 1, contractStart.getMonth(), contractStart.getDate());
    const contractNumber = `CT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const contract = await base44.asServiceRole.entities.LeaseContract.create({
      tenant_id,
      unit_id,
      building_id,
      contract_number: contractNumber,
      start_date: contractStart.toISOString(),
      end_date: contractEnd.toISOString(),
      rent_amount,
      currency: 'EUR',
      payment_frequency: 'monthly',
      deposit_amount: rent_amount * 2,
      status: 'active',
      created_at: new Date().toISOString()
    });

    // Create initial payment records
    const payments = [];
    let currentDate = new Date(contractStart);

    // Create payment records for next 3 months
    for (let i = 0; i < 3; i++) {
      const payment = await base44.asServiceRole.entities.Payment.create({
        tenant_id,
        lease_contract_id: contract.id,
        amount: rent_amount,
        currency: 'EUR',
        due_date: new Date(currentDate).toISOString(),
        status: 'pending',
        payment_type: 'rent',
        created_at: new Date().toISOString()
      });
      payments.push(payment);
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return Response.json({
      success: true,
      lease_contract: contract,
      initial_payments: payments,
      message: 'Initial lease contract and payment records created successfully'
    });
  } catch (error) {
    console.error('Error creating initial lease contract:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});