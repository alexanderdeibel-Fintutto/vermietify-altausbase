import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    const { notification_type, title, message, tenant_ids, building_id, urgency } = await req.json();
    
    if (!title || !message) {
      return Response.json({ error: 'title and message required' }, { status: 400 });
    }
    
    let recipients = [];
    
    // Determine recipients
    if (tenant_ids && tenant_ids.length > 0) {
      // Specific tenants
      for (const tid of tenant_ids) {
        const tenants = await base44.asServiceRole.entities.Tenant.filter({ id: tid }, null, 1);
        if (tenants[0]) recipients.push(tenants[0]);
      }
    } else if (building_id) {
      // All tenants in building
      const units = await base44.asServiceRole.entities.Unit.filter({ building_id });
      for (const unit of units) {
        const contracts = await base44.asServiceRole.entities.LeaseContract.filter({ 
          unit_id: unit.id, 
          status: 'active' 
        });
        for (const contract of contracts) {
          const tenants = await base44.asServiceRole.entities.Tenant.filter({ id: contract.tenant_id }, null, 1);
          if (tenants[0]) recipients.push(tenants[0]);
        }
      }
    } else {
      // All tenants
      recipients = await base44.asServiceRole.entities.Tenant.list();
    }
    
    let sentCount = 0;
    
    for (const tenant of recipients) {
      if (!tenant.email) continue;
      
      // Generate personalized AI message
      const personalizedMessage = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `Erstelle eine professionelle, personalisierte Benachrichtigung auf Deutsch für ${tenant.full_name}.
        
        Art: ${notification_type || 'Wartung'}
        Titel: ${title}
        Nachricht: ${message}
        Dringlichkeit: ${urgency || 'normal'}
        
        Die Nachricht soll klar, informativ und angemessen dringlich formuliert sein.`
      });
      
      // Send email
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: tenant.email,
        subject: `${urgency === 'urgent' ? '🔴 WICHTIG: ' : ''}${title}`,
        body: personalizedMessage,
        from_name: 'Hausverwaltung'
      });
      
      // Create in-app notification
      await base44.asServiceRole.entities.Notification.create({
        user_email: tenant.email,
        title,
        message: personalizedMessage,
        type: notification_type || 'maintenance',
        priority: urgency || 'normal',
        is_read: false,
        created_at: new Date().toISOString()
      });
      
      sentCount++;
    }
    
    return Response.json({
      success: true,
      recipients_count: sentCount,
      notification_type,
      title
    });
    
  } catch (error) {
    console.error('Error sending maintenance notification:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});