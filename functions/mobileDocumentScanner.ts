import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { company_id, image_file } = await req.json();

    // Upload image
    const { file_url } = await base44.integrations.Core.UploadFile({
      file: image_file
    });

    // OCR processing
    const ocrResult = await base44.integrations.Core.InvokeLLM({
      prompt: 'Extrahiere Text aus diesem gescannten Dokument. Erkenne auch den Dokumenttyp. Gib JSON mit "text", "document_type", "key_data" zurück.',
      file_urls: [file_url],
      response_json_schema: {
        type: 'object',
        properties: {
          text: { type: 'string' },
          document_type: { type: 'string' },
          key_data: { type: 'object' }
        }
      }
    });

    // Create document
    const doc = await base44.asServiceRole.entities.Document.create({
      company_id,
      name: `Scan ${new Date().toLocaleDateString('de-DE')}`,
      content: ocrResult.text,
      document_type: ocrResult.document_type || 'scanned_document',
      file_url,
      tags: ['mobile-scan', 'ocr'],
      metadata: {
        scanned_by: user.email,
        scanned_at: new Date().toISOString(),
        key_data: ocrResult.key_data
      }
    });

    return Response.json({ success: true, document: doc, ocr_result: ocrResult });
  } catch (error) {
    console.error('Mobile scanner error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});