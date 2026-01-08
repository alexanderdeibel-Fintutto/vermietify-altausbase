import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin required' }, { status: 403 });
    }

    console.log('[SANDBOX] Setting up ELSTER test environment');

    // 1. Create test certificate if not exists
    const certs = await base44.entities.ElsterCertificate.filter({
      certificate_type: 'TEST'
    });

    if (certs.length === 0) {
      await base44.entities.ElsterCertificate.create({
        certificate_name: 'Test-Zertifikat (Demo)',
        certificate_type: 'TEST',
        tax_number: '1096081508187',
        valid_from: '2024-01-01',
        valid_until: '2026-12-31',
        is_active: true,
        certificate_data: 'base64_encoded_test_cert_data',
        certificate_password_encrypted: 'encrypted_demo_password',
        supported_legal_forms: ['PRIVATPERSON', 'GBR', 'GMBH']
      });
    }

    // 2. Create test building if not exists
    const buildings = await base44.entities.Building.filter({
      address: 'Test-Objekt Demo'
    });

    let testBuilding;
    if (buildings.length === 0) {
      testBuilding = await base44.entities.Building.create({
        name: 'Test-Objekt Demo',
        address: 'Musterstraße 1, 10115 Berlin',
        purchase_price: 500000,
        purchase_date: '2020-01-01',
        living_space: 120
      });
    } else {
      testBuilding = buildings[0];
    }

    // 3. Create test submissions for all form types
    const formTypes = ['ANLAGE_V', 'EUER', 'EST1B', 'GEWERBESTEUER', 'UMSATZSTEUER'];
    const createdSubmissions = [];

    for (const formType of formTypes) {
      const existingSubmission = await base44.entities.ElsterSubmission.filter({
        building_id: testBuilding.id,
        tax_form_type: formType,
        submission_mode: 'TEST'
      });

      if (existingSubmission.length === 0) {
        const submission = await base44.entities.ElsterSubmission.create({
          building_id: testBuilding.id,
          tax_form_type: formType,
          legal_form: 'PRIVATPERSON',
          tax_year: 2025,
          submission_mode: 'TEST',
          status: 'DRAFT',
          form_data: {
            tax_number: '1096081508187',
            income: 12000,
            expenses: 4000
          }
        });
        createdSubmissions.push(formType);
      }
    }

    // 4. Create test financial items
    const testItems = [
      { date: '2025-01-15', description: 'Mieteinkommen Januar', amount: 1000, type: 'INCOME' },
      { date: '2025-02-01', description: 'Instandhaltung', amount: 150, type: 'EXPENSE' },
      { date: '2025-03-10', description: 'Versicherung', amount: 200, type: 'EXPENSE' }
    ];

    for (const item of testItems) {
      await base44.entities.FinancialItem.create({
        building_id: testBuilding.id,
        ...item,
        tax_year: 2025
      });
    }

    return Response.json({ 
      success: true, 
      message: 'Test-Sandbox erfolgreich eingerichtet',
      setup: {
        test_building_id: testBuilding.id,
        test_certificate_created: certs.length === 0,
        test_submissions_created: createdSubmissions,
        test_items_created: testItems.length
      }
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});