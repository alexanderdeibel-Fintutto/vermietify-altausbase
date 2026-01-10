import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searches = user.saved_searches || [
    { id: '1', name: 'Offene Rechnungen', filters: { status: 'open' } },
    { id: '2', name: 'Steuer-Dokumente 2025', filters: { category: 'tax', year: 2025 } }
  ];

  return Response.json({ searches });
});