import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const favorites = user.favorites || [
    { id: '1', title: 'Meine Gebäude', type: 'buildings' },
    { id: '2', title: 'Steuer-Dashboard', type: 'tax' }
  ];

  return Response.json({ favorites });
});