import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    const { moduleCode, billingCycle = 'monthly' } = await req.json();
    
    if (user.role !== "admin") {
      return Response.json({ error: "Only admin can activate modules" }, { status: 403 });
    }
    
    // Modul-Preise laden
    const modulePricing = await base44.asServiceRole.entities.ModulePricing.filter({
      module_code: moduleCode,
      is_active: true
    });
    
    if (modulePricing.length === 0) {
      return Response.json({ error: "Module not found" }, { status: 404 });
    }
    
    const pricing = modulePricing[0];
    const price = billingCycle === 'monthly' ? pricing.price_monthly : pricing.price_yearly;
    
    // Prüfen ob bereits gebucht
    const existingAccess = await base44.asServiceRole.entities.ModuleAccess.filter({
      account_id: user.account_id || 'default',
      module_code: moduleCode,
      is_active: true
    });
    
    if (existingAccess.length > 0) {
      return Response.json({ error: "Module already active" }, { status: 400 });
    }
    
    // Abhängigkeiten prüfen
    if (pricing.dependencies && pricing.dependencies.length > 0) {
      for (const depModule of pricing.dependencies) {
        const depAccess = await base44.asServiceRole.entities.ModuleAccess.filter({
          account_id: user.account_id || 'default',
          module_code: depModule,
          is_active: true
        });
        
        if (depAccess.length === 0) {
          return Response.json({ 
            error: `Dependency missing: ${depModule}`,
            requiredModule: depModule 
          }, { status: 400 });
        }
      }
    }
    
    // Modul aktivieren
    const expiresDate = billingCycle === 'monthly' 
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    
    const moduleAccess = await base44.asServiceRole.entities.ModuleAccess.create({
      account_id: user.account_id || 'default',
      module_code: moduleCode,
      is_active: true,
      purchased_date: new Date().toISOString().split('T')[0],
      expires_date: expiresDate.toISOString().split('T')[0],
      price_paid: price,
      billing_cycle: billingCycle,
      auto_renew: true,
      purchased_by: user.id
    });
    
    return Response.json({ 
      success: true,
      moduleAccess,
      message: `Module ${pricing.module_name} activated` 
    });
    
  } catch (error) {
    console.error("Activate module error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});