import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }
    
    const { moduleCode, billingCycle = 'monthly', accountId } = await req.json();
    
    if (!moduleCode) {
      return Response.json({ error: "moduleCode required" }, { status: 400 });
    }
    
    // Modul-Preise laden
    const pricing = await base44.asServiceRole.entities.ModulePricing.filter({
      module_code: moduleCode,
      is_active: true
    });
    
    if (pricing.length === 0) {
      return Response.json({ error: "Module not found" }, { status: 404 });
    }
    
    const module = pricing[0];
    const price = billingCycle === 'yearly' ? module.price_yearly : module.price_monthly;
    
    await base44.asServiceRole.entities.ModuleAccess.create({
      account_id: accountId || user.id,
      module_code: moduleCode,
      is_active: true,
      purchased_date: new Date().toISOString().split('T')[0],
      expires_date: null,
      price_paid: price,
      billing_cycle: billingCycle,
      auto_renew: true,
      purchased_by: user.id
    });
    
    return Response.json({
      success: true,
      message: `Module ${module.module_name} activated`
    });
    
  } catch (error) {
    console.error("Activate module error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});