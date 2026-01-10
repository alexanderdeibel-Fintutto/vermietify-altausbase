import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const users = await base44.asServiceRole.entities.User.list(null, 100);

  return Response.json({
    users: users.map(u => ({
      id: u.id,
      name: u.full_name,
      email: u.email,
      role: u.role
    }))
  });
});