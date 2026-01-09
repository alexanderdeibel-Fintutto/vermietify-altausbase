import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { 
      tenant_id, 
      tenant_email, 
      tenant_name,
      unit_id,
      building_id,
      rent_amount,
      start_date,
      end_date
    } = await req.json();

    if (!tenant_id || !tenant_email || !tenant_name) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const onboardingSteps = [];

    try {
      // Step 1: Generate portal access token
      const portalAccessToken = `pt-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Update tenant with portal access
      await base44.asServiceRole.entities.Tenant.update(tenant_id, {
        portal_enabled: true,
        portal_token: portalAccessToken,
        portal_access_date: new Date().toISOString()
      });
      onboardingSteps.push({ step: 'portal_activation', status: 'completed', token: portalAccessToken });

      // Step 2: Send welcome email
      try {
        const emailResult = await base44.asServiceRole.functions.invoke('sendTenantWelcomeEmail', {
          tenant_id,
          tenant_email,
          tenant_name,
          portal_access_token: portalAccessToken
        });
        onboardingSteps.push({ step: 'welcome_email', status: 'completed', data: emailResult.data });
      } catch (emailError) {
        console.warn('Email sending failed, continuing with other steps:', emailError);
        onboardingSteps.push({ step: 'welcome_email', status: 'warning', error: emailError.message });
      }

      // Step 3: Create initial documents
      try {
        const docsResult = await base44.asServiceRole.functions.invoke('createTenantInitialDocuments', {
          tenant_id,
          building_id
        });
        onboardingSteps.push({ step: 'initial_documents', status: 'completed', data: docsResult.data });
      } catch (docsError) {
        console.warn('Document creation failed:', docsError);
        onboardingSteps.push({ step: 'initial_documents', status: 'warning', error: docsError.message });
      }

      // Step 4: Setup communication channels
      try {
        const commResult = await base44.asServiceRole.functions.invoke('createTenantCommunicationSetup', {
          tenant_id,
          tenant_email,
          tenant_name
        });
        onboardingSteps.push({ step: 'communication_setup', status: 'completed', data: commResult.data });
      } catch (commError) {
        console.warn('Communication setup failed:', commError);
        onboardingSteps.push({ step: 'communication_setup', status: 'warning', error: commError.message });
      }

      // Step 5: Create initial lease contract and payments
      let leaseContractId = null;
      if (rent_amount && start_date) {
        try {
          const contractResult = await base44.asServiceRole.functions.invoke('createInitialLeaseContract', {
            tenant_id,
            unit_id,
            building_id,
            rent_amount,
            start_date,
            end_date
          });
          leaseContractId = contractResult.data.lease_contract?.id;
          onboardingSteps.push({ step: 'lease_contract', status: 'completed', data: contractResult.data });
        } catch (contractError) {
          console.warn('Lease contract creation failed:', contractError);
          onboardingSteps.push({ step: 'lease_contract', status: 'warning', error: contractError.message });
        }
      }

      // Step 6: Create tenant administration locks
      if (leaseContractId) {
        try {
          const locksResult = await base44.asServiceRole.functions.invoke('createTenantAdministrationLocks', {
            tenant_id,
            lease_contract_id: leaseContractId,
            tenant_type: 'residential'
          });
          onboardingSteps.push({ step: 'administration_locks', status: 'completed', data: locksResult.data });
        } catch (locksError) {
          console.warn('Administration locks creation failed:', locksError);
          onboardingSteps.push({ step: 'administration_locks', status: 'warning', error: locksError.message });
        }
      }

      // Step 7: Create onboarding progress record
      try {
        const progressRecord = await base44.asServiceRole.entities.OnboardingProgress.create({
          tenant_id,
          steps_completed: onboardingSteps.filter(s => s.status === 'completed').length,
          total_steps: onboardingSteps.length,
          is_completed: true,
          completed_at: new Date().toISOString(),
          workflow_data: { steps: onboardingSteps }
        });
        onboardingSteps.push({ step: 'progress_tracking', status: 'completed', id: progressRecord.id });
      } catch (progressError) {
        console.warn('Progress tracking failed:', progressError);
      }

      return Response.json({
        success: true,
        tenant_id,
        onboarding_steps: onboardingSteps,
        message: 'Tenant onboarding workflow initiated successfully',
        completion_status: 'completed'
      });
    } catch (error) {
      console.error('Error during tenant onboarding:', error);
      return Response.json({
        success: false,
        tenant_id,
        onboarding_steps: onboardingSteps,
        error: error.message,
        completion_status: 'partial'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Fatal error in onboarding:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});