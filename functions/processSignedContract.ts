import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { document_id } = await req.json();
    const document = await base44.asServiceRole.entities.Document.read(document_id);
    const applicant = await base44.asServiceRole.entities.Applicant.read(document.metadata.applicant_id);

    // 1. Create tenant record
    const tenant = await base44.asServiceRole.entities.Tenant.create({
      company_id: document.company_id,
      first_name: applicant.first_name,
      last_name: applicant.last_name,
      email: applicant.email,
      phone: applicant.phone,
      status: 'active'
    });

    // 2. Create lease contract
    const contract = await base44.asServiceRole.entities.LeaseContract.create({
      company_id: document.company_id,
      tenant_id: tenant.id,
      unit_id: applicant.unit_id,
      start_date: document.metadata.move_in_date,
      monthly_rent: document.metadata.monthly_rent,
      status: 'active'
    });

    // 3. Create deposit record
    await base44.asServiceRole.entities.Deposit.create({
      contract_id: contract.id,
      tenant_id: tenant.id,
      company_id: document.company_id,
      amount: document.metadata.deposit_amount,
      deposit_type: 'deposit_account',
      deposit_date: new Date().toISOString().split('T')[0],
      status: 'received'
    });

    // 4. Initialize rent debt tracking (with 0 debt)
    await base44.asServiceRole.entities.RentDebt.create({
      contract_id: contract.id,
      tenant_id: tenant.id,
      company_id: document.company_id,
      total_debt: 0,
      status: 'active'
    });

    // 5. Update applicant status
    await base44.asServiceRole.entities.Applicant.update(applicant.id, {
      status: 'signed'
    });

    // 6. Update unit status
    await base44.asServiceRole.entities.Unit.update(applicant.unit_id, {
      status: 'rented'
    });

    // 7. Mark document as signed
    await base44.asServiceRole.entities.Document.update(document_id, {
      status: 'signed'
    });

    return Response.json({ 
      success: true, 
      tenant_id: tenant.id,
      contract_id: contract.id
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});