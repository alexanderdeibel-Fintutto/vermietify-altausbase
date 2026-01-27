import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Load all users (only admins can see all users due to User entity security)
    const users = await base44.asServiceRole.entities.User.list();

    // Return email and name only
    const userList = users.map(u => ({
      email: u.email,
      full_name: u.full_name,
      role: u.role
    }));

    return Response.json(userList);

  } catch (error) {
    console.error('Error loading org users:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});