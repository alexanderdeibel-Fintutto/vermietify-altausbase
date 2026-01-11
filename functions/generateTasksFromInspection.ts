import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { inspection_id } = await req.json();
    
    const inspection = await base44.asServiceRole.entities.BuildingInspection.read(inspection_id);
    const findings = await base44.asServiceRole.entities.InspectionFinding.filter({ 
      inspection_id,
      resolution_status: 'open'
    });
    
    const tasksCreated = [];
    
    for (const finding of findings) {
      // Only create tasks for findings that need action
      if (finding.severity === 'minor') continue;
      
      const priorityMap = {
        'critical': 'urgent',
        'major': 'high',
        'moderate': 'medium'
      };
      
      const task = await base44.asServiceRole.entities.MaintenanceTask.create({
        building_id: inspection.building_id,
        company_id: inspection.company_id,
        title: `Inspektion: ${finding.category} - ${finding.location}`,
        description: `Befund aus Inspektion vom ${inspection.inspection_date}:\n\n${finding.description}`,
        category: finding.category.toLowerCase(),
        priority: priorityMap[finding.severity] || 'medium',
        status: 'open',
        estimated_cost: finding.estimated_cost,
        inspection_finding_id: finding.id
      });
      
      // Update finding with task reference
      await base44.asServiceRole.entities.InspectionFinding.update(finding.id, {
        maintenance_task_id: task.id,
        resolution_status: 'task_created'
      });
      
      tasksCreated.push(task);
    }
    
    // Update inspection stats
    await base44.asServiceRole.entities.BuildingInspection.update(inspection_id, {
      tasks_generated: tasksCreated.length,
      status: 'reviewed'
    });
    
    return Response.json({ 
      success: true, 
      tasks_created: tasksCreated.length,
      tasks: tasksCreated 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});