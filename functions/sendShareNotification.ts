import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { document_title, shared_with_email, access_level } = await req.json();

    if (!document_title || !shared_with_email || !access_level) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const accessLevelLabels = {
      view: 'Ansehen',
      download: 'Herunterladen',
      edit: 'Bearbeiten'
    };

    const accessLabel = accessLevelLabels[access_level] || access_level;

    // Send email notification
    await base44.integrations.Core.SendEmail({
      to: shared_with_email,
      subject: `Dokument mit Ihnen geteilt: ${document_title}`,
      body: `
Hallo,

${user.full_name || user.email} hat das Dokument "${document_title}" mit Ihnen geteilt.

Zugriffsrechte: ${accessLabel}

Sie können das Dokument in Ihrem Dokumentenmanagement einsehen.

Mit freundlichen Grüßen
Ihr FinTuttO Team
      `.trim()
    });

    return Response.json({
      success: true,
      email: shared_with_email
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});