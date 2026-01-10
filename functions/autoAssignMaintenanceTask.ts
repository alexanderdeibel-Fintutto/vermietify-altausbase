import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const { task_id } = await req.json();

  const task = await base44.asServiceRole.entities.MaintenanceTask.filter({ 
    id: task_id 
  }).then(t => t[0]);

  if (!task) {
    return Response.json({ error: 'Task not found' }, { status: 404 });
  }

  // Get building location
  const building = task.building_id
    ? await base44.asServiceRole.entities.Building.filter({ id: task.building_id }).then(b => b[0])
    : null;

  // Get all available technicians
  const allTechnicians = await base44.asServiceRole.entities.BuildingManager.filter({ 
    is_active: true 
  });

  // Score and rank technicians
  const scoredTechnicians = allTechnicians.map(tech => {
    let score = 0;

    // Check specialization match
    if (tech.specializations?.includes(task.category)) {
      score += 50;
    }

    // Check if technician is assigned to this building
    if (building && tech.assigned_buildings?.includes(building.id)) {
      score += 30;
    }

    // Check for general capability
    if (tech.specializations?.includes('general')) {
      score += 10;
    }

    // Prefer technicians with fewer current tasks (load balancing)
    // This is a simplified version - in production you'd query their current workload
    score += Math.random() * 10; // Add some randomness for load balancing

    return { technician: tech, score };
  });

  // Sort by score and get best match
  scoredTechnicians.sort((a, b) => b.score - a.score);
  const bestMatch = scoredTechnicians[0];

  if (!bestMatch || bestMatch.score === 0) {
    return Response.json({ 
      success: false, 
      error: 'No suitable technician found',
      available_technicians: allTechnicians.length
    });
  }

  // Assign task
  await base44.asServiceRole.entities.MaintenanceTask.update(task_id, {
    assigned_to: bestMatch.technician.user_email,
    status: 'assigned'
  });

  // Notify technician
  await base44.asServiceRole.functions.invoke('sendNotificationWithEmail', {
    user_email: bestMatch.technician.user_email,
    title: 'Neuer Wartungsauftrag zugewiesen',
    message: `Ihnen wurde ein Wartungsauftrag zugewiesen: ${task.title}\nKategorie: ${task.category}\nPriorität: ${task.priority}`,
    type: 'maintenance',
    priority: task.priority === 'urgent' ? 'critical' : 'normal',
    related_entity_type: 'maintenance',
    related_entity_id: task.id
  });

  return Response.json({ 
    success: true,
    assigned_to: bestMatch.technician.full_name,
    assigned_email: bestMatch.technician.user_email,
    match_score: bestMatch.score,
    reason: getAssignmentReason(bestMatch.technician, task, building)
  });
});

function getAssignmentReason(technician, task, building) {
  const reasons = [];
  
  if (technician.specializations?.includes(task.category)) {
    reasons.push('Passende Spezialisierung');
  }
  
  if (building && technician.assigned_buildings?.includes(building.id)) {
    reasons.push('Zuständig für dieses Gebäude');
  }
  
  if (reasons.length === 0) {
    reasons.push('Verfügbarer Techniker');
  }
  
  return reasons.join(', ');
}