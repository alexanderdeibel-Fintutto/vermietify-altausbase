import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { document_id, content } = await req.json();

  await base44.entities.Document.update(document_id, { content });

  await base44.entities.DocumentVersion.create({
    document_id,
    content,
    edited_by: user.email,
    timestamp: new Date().toISOString()
  });

  return Response.json({ success: true });
});