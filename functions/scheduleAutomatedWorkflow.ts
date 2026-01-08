import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { workflow_type, schedule, config } = await req.json();

    console.log(`[AUTOMATION] Scheduling workflow: ${workflow_type}`);

    const workflows = {
      'auto_validate': {
        description: 'Automatische Validierung neuer Submissions',
        action: 'validate_new_submissions'
      },
      'deadline_reminders': {
        description: 'Erinnerungen an Steuerfristen',
        action: 'send_deadline_reminders'
      },
      'monthly_report': {
        description: 'Monatlicher ELSTER Report',
        action: 'send_monthly_report'
      },
      'auto_backup': {
        description: 'Automatisches Backup',
        action: 'create_backups'
      },
      'data_cleanup': {
        description: 'Datenbereinigung',
        action: 'cleanup_old_data'
      }
    };

    const workflow = workflows[workflow_type];
    if (!workflow) {
      return Response.json({ error: 'Unknown workflow type' }, { status: 400 });
    }

    // Simulate scheduling (in production würde hier ein echter Scheduler verwendet)
    const scheduledTask = {
      id: `task_${Date.now()}`,
      workflow_type,
      workflow: workflow,
      schedule,
      config,
      status: 'scheduled',
      created_at: new Date().toISOString(),
      created_by: user.email
    };

    return Response.json({ 
      success: true, 
      task: scheduledTask,
      message: `Workflow "${workflow.description}" erfolgreich geplant`
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});