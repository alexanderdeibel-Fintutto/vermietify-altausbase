import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 });
    }

    // Get buildings for test environment
    const buildings = await base44.entities.Building.list('-created_date', 5);
    
    // Get contracts for test environment  
    const contracts = await base44.entities.LeaseContract.list('-created_date', 10);
    
    // Get units for test environment
    const units = await base44.entities.Unit.list('-created_date', 20);
    
    // Get tenants for test environment
    const tenants = await base44.entities.Tenant.list('-created_date', 10);

    // Get sample financial items
    const financialItems = await base44.entities.FinancialItem.filter(
      { created_by: 'system' },
      '-created_date',
      20
    );

    return Response.json({
      success: true,
      data: {
        buildings: buildings || [],
        contracts: contracts || [],
        units: units || [],
        tenants: tenants || [],
        financial_items: financialItems || [],
        sample_data_loaded: true,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Get test environment error:', error);
    return Response.json({
      success: false,
      error: error.message,
      data: {
        buildings: [],
        contracts: [],
        units: [],
        tenants: [],
        financial_items: [],
        sample_data_loaded: false
      }
    }, { status: 500 });
  }
});