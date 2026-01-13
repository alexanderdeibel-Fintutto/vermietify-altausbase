import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const method = req.method;

    // API Routes
    if (url.pathname === '/api/documents' && method === 'GET') {
      const documents = await base44.entities.Document.list('-updated_date', 100);
      return Response.json({ data: documents });
    }

    if (url.pathname.startsWith('/api/documents/') && method === 'GET') {
      const id = url.pathname.split('/').pop();
      const doc = await base44.entities.Document.list('', 1, { id: id });
      return Response.json({ data: doc[0] || null });
    }

    if (url.pathname === '/api/documents' && method === 'POST') {
      const body = await req.json();
      const document = await base44.entities.Document.create(body);
      
      // Log activity
      await base44.asServiceRole.functions.invoke('logActivity', {
        action: 'CREATE',
        entityType: 'Document',
        entityId: document.id,
        change: `Created: ${body.name}`
      });

      return Response.json({ data: document }, { status: 201 });
    }

    if (url.pathname.startsWith('/api/documents/') && method === 'PUT') {
      const id = url.pathname.split('/').pop();
      const body = await req.json();
      const document = await base44.entities.Document.update(id, body);
      
      // Log activity
      await base44.asServiceRole.functions.invoke('logActivity', {
        action: 'UPDATE',
        entityType: 'Document',
        entityId: id,
        change: JSON.stringify(body)
      });

      return Response.json({ data: document });
    }

    if (url.pathname.startsWith('/api/documents/') && method === 'DELETE') {
      const id = url.pathname.split('/').pop();
      await base44.entities.Document.delete(id);
      
      // Log activity
      await base44.asServiceRole.functions.invoke('logActivity', {
        action: 'DELETE',
        entityType: 'Document',
        entityId: id,
        change: 'Document deleted'
      });

      return Response.json({ success: true });
    }

    return Response.json({ error: 'Not found' }, { status: 404 });

  } catch (error) {
    console.error('API error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});