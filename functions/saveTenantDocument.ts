import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { file_url, name } = await req.json();

  await base44.entities.Document.create({
    name,
    file_url,
    category: 'Sonstiges',
    status: 'gescannt',
    is_uploaded: true
  });

  return Response.json({ success: true });
});