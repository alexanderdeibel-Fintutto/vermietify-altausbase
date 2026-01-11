import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const apiKey = req.headers.get('X-API-Key');
    
    if (!apiKey) {
      return Response.json({ error: 'API key required' }, { status: 401 });
    }

    // Verify API key
    const keys = await base44.asServiceRole.entities.APIKey.filter({ key: apiKey, is_active: true });
    if (keys.length === 0) {
      return Response.json({ error: 'Invalid API key' }, { status: 401 });
    }

    const apiKeyRecord = keys[0];
    const base44 = createClientFromRequest(req);

    const endpoint = url.pathname.split('/api/documents/')[1];
    const method = req.method;

    // GET /api/documents - List documents
    if (method === 'GET' && !endpoint) {
      const docs = await base44.asServiceRole.entities.Document.filter({
        company_id: apiKeyRecord.company_id
      });
      return Response.json({ documents: docs, count: docs.length });
    }

    // GET /api/documents/:id - Get document
    if (method === 'GET' && endpoint) {
      const doc = await base44.asServiceRole.entities.Document.read(endpoint);
      if (doc.company_id !== apiKeyRecord.company_id) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
      return Response.json({ document: doc });
    }

    // POST /api/documents - Create document
    if (method === 'POST' && !endpoint) {
      const body = await req.json();
      const doc = await base44.asServiceRole.entities.Document.create({
        ...body,
        company_id: apiKeyRecord.company_id,
        created_by: 'api'
      });
      return Response.json({ document: doc }, { status: 201 });
    }

    // PUT /api/documents/:id - Update document
    if (method === 'PUT' && endpoint) {
      const body = await req.json();
      const doc = await base44.asServiceRole.entities.Document.update(endpoint, body);
      return Response.json({ document: doc });
    }

    // DELETE /api/documents/:id - Delete document
    if (method === 'DELETE' && endpoint) {
      await base44.asServiceRole.entities.Document.delete(endpoint);
      return Response.json({ success: true }, { status: 204 });
    }

    return Response.json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('API error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});