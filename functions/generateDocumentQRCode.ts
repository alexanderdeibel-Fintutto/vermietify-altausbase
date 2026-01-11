import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { document_id } = await req.json();

    const doc = await base44.asServiceRole.entities.Document.read(document_id);

    // Generate QR code data
    const qrData = {
      document_id: doc.id,
      name: doc.name,
      url: `https://app.example.com/documents/${doc.id}`,
      created: doc.created_date
    };

    // Use external QR code API
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(JSON.stringify(qrData))}`;

    return Response.json({
      success: true,
      qr_code_url: qrCodeUrl,
      qr_data: qrData
    });
  } catch (error) {
    console.error('QR code error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});