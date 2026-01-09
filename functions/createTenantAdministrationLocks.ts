import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { tenant_id, lease_contract_id, tenant_type = 'residential' } = await req.json();

    if (!tenant_id || !lease_contract_id) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const createdLocks = [];
    const today = new Date();
    const oneWeekLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const twoWeeksLater = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
    const threeWeeksLater = new Date(today.getTime() + 21 * 24 * 60 * 60 * 1000);

    // Lock 1: Contract Signed
    const contractLock = await base44.asServiceRole.entities.TenantAdministrationLock.create({
      tenant_id,
      lease_contract_id,
      title: 'Mietvertrag unterzeichnet',
      description: 'Der Mietvertrag muss von beiden Parteien unterzeichnet werden',
      lock_type: 'contract_signed',
      status: 'pending',
      due_date: oneWeekLater.toISOString(),
      priority: 'urgent',
      is_visible_to_tenant: true
    });
    createdLocks.push(contractLock);

    // Lock 2: Payment Setup
    const paymentLock = await base44.asServiceRole.entities.TenantAdministrationLock.create({
      tenant_id,
      lease_contract_id,
      title: 'Zahlungsmethode einrichten',
      description: 'Der Mieter muss eine Zahlungsmethode hinzufügen',
      lock_type: 'payment_setup',
      status: 'pending',
      due_date: twoWeeksLater.toISOString(),
      priority: 'high',
      is_visible_to_tenant: true
    });
    createdLocks.push(paymentLock);

    // Lock 3: Documents Reviewed
    const docsLock = await base44.asServiceRole.entities.TenantAdministrationLock.create({
      tenant_id,
      lease_contract_id,
      title: 'Dokumente überprüft',
      description: 'Hausordnung und wichtige Dokumente müssen gelesen werden',
      lock_type: 'documents_reviewed',
      status: 'pending',
      due_date: threeWeeksLater.toISOString(),
      priority: 'medium',
      is_visible_to_tenant: true
    });
    createdLocks.push(docsLock);

    // Lock 4: Inspection Report (if residential)
    if (tenant_type === 'residential') {
      const inspectionLock = await base44.asServiceRole.entities.TenantAdministrationLock.create({
        tenant_id,
        lease_contract_id,
        title: 'Inspektionsbericht erstellt',
        description: 'Der Zustand der Einheit muss dokumentiert werden',
        lock_type: 'inspection_report',
        status: 'pending',
        due_date: oneWeekLater.toISOString(),
        priority: 'high',
        is_visible_to_tenant: true
      });
      createdLocks.push(inspectionLock);
    }

    // Lock 5: Portal Onboarding
    const onboardingLock = await base44.asServiceRole.entities.TenantAdministrationLock.create({
      tenant_id,
      lease_contract_id,
      title: 'Portal-Onboarding abgeschlossen',
      description: 'Der Mieter muss das Onboarding im Mieterportal durchführen',
      lock_type: 'portal_onboarding',
      status: 'pending',
      due_date: twoWeeksLater.toISOString(),
      priority: 'medium',
      is_visible_to_tenant: true
    });
    createdLocks.push(onboardingLock);

    return Response.json({
      success: true,
      created_locks: createdLocks,
      message: `${createdLocks.length} administration locks created for tenant`
    });
  } catch (error) {
    console.error('Error creating tenant administration locks:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});