import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { query } = await req.json();

  const documents = await base44.entities.Document.list(null, 500);
  
  const results = documents
    .filter(doc => 
      doc.name?.toLowerCase().includes(query.toLowerCase()) ||
      doc.content?.toLowerCase().includes(query.toLowerCase()) ||
      doc.ai_summary?.toLowerCase().includes(query.toLowerCase())
    )
    .slice(0, 20)
    .map(doc => ({
      id: doc.id,
      title: doc.name,
      excerpt: doc.ai_summary || doc.content?.slice(0, 100),
      type: doc.category
    }));

  return Response.json({ results });
});