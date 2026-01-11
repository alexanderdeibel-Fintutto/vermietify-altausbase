import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { company_id, document_id } = await req.json();

    const doc = await base44.asServiceRole.entities.Document.read(document_id);
    const allDocs = await base44.asServiceRole.entities.Document.filter({ company_id });

    // AI-based relationship detection
    const relationships = [];

    for (const otherDoc of allDocs.slice(0, 20)) {
      if (otherDoc.id === document_id) continue;

      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `Analysiere die Beziehung zwischen diesen Dokumenten:

Doc1: ${doc.name}
Inhalt: ${doc.content?.substring(0, 300)}

Doc2: ${otherDoc.name}
Inhalt: ${otherDoc.content?.substring(0, 300)}

Gib JSON mit "has_relationship" (boolean), "relationship_type" (references/supersedes/amends/related_to/derived_from), "confidence" (0-1) zurück.`,
        response_json_schema: {
          type: 'object',
          properties: {
            has_relationship: { type: 'boolean' },
            relationship_type: { type: 'string' },
            confidence: { type: 'number' }
          }
        }
      });

      if (analysis.has_relationship && analysis.confidence > 0.6) {
        const rel = await base44.asServiceRole.entities.DocumentRelationship.create({
          source_document_id: document_id,
          target_document_id: otherDoc.id,
          company_id,
          relationship_type: analysis.relationship_type,
          confidence: analysis.confidence,
          detected_by_ai: true
        });

        relationships.push(rel);
      }
    }

    return Response.json({ success: true, relationships });
  } catch (error) {
    console.error('Relationship detection error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});