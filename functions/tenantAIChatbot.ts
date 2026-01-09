import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { message, tenant_id } = await req.json();
    
    if (!message || !tenant_id) {
      return Response.json({ error: 'message and tenant_id required' }, { status: 400 });
    }
    
    // Get tenant context
    const tenants = await base44.asServiceRole.entities.Tenant.filter({ id: tenant_id }, null, 1);
    const tenant = tenants[0];
    
    // Get lease contract
    const contracts = await base44.asServiceRole.entities.LeaseContract.filter({ tenant_id }, '-start_date', 1);
    const contract = contracts[0];
    
    // Get recent payments
    const payments = await base44.asServiceRole.entities.Payment.filter({ tenant_email: tenant?.email }, '-payment_date', 3);
    
    // Get maintenance requests
    const maintenance = await base44.asServiceRole.entities.MaintenanceTask.filter({ tenant_id }, '-created_at', 5);
    
    // Build context for AI
    const context = {
      tenant_name: tenant?.full_name,
      rent_amount: contract?.total_rent,
      rent_due_day: contract?.rent_due_day,
      lease_start: contract?.start_date,
      lease_end: contract?.end_date,
      recent_payments: payments.map(p => ({ amount: p.amount, date: p.payment_date, status: p.status })),
      maintenance_requests: maintenance.map(m => ({ title: m.title, status: m.status, created: m.created_at }))
    };
    
    // Generate AI response
    const aiResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Du bist ein hilfsbereiter Assistent für Mieterverwaltung. Beantworte die Frage des Mieters auf Deutsch, professionell und freundlich.
      
      Mieter-Kontext:
      ${JSON.stringify(context, null, 2)}
      
      Häufige Themen:
      - Mietzahlungen & Fälligkeiten
      - Wartungsanfragen
      - Vertragsinformationen
      - Allgemeine Fragen zur Immobilie
      
      Frage des Mieters: ${message}
      
      Antworte kurz, präzise und hilfreich. Bei komplexen Anliegen, empfehle Kontakt zur Verwaltung.`,
      add_context_from_internet: false
    });
    
    // Store conversation in database
    await base44.asServiceRole.entities.TenantMessage.create({
      tenant_id,
      sender_email: user.email,
      sender_type: 'tenant',
      message_text: message,
      created_at: new Date().toISOString()
    });
    
    await base44.asServiceRole.entities.TenantMessage.create({
      tenant_id,
      sender_email: 'ai-assistant@system',
      sender_type: 'system',
      message_text: aiResponse,
      created_at: new Date().toISOString()
    });
    
    return Response.json({
      success: true,
      response: aiResponse
    });
    
  } catch (error) {
    console.error('Error in AI chatbot:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});