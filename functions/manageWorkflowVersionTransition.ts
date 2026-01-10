import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      action,
      workflow_id,
      company_id,
      from_version,
      to_version,
      execution_ids = [],
      transition_strategy = 'complete_on_current'
    } = await req.json();

    if (action === 'migrate_instances') {
      const executions = await base44.asServiceRole.entities.WorkflowExecution.filter({
        workflow_id,
        status: 'running'
      });

      const toMigrate = execution_ids.length > 0
        ? executions.filter(e => execution_ids.includes(e.id))
        : executions;

      if (transition_strategy === 'migrate_to_new') {
        // Migrate instances to new version
        const updates = toMigrate.map(exec =>
          base44.asServiceRole.entities.WorkflowExecution.update(exec.id, {
            workflow_version: to_version,
            migrated_at: new Date().toISOString(),
            migrated_from_version: from_version
          })
        );

        await Promise.all(updates);

        // Log migration
        await base44.functions.invoke('logAuditAction', {
          action_type: 'workflow_executed',
          entity_type: 'workflow',
          entity_id: workflow_id,
          user_email: user.email,
          company_id,
          description: `${toMigrate.length} Workflow-Instanzen von Version ${from_version} zu ${to_version} migriert`,
          metadata: {
            from_version,
            to_version,
            instances_migrated: toMigrate.length,
            strategy: 'migrate_to_new'
          }
        });
      } else if (transition_strategy === 'complete_on_current') {
        // Mark instances to complete on current version
        const updates = toMigrate.map(exec =>
          base44.asServiceRole.entities.WorkflowExecution.update(exec.id, {
            force_complete_on_version: from_version
          })
        );

        await Promise.all(updates);

        // Log strategy selection
        await base44.functions.invoke('logAuditAction', {
          action_type: 'workflow_updated',
          entity_type: 'workflow',
          entity_id: workflow_id,
          user_email: user.email,
          company_id,
          description: `${toMigrate.length} Workflow-Instanzen werden auf Version ${from_version} abgeschlossen`,
          metadata: {
            from_version,
            to_version,
            instances_affected: toMigrate.length,
            strategy: 'complete_on_current'
          }
        });
      }

      return Response.json({
        success: true,
        migrated_instances: toMigrate.length,
        strategy: transition_strategy
      });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Manage workflow version transition error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});