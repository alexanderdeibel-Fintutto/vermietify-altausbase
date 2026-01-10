import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { approval_id, approved } = await req.json();

  await base44.entities.ApprovalWorkflow.update(approval_id, {
    status: approved ? 'approved' : 'rejected',
    approved_by: user.email,
    approved_at: new Date().toISOString()
  });

  return Response.json({ success: true });
});