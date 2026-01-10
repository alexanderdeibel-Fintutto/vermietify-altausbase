import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const pathname = url.pathname;
    const apiKey = req.headers.get('X-API-Key');

    if (!apiKey) {
      return Response.json({ error: 'API key required' }, { status: 401 });
    }

    // Simple API key validation (in production use proper token system)
    const isValidKey = apiKey.startsWith('pk_');

    if (!isValidKey) {
      return Response.json({ error: 'Invalid API key' }, { status: 401 });
    }

    // GET /api/v1/documents
    if (pathname === '/api/v1/documents' && req.method === 'GET') {
      const base44 = createClientFromRequest(req);
      const limit = parseInt(url.searchParams.get('limit') || '50');
      const offset = parseInt(url.searchParams.get('offset') || '0');

      const docs = await base44.asServiceRole.entities.Document.list('-created_date', limit);
      return Response.json({ documents: docs, total: docs.length });
    }

    // GET /api/v1/documents/:id
    if (pathname.match(/^\/api\/v1\/documents\/[^\/]+$/) && req.method === 'GET') {
      const base44 = createClientFromRequest(req);
      const docId = pathname.split('/').pop();
      const doc = await base44.asServiceRole.entities.Document.read(docId);
      return Response.json(doc);
    }

    // POST /api/v1/documents
    if (pathname === '/api/v1/documents' && req.method === 'POST') {
      const base44 = createClientFromRequest(req);
      const data = await req.json();
      const doc = await base44.asServiceRole.entities.Document.create(data);
      return Response.json(doc, { status: 201 });
    }

    // POST /api/v1/documents/:id/workflows
    if (pathname.match(/^\/api\/v1\/documents\/[^\/]+\/workflows$/) && req.method === 'POST') {
      const base44 = createClientFromRequest(req);
      const docId = pathname.split('/')[4];
      const { workflow_id } = await req.json();

      const execution = await base44.asServiceRole.entities.WorkflowExecution.create({
        workflow_id,
        variables: { document_id: docId }
      });

      return Response.json(execution, { status: 201 });
    }

    return Response.json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('API error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});