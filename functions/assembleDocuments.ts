import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { company_id, document_ids, output_name, operation = 'merge' } = await req.json();

    const documents = await Promise.all(
      document_ids.map(id => base44.asServiceRole.entities.Document.read(id))
    );

    let mergedContent = '';
    let mergedMetadata = {};

    if (operation === 'merge') {
      // Simple concatenation
      mergedContent = documents.map(doc => `
=== ${doc.name} ===
${doc.content || ''}
`).join('\n\n');

      mergedMetadata = {
        source_documents: document_ids,
        merged_at: new Date().toISOString(),
        merged_by: user.email
      };
    } else if (operation === 'template_fill') {
      // AI-based template filling
      const template = documents[0];
      const data = documents.slice(1);

      const filled = await base44.integrations.Core.InvokeLLM({
        prompt: `Fülle diese Vorlage mit Daten aus den folgenden Dokumenten:

Template: ${template.content}

Daten: ${data.map(d => d.content).join('\n\n')}

Gib das ausgefüllte Dokument zurück.`,
        response_json_schema: {
          type: 'object',
          properties: {
            content: { type: 'string' }
          }
        }
      });

      mergedContent = filled.content;
    }

    // Create merged document
    const merged = await base44.asServiceRole.entities.Document.create({
      company_id,
      name: output_name || `Merged Document ${new Date().toLocaleDateString()}`,
      content: mergedContent,
      document_type: 'merged',
      tags: ['assembled', 'merged'],
      metadata: mergedMetadata
    });

    return Response.json({ success: true, document: merged });
  } catch (error) {
    console.error('Assembly error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});