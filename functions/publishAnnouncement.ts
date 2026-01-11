import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { 
      company_id, 
      title, 
      message, 
      announcement_type, 
      target_audience, 
      building_id,
      priority = 'medium',
      send_push = true,
      send_email = false 
    } = await req.json();
    
    // Create announcement
    const announcement = await base44.asServiceRole.entities.Announcement.create({
      company_id,
      title,
      message,
      announcement_type,
      target_audience,
      building_id,
      priority,
      send_push,
      send_email,
      published_at: new Date().toISOString()
    });
    
    // Get target tenants
    let tenants = [];
    if (target_audience === 'all_tenants') {
      tenants = await base44.asServiceRole.entities.Tenant.filter({ company_id });
    } else if (target_audience === 'specific_building' && building_id) {
      const units = await base44.asServiceRole.entities.Unit.filter({ building_id });
      const unitIds = units.map(u => u.id);
      const contracts = await base44.asServiceRole.entities.LeaseContract.filter({ status: 'active' });
      const activeTenantIds = contracts.filter(c => unitIds.includes(c.unit_id)).map(c => c.tenant_id);
      tenants = await Promise.all(activeTenantIds.map(id => base44.asServiceRole.entities.Tenant.read(id)));
    }
    
    // Send notifications to each tenant
    for (const tenant of tenants) {
      // Create in-app notification
      await base44.asServiceRole.entities.TenantNotification.create({
        tenant_id: tenant.id,
        company_id,
        notification_type: 'contract_update',
        title,
        message,
        related_entity_id: announcement.id,
        priority,
        is_read: false,
        sent_at: new Date().toISOString()
      });
      
      // Send email if requested
      if (send_email && tenant.email) {
        await base44.integrations.Core.SendEmail({
          to: tenant.email,
          subject: `📢 ${title}`,
          body: `Hallo ${tenant.first_name},\n\n${message}\n\nMit freundlichen Grüßen\nIhre Hausverwaltung`
        });
      }
    }
    
    return Response.json({ 
      success: true, 
      announcement,
      notifications_sent: tenants.length 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});