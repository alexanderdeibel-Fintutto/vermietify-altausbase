import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { document_id, shared_with_email, access_level, expires_at } = await req.json();

    if (!document_id || !shared_with_email || !access_level) {
      return Response.json({ 
        error: 'Missing required fields: document_id, shared_with_email, access_level' 
      }, { status: 400 });
    }

    // Create document share
    const shareData = {
      document_id,
      shared_with_email,
      shared_by_email: user.email,
      access_level,
      created_at: new Date().toISOString()
    };

    if (expires_at) {
      shareData.expires_at = expires_at;
    }

    const share = await base44.entities.DocumentPermission.create(shareData);

    // Send notification email
    try {
      await base44.functions.invoke('sendShareNotification', {
        document_title: 'Dokument', // Could be enhanced to fetch actual title
        shared_with_email,
        access_level
      });
    } catch (emailError) {
      console.error('Failed to send notification email:', emailError);
      // Don't fail the share if email fails
    }

    return Response.json({
      success: true,
      share
    });

  } catch (error) {
    console.error('Error sharing document:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});