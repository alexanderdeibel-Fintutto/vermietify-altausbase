import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { document_id, watermark_text, position = 'diagonal', opacity = 0.3 } = await req.json();

    const doc = await base44.asServiceRole.entities.Document.read(document_id);

    // For text documents, add watermark to content
    const watermarkedContent = `
${watermark_text.toUpperCase()} - WATERMARKED
================================

${doc.content}

================================
${watermark_text.toUpperCase()} - ${new Date().toLocaleDateString()}
`;

    // Create watermarked version
    const watermarked = await base44.asServiceRole.entities.DocumentVersion.create({
      document_id,
      version_number: (doc.version || 1) + 1,
      content: watermarkedContent,
      change_notes: `Watermark added: ${watermark_text}`,
      created_by: user.email
    });

    // Update main document
    await base44.asServiceRole.entities.Document.update(document_id, {
      content: watermarkedContent,
      metadata: {
        ...(doc.metadata || {}),
        watermarked: true,
        watermark_text,
        watermark_date: new Date().toISOString()
      }
    });

    return Response.json({ success: true, version: watermarked });
  } catch (error) {
    console.error('Watermark error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});