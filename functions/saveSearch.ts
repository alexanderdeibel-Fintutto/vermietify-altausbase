import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name, filters } = await req.json();

  const savedSearches = user.saved_searches || [];
  savedSearches.push({ id: Date.now().toString(), name, filters });

  await base44.auth.updateMe({ saved_searches: savedSearches });

  return Response.json({ success: true });
});