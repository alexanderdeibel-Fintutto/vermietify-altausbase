import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { problem_ids, updates, action } = await req.json();

    if (!problem_ids || problem_ids.length === 0) {
      return Response.json({ error: 'No problem IDs provided' }, { status: 400 });
    }

    const results = {
      success: [],
      failed: []
    };

    // Bulk-Aktionen
    for (const id of problem_ids) {
      try {
        switch(action) {
          case 'update_status':
            await base44.asServiceRole.entities.UserProblem.update(id, {
              status: updates.status,
              assigned_to: updates.assigned_to || null
            });
            break;

          case 'assign':
            await base44.asServiceRole.entities.UserProblem.update(id, {
              assigned_to: updates.assigned_to,
              status: 'in_progress'
            });
            break;

          case 'close':
            await base44.asServiceRole.entities.UserProblem.update(id, {
              status: 'resolved',
              geloest_am: new Date().toISOString(),
              bearbeiter_email: user.email
            });
            break;

          case 'delete':
            await base44.asServiceRole.entities.UserProblem.delete(id);
            break;

          case 'recalculate_priority':
            const problems = await base44.asServiceRole.entities.UserProblem.filter({ id });
            if (problems.length > 0) {
              const response = await base44.functions.invoke('calculateIntelligentPriority', {
                problem: problems[0]
              });
              if (response.data) {
                await base44.asServiceRole.entities.UserProblem.update(id, {
                  priority_score: response.data.priority_score,
                  business_priority: response.data.business_priority,
                  priority_breakdown: response.data.priority_breakdown
                });
              }
            }
            break;

          default:
            if (updates) {
              await base44.asServiceRole.entities.UserProblem.update(id, updates);
            }
        }
        results.success.push(id);
      } catch (error) {
        results.failed.push({ id, error: error.message });
      }
    }

    return Response.json({
      success: true,
      processed: problem_ids.length,
      successful: results.success.length,
      failed: results.failed.length,
      details: results
    });

  } catch (error) {
    console.error('Error in bulk update:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});