import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { company_id, email_address, folder = 'INBOX' } = await req.json();

    // Get IMAP account
    const accounts = await base44.asServiceRole.entities.IMAPAccount.filter({
      email: email_address
    });

    if (accounts.length === 0) {
      return Response.json({ error: 'Email account not configured' }, { status: 404 });
    }

    const account = accounts[0];

    // Connect to IMAP (simplified - in production use proper IMAP library)
    const emails = []; // Would fetch from IMAP server

    const imported = [];

    for (const email of emails) {
      if (email.attachments && email.attachments.length > 0) {
        for (const attachment of email.attachments) {
          // Upload attachment
          const { file_url } = await base44.integrations.Core.UploadFile({
            file: attachment.content
          });

          // Create document
          const doc = await base44.asServiceRole.entities.Document.create({
            company_id,
            name: attachment.filename,
            document_type: 'email_attachment',
            file_url,
            tags: ['email', 'imported', email.from],
            metadata: {
              email_subject: email.subject,
              email_from: email.from,
              email_date: email.date
            }
          });

          imported.push(doc);
        }
      }
    }

    return Response.json({ success: true, imported: imported.length });
  } catch (error) {
    console.error('Email import error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});