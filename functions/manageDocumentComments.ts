import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { action, document_id, company_id, content, comment_id, mentions } = await req.json();

    if (action === 'create') {
      const comment = await base44.asServiceRole.entities.DocumentComment.create({
        document_id,
        company_id,
        author_email: user.email,
        author_name: user.full_name,
        content,
        mentions: mentions || []
      });

      // Send notifications for mentions
      if (mentions && mentions.length > 0) {
        for (const email of mentions) {
          await base44.integrations.Core.SendEmail({
            to: email,
            subject: `${user.full_name} hat dich erwähnt`,
            body: `${user.full_name} hat dich in einem Kommentar erwähnt:\n\n"${content}"`
          });
        }
      }

      return Response.json({ success: true, comment });
    }

    if (action === 'list') {
      const comments = await base44.asServiceRole.entities.DocumentComment.filter({
        document_id
      }, '-created_date');
      return Response.json({ comments });
    }

    if (action === 'resolve') {
      await base44.asServiceRole.entities.DocumentComment.update(comment_id, {
        resolved: true,
        resolved_by: user.email
      });
      return Response.json({ success: true });
    }

    if (action === 'delete') {
      await base44.asServiceRole.entities.DocumentComment.delete(comment_id);
      return Response.json({ success: true });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Comments error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});