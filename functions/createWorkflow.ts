import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { trigger, action } = await req.json();

  await base44.entities.Workflow.create({
    trigger,
    action,
    is_active: true,
    executions: 0
  });

  return Response.json({ success: true });
});