import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submission_id, comment, mentions } = await req.json();

    if (!submission_id || !comment) {
      return Response.json({ error: 'submission_id and comment required' }, { status: 400 });
    }

    console.log(`[COMMENT] Adding comment to ${submission_id}`);

    const commentData = {
      entity_type: 'ElsterSubmission',
      entity_id: submission_id,
      action: 'comment_added',
      user_id: user.id,
      changes: { comment },
      metadata: {
        user_name: user.full_name,
        user_email: user.email,
        mentions: mentions || [],
        timestamp: new Date().toISOString()
      }
    };

    await base44.asServiceRole.entities.ActivityLog.create(commentData);

    // Benachrichtige erwähnte Benutzer
    if (mentions && mentions.length > 0) {
      for (const mentionedEmail of mentions) {
        try {
          await base44.asServiceRole.integrations.Core.SendEmail({
            from_name: 'ELSTER-System',
            to: mentionedEmail,
            subject: `${user.full_name} hat Sie in einem Kommentar erwähnt`,
            body: `${user.full_name} hat Sie in einem Kommentar zu einer ELSTER-Submission erwähnt:\n\n"${comment}"\n\nSubmission-ID: ${submission_id}`
          });
        } catch (error) {
          console.error(`Failed to notify ${mentionedEmail}:`, error);
        }
      }
    }

    console.log('[COMMENT] Added successfully');

    return Response.json({
      success: true,
      comment: commentData
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});