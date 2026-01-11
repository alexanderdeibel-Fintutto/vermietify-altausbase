import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { document_id_1, document_id_2 } = await req.json();

    const doc1 = await base44.asServiceRole.entities.Document.read(document_id_1);
    const doc2 = await base44.asServiceRole.entities.Document.read(document_id_2);

    // AI-based comparison
    const comparison = await base44.integrations.Core.InvokeLLM({
      prompt: `Vergleiche diese beiden Dokumente und gib Unterschiede zurück:

Dokument 1: "${doc1.name}"
${doc1.content?.substring(0, 1000)}

Dokument 2: "${doc2.name}"
${doc2.content?.substring(0, 1000)}

Gib JSON mit "differences", "similarity_score", "summary" zurück.`,
      response_json_schema: {
        type: 'object',
        properties: {
          differences: { type: 'array', items: { type: 'string' } },
          similarity_score: { type: 'number' },
          summary: { type: 'string' }
        }
      }
    });

    return Response.json({ success: true, comparison });
  } catch (error) {
    console.error('Comparison error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});