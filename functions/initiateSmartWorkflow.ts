import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, data, photos, user_id } = await req.json();

    let tenant = null;
    let contract = null;
    let building = null;
    let unit = null;
    let documents = [];

    // Step 1: Create or find tenant
    if (data.first_name && data.last_name) {
      const existingTenants = await base44.asServiceRole.entities.Tenant.filter({
        first_name: data.first_name,
        last_name: data.last_name
      });

      if (existingTenants.length > 0) {
        tenant = existingTenants[0];
      } else {
        tenant = await base44.asServiceRole.entities.Tenant.create({
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email || `${data.first_name.toLowerCase()}.${data.last_name.toLowerCase()}@example.com`,
          phone: data.phone || '',
          street: data.street || '',
          house_number: data.house_number || '',
          postal_code: data.postal_code || '',
          city: data.city || '',
          notes: data.notes || (data.jobcenter ? 'Beim Jobcenter gemeldet' : '')
        });
      }
    }

    // Step 2: Find or create building/unit based on address
    if (data.street && data.city) {
      const buildings = await base44.asServiceRole.entities.Building.filter({
        street: data.street,
        city: data.city
      });

      if (buildings.length > 0) {
        building = buildings[0];
        
        // Find available unit
        const units = await base44.asServiceRole.entities.Unit.filter({
          building_id: building.id
        });
        
        const availableUnit = units.find(u => !u.current_tenant_id);
        if (availableUnit) {
          unit = availableUnit;
        }
      }
    }

    // Step 3: Create contract if tenant and action requires it
    if (action === 'create_contract' && tenant) {
      const startDate = new Date();
      startDate.setDate(1); // First of next month
      startDate.setMonth(startDate.getMonth() + 1);

      contract = await base44.asServiceRole.entities.LeaseContract.create({
        tenant_id: tenant.id,
        unit_id: unit?.id || '',
        building_id: building?.id || '',
        start_date: startDate.toISOString().split('T')[0],
        is_unlimited: true,
        base_rent: data.rent_amount || 0,
        total_rent: data.rent_amount || 0,
        status: 'active',
        rent_due_day: 3,
        notes: data.jobcenter ? 'Miete wird vom Jobcenter übernommen' : ''
      });

      // Create financial items for rent
      if (data.rent_amount) {
        await base44.asServiceRole.entities.FinancialItem.create({
          contract_id: contract.id,
          building_id: building?.id || '',
          type: 'income',
          category: 'rent',
          amount: data.rent_amount,
          date: startDate.toISOString().split('T')[0],
          description: `Miete ${tenant.first_name} ${tenant.last_name}`,
          is_recurring: true,
          recurrence_interval: 'monthly'
        });
      }
    }

    // Step 4: Create document entry
    if (contract) {
      const document = await base44.asServiceRole.entities.Document.create({
        name: `Mietvertrag ${tenant.first_name} ${tenant.last_name}`,
        category: 'Mietrecht',
        status: 'zu_erledigen',
        tenant_id: tenant.id,
        contract_id: contract.id,
        building_id: building?.id || '',
        unit_id: unit?.id || '',
        notes: 'Automatisch erstellt via Smart Action'
      });
      documents.push(document);
    }

    // Generate summary
    const summary = `
✓ Mieter ${tenant ? 'erstellt/gefunden' : 'nicht erstellt'}: ${tenant?.first_name} ${tenant?.last_name}
✓ Mietvertrag ${contract ? 'erstellt' : 'nicht erstellt'}
✓ Buchung ${data.rent_amount ? 'erstellt' : 'nicht erstellt'}
${data.jobcenter ? '⚠️ Jobcenter-Mieter - Kommunikation ans Jobcenter erforderlich' : ''}
    `.trim();

    return Response.json({
      workflow: {
        id: `workflow_${Date.now()}`,
        name: action === 'create_contract' ? 'Mietvertrag-Workflow' : 'Mieter-Onboarding',
        status: 'pending'
      },
      entities: {
        tenant,
        contract,
        building,
        unit,
        documents
      },
      summary,
      next_steps: [
        data.jobcenter ? 'Kommunikation an Jobcenter' : 'Kommunikation an Mieter',
        'Dokument versenden',
        'Onboarding abschließen'
      ]
    });

  } catch (error) {
    return Response.json({ 
      error: error.message,
      details: error.stack
    }, { status: 500 });
  }
});