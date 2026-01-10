import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userData = {
    user: { email: user.email, name: user.full_name },
    created_buildings: await base44.entities.Building.filter({ created_by: user.email }),
    created_documents: await base44.entities.Document.filter({ created_by: user.email }),
    activities: await base44.entities.UserActivity.filter({ user_email: user.email })
  };

  return Response.json(userData);
});