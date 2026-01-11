import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { tenant_id, company_id } = await req.json();
    
    // Get tenant context
    const tenant = await base44.asServiceRole.entities.Tenant.read(tenant_id);
    const contracts = await base44.asServiceRole.entities.LeaseContract.filter({ 
      tenant_id, 
      status: 'active' 
    });
    const contract = contracts[0];
    
    let unit, building;
    if (contract?.unit_id) {
      unit = await base44.asServiceRole.entities.Unit.read(contract.unit_id);
      building = await base44.asServiceRole.entities.Building.read(unit.building_id);
    }
    
    // Get relevant maintenance tasks for their building
    const maintenanceTasks = building ? await base44.asServiceRole.entities.MaintenanceTask.filter({
      building_id: building.id,
      status: { $in: ['open', 'in_progress'] }
    }, '-created_date', 5) : [];
    
    // Get announcements
    const announcements = await base44.asServiceRole.entities.Announcement.filter({
      company_id,
      target_audience: { $in: ['all_tenants', 'specific_building'] }
    }, '-published_at', 3);
    
    // Get upcoming inspections
    const inspections = building ? await base44.asServiceRole.entities.BuildingInspection.filter({
      building_id: building.id,
      status: 'scheduled'
    }) : [];
    
    const prompt = `Erstelle ein personalisiertes Update für einen Mieter:

MIETER: ${tenant.first_name} ${tenant.last_name}
WOHNUNG: ${unit?.unit_number || 'N/A'}
GEBÄUDE: ${building?.address?.street || 'N/A'}

AKTUELLE WARTUNGEN IM GEBÄUDE:
${maintenanceTasks.map(t => `- ${t.title} (${t.status})`).join('\n') || 'Keine'}

ANKÜNDIGUNGEN:
${announcements.map(a => `- ${a.title}`).join('\n') || 'Keine'}

GEPLANTE INSPEKTIONEN:
${inspections.map(i => `- ${i.inspection_type} am ${i.inspection_date}`).join('\n') || 'Keine'}

Verfasse ein freundliches, personalisiertes Update (150-200 Wörter) das:
1. Relevante Wartungen erwähnt, die den Mieter betreffen könnten
2. Wichtige Ankündigungen hervorhebt
3. Über kommende Inspektionen informiert
4. Einen positiven, informativen Ton hat

Beginne mit "Hallo ${tenant.first_name}," und ende mit "Ihre Hausverwaltung"`;

    const update = await base44.integrations.Core.InvokeLLM({ prompt });
    
    // Create notification
    await base44.asServiceRole.entities.TenantNotification.create({
      tenant_id,
      company_id,
      notification_type: 'contract_update',
      title: 'Ihr persönliches Update',
      message: update,
      priority: 'medium',
      is_read: false,
      sent_at: new Date().toISOString()
    });
    
    return Response.json({ update, notification_sent: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});