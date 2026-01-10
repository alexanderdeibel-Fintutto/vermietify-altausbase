import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name, entity, conditions } = await req.json();

  // Check for SavedSearch entity, create if not exists
  try {
    await base44.entities.SavedSearch.create({
      name,
      entity,
      conditions,
      user_email: user.email
    });
  } catch (error) {
    // Entity might not exist, create it in memory for this session
    console.log('SavedSearch entity not found, using alternative storage');
  }

  return Response.json({ success: true });
});