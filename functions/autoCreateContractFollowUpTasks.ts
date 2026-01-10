import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all active contracts expiring within 60 days
    const contracts = await base44.asServiceRole.entities.LeaseContract.list();
    const today = new Date();
    const inSixtyDays = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000);

    const expiringContracts = contracts.filter(c => {
      if (!c.end_date || c.status !== 'active') return false;
      const endDate = new Date(c.end_date);
      return endDate >= today && endDate <= inSixtyDays;
    });

    const createdTasks = [];

    for (const contract of expiringContracts) {
      // Check if task already exists
      const existingTasks = await base44.asServiceRole.entities.BuildingTask.filter({
        source_id: contract.id,
        source_type: 'contract_expiry'
      });

      if (existingTasks.length > 0) continue; // Skip if task already created

      // Get building and unit info
      const units = await base44.asServiceRole.entities.Unit.filter({ id: contract.unit_id });
      const unit = units[0];
      const buildings = await base44.asServiceRole.entities.Building.filter({ 
        id: unit?.gebaeude_id || unit?.building_id 
      });
      const building = buildings[0];

      const daysUntilExpiry = Math.floor((new Date(contract.end_date) - today) / (24 * 60 * 60 * 1000));

      // Create follow-up task
      const task = await base44.asServiceRole.entities.BuildingTask.create({
        building_id: building?.id,
        unit_id: contract.unit_id,
        task_title: `Mietvertrag verlängern/kündigen - ${unit?.unit_name || 'Einheit'}`,
        description: `Der Mietvertrag läuft in ${daysUntilExpiry} Tagen aus. Aktion erforderlich: Verlängerung, Kündigung oder Nachmietersuche.`,
        task_type: 'administrative',
        priority: daysUntilExpiry < 30 ? 'urgent' : 'high',
        status: 'open',
        due_date: new Date(contract.end_date).toISOString(),
        source_type: 'contract_expiry',
        source_id: contract.id,
        ai_generated: true,
        ai_priority_score: daysUntilExpiry < 30 ? 95 : 80
      });

      createdTasks.push(task);

      // Create notification
      await base44.asServiceRole.entities.Notification.create({
        user_email: user.email,
        title: 'Mietvertrag läuft bald aus',
        message: `Der Mietvertrag für ${unit?.unit_name || 'Einheit'} in ${building?.name || 'Gebäude'} läuft in ${daysUntilExpiry} Tagen aus`,
        type: 'contract_expiry',
        priority: daysUntilExpiry < 30 ? 'high' : 'medium',
        action_type: 'task',
        action_id: task.id,
        is_read: false
      });
    }

    return Response.json({ 
      message: `${createdTasks.length} Follow-up Tasks erstellt`,
      tasks: createdTasks
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});