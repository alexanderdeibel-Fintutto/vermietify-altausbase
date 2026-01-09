import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { building_id, task_template, frequency, start_date } = await req.json();

    // Calculate next occurrences based on frequency
    const getNextDates = (freq, start) => {
      const dates = [];
      const startDate = new Date(start || Date.now());
      
      for (let i = 0; i < 12; i++) { // Plan next 12 occurrences
        const nextDate = new Date(startDate);
        
        switch (freq) {
          case 'monthly':
            nextDate.setMonth(startDate.getMonth() + i);
            break;
          case 'quarterly':
            nextDate.setMonth(startDate.getMonth() + (i * 3));
            break;
          case 'semi-annual':
            nextDate.setMonth(startDate.getMonth() + (i * 6));
            break;
          case 'annual':
            nextDate.setFullYear(startDate.getFullYear() + i);
            break;
          default:
            nextDate.setMonth(startDate.getMonth() + i);
        }
        
        dates.push(nextDate.toISOString());
      }
      
      return dates;
    };

    const nextDates = getNextDates(frequency, start_date);
    const createdTasks = [];

    // Create first 3 tasks immediately, rest as scheduled
    for (let i = 0; i < Math.min(3, nextDates.length); i++) {
      const taskData = {
        building_id: building_id,
        task_title: task_template.title,
        description: task_template.description,
        task_type: task_template.task_type,
        priority: task_template.priority,
        status: 'open',
        due_date: nextDates[i],
        is_recurring: true,
        recurrence_pattern: frequency
      };

      const task = await base44.asServiceRole.entities.BuildingTask.create(taskData);
      createdTasks.push(task);
    }

    return Response.json({
      success: true,
      created_count: createdTasks.length,
      tasks: createdTasks,
      next_dates: nextDates.slice(3, 6) // Show next 3 upcoming dates
    });

  } catch (error) {
    console.error('Recurring task schedule error:', error);
    return Response.json({ 
      error: error.message,
      success: false
    }, { status: 500 });
  }
});