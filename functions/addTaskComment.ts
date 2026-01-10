import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { task_id, comment } = await req.json();

  await base44.entities.TeamActivityLog.create({
    task_id,
    user_name: user.full_name,
    text: comment,
    type: 'task_comment',
    timestamp: new Date().toISOString()
  });

  return Response.json({ success: true });
});