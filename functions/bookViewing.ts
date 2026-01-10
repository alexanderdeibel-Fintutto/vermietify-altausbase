import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { date } = await req.json();

  await base44.entities.Task.create({
    title: `Besichtigung: ${user.full_name}`,
    due_date: date,
    status: 'scheduled'
  });

  return Response.json({ success: true });
});