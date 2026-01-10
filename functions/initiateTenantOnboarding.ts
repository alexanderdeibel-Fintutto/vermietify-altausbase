import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tenant_id, unit_id, building_id, contract_data, preferred_communication } = await req.json();

    // Create or get tenant
    let tenant;
    if (tenant_id) {
      tenant = await base44.entities.Tenant.get(tenant_id);
    } else if (contract_data?.tenant_info) {
      tenant = await base44.asServiceRole.entities.Tenant.create({
        first_name: contract_data.tenant_info.first_name,
        last_name: contract_data.tenant_info.last_name,
        email: contract_data.tenant_info.email,
        phone: contract_data.tenant_info.phone,
        unit_id: unit_id
      });
    }

    // Get building and unit details
    const building = await base44.entities.Building.get(building_id);
    const unit = await base44.entities.Unit.get(unit_id);

    // Create onboarding record
    const onboarding = await base44.asServiceRole.entities.TenantOnboarding.create({
      tenant_id: tenant.id,
      unit_id,
      building_id,
      preferred_communication: preferred_communication || 'email',
      status: 'initiated',
      move_in_date: contract_data?.start_date,
      progress_percentage: 10
    });

    // Generate lease contract
    const contractDoc = await base44.functions.invoke('generateLeaseContract', {
      tenant,
      unit,
      building,
      contract_data
    });

    // Generate handover protocol
    const protocolDoc = await base44.functions.invoke('generateHandoverProtocol', {
      tenant,
      unit,
      building,
      type: 'move_in'
    });

    // Create actual contract entity
    let contract = null;
    if (contract_data) {
      contract = await base44.asServiceRole.entities.LeaseContract.create({
        tenant_id: tenant.id,
        unit_id,
        start_date: contract_data.start_date,
        base_rent: contract_data.base_rent,
        utilities: contract_data.utilities,
        heating: contract_data.heating,
        total_rent: (contract_data.base_rent || 0) + (contract_data.utilities || 0) + (contract_data.heating || 0),
        deposit: contract_data.deposit,
        is_unlimited: contract_data.is_unlimited,
        end_date: contract_data.end_date,
        rent_due_day: contract_data.rent_due_day || 3,
        status: 'active'
      });
    }

    // Update onboarding with contract
    await base44.asServiceRole.entities.TenantOnboarding.update(onboarding.id, {
      contract_id: contract?.id,
      status: 'documents_generated',
      generated_documents: [
        {
          document_id: contractDoc.data.id,
          document_type: 'lease_contract',
          status: 'generated'
        },
        {
          document_id: protocolDoc.data.id,
          document_type: 'handover_protocol',
          status: 'generated'
        }
      ],
      steps_completed: [
        { step: 'initiated', completed_at: new Date().toISOString(), status: 'completed' },
        { step: 'documents_generated', completed_at: new Date().toISOString(), status: 'completed' }
      ],
      progress_percentage: 40
    });

    // Send documents based on preferred communication
    const sendResult = await base44.functions.invoke('sendOnboardingDocuments', {
      onboarding_id: onboarding.id,
      channel: preferred_communication || 'email'
    });

    return Response.json({
      onboarding,
      tenant,
      contract,
      documents: [contractDoc.data, protocolDoc.data],
      send_result: sendResult.data
    });

  } catch (error) {
    console.error('Onboarding error:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});