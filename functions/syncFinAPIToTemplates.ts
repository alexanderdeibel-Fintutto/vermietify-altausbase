import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { company_id } = await req.json();

    // Get company
    const companies = await base44.entities.Company.filter({ id: company_id });
    if (companies.length === 0) {
      return Response.json({ error: 'Company not found' }, { status: 404 });
    }
    const company = companies[0];

    // Get FinAPI access token
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('finapi');

    // Fetch company bank accounts from FinAPI (if connected)
    let bankData = null;
    try {
      const response = await fetch('https://sandbox.finapi.io/webform/accounts', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        bankData = {
          bank_accounts: data.accounts || [],
          latest_balance_date: new Date().toISOString()
        };
      }
    } catch (error) {
      console.log('FinAPI sync optional, continuing without bank data');
    }

    // Prepare enriched data for templates
    const enrichedData = {
      company_name: company.name,
      address: company.address,
      tax_id: company.tax_id,
      registration_number: company.registration_number,
      founding_date: company.founding_date,
      legal_form: company.legal_form,
      ...bankData
    };

    return Response.json({
      success: true,
      data: enrichedData
    });
  } catch (error) {
    console.error('FinAPI sync error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});