import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get all active lease contracts
    const contracts = await base44.asServiceRole.entities.LeaseContract.filter({ status: 'active' });
    
    const today = new Date();
    const currentDay = today.getDate();
    
    let remindersSent = 0;
    
    for (const contract of contracts) {
      // Check if rent is due within 3 days
      const daysUntilDue = contract.rent_due_day - currentDay;
      
      if (daysUntilDue === 3 || daysUntilDue === 1) {
        // Get tenant info
        const tenants = await base44.asServiceRole.entities.Tenant.filter({ id: contract.tenant_id }, null, 1);
        const tenant = tenants[0];
        
        if (!tenant?.email) continue;
        
        // Generate personalized message using AI
        const aiResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `Erstelle eine freundliche, professionelle Miet-Erinnerung auf Deutsch für ${tenant.full_name}. 
          Details:
          - Mietbetrag: ${contract.total_rent}€
          - Fälligkeitsdatum: ${contract.rent_due_day}. des Monats
          - Tage bis Fälligkeit: ${daysUntilDue}
          - Warmmiete umfasst: Kaltmiete ${contract.base_rent}€, Nebenkosten ${contract.utilities}€, Heizung ${contract.heating}€
          
          Die Nachricht soll kurz, höflich und informativ sein.`
        });
        
        // Send email
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: tenant.email,
          subject: `Erinnerung: Mietzahlung fällig in ${daysUntilDue} Tag${daysUntilDue > 1 ? 'en' : ''}`,
          body: aiResponse,
          from_name: 'Hausverwaltung'
        });
        
        remindersSent++;
      }
    }
    
    return Response.json({
      success: true,
      remindersSent,
      processedContracts: contracts.length
    });
    
  } catch (error) {
    console.error('Error sending rent reminders:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});