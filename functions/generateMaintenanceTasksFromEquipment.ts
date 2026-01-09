import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Automatically generates maintenance tasks from equipment next_maintenance_date
 * Should be run as a scheduled task (e.g., daily)
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    console.log('Starting automatic maintenance task generation...');

    // Fetch all equipment
    const equipment = await base44.asServiceRole.entities.Equipment.list('-updated_date', 500);
    
    // Fetch existing tasks to avoid duplicates
    const existingTasks = await base44.asServiceRole.entities.MaintenanceTask.list('-created_date', 1000);

    let createdCount = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const item of equipment) {
      // Skip if no next_maintenance_date or status is defective
      if (!item.next_maintenance_date || item.status === 'defective') {
        continue;
      }

      const nextMaintenanceDate = new Date(item.next_maintenance_date);
      nextMaintenanceDate.setHours(0, 0, 0, 0);

      // Only create task if maintenance is due today or in the future
      if (nextMaintenanceDate < today) {
        continue;
      }

      // Check if a task already exists for this equipment on this date
      const existingTask = existingTasks.find(task => 
        task.equipment_id === item.id && 
        task.due_date === item.next_maintenance_date &&
        task.status !== 'completed'
      );

      if (existingTask) {
        console.log(`Task already exists for equipment ${item.id} on ${item.next_maintenance_date}`);
        continue;
      }

      // Create new maintenance task
      try {
        const taskData = {
          title: `Wartung: ${item.name}`,
          description: `Geplante Wartung für ${item.name}${item.manufacturer ? ` (${item.manufacturer})` : ''}\nSeriennummer: ${item.serial_number || 'N/A'}\nStandort: ${item.location || 'N/A'}`,
          task_type: 'maintenance',
          equipment_id: item.id,
          building_id: item.building_id,
          unit_id: item.unit_id || '',
          priority: item.status === 'maintenance' ? 'high' : 'medium',
          status: 'open',
          due_date: item.next_maintenance_date,
          estimated_duration_hours: 2,
          notes: `Wartungsintervall: ${item.maintenance_interval_months} Monate`
        };

        await base44.asServiceRole.entities.MaintenanceTask.create(taskData);
        createdCount++;
        console.log(`Created maintenance task for equipment: ${item.name} (due: ${item.next_maintenance_date})`);
      } catch (err) {
        console.error(`Failed to create task for equipment ${item.id}:`, err.message);
      }
    }

    console.log(`Maintenance task generation complete. Created ${createdCount} tasks.`);

    return Response.json({
      success: true,
      created_count: createdCount,
      message: `${createdCount} neue Wartungsaufgaben erstellt`
    });
  } catch (error) {
    console.error('Error generating maintenance tasks:', error);
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
});