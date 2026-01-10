import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { company_id, query } = await req.json();

    // Get all documents
    const docs = await base44.asServiceRole.entities.Document.filter({ company_id });
    const docContent = docs.map(d => `[${d.name}]: ${d.content?.substring(0, 200)}...`).join('\n');

    // AI-based search and response
    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `Du bist ein Dokumenten-Assistant. Beantworte die folgende Frage basierend auf den verfügbaren Dokumenten:\n\nDokumente:\n${docContent}\n\nFrage: ${query}\n\nGib eine hilfreiche Antwort und verweise auf relevante Dokumente.`,
      add_context_from_internet: false
    });

    return Response.json({
      success: true,
      answer: response,
      references: docs.filter(d => 
        query.toLowerCase().split(' ').some(word => 
          d.name.toLowerCase().includes(word)
        )
      ).slice(0, 3)
    });
  } catch (error) {
    console.error('Chatbot error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});