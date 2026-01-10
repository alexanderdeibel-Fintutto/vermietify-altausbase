import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { file_url } = await req.json();

    // Use AI for OCR and content extraction
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Extrahiere Text und Metadaten aus diesem Dokument. Gib eine JSON mit "text", "metadata", "key_fields" zurück.`,
      file_urls: [file_url],
      response_json_schema: {
        type: 'object',
        properties: {
          text: { type: 'string' },
          metadata: { type: 'object' },
          key_fields: { type: 'object' },
          confidence: { type: 'number' }
        }
      }
    });

    return Response.json({
      success: true,
      extracted_text: result.text,
      metadata: result.metadata,
      key_fields: result.key_fields,
      confidence: result.confidence
    });
  } catch (error) {
    console.error('OCR error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});