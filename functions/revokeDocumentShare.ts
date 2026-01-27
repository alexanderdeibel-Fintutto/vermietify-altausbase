import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { share_id } = await req.json();

    if (!share_id) {
      return Response.json({ error: 'share_id required' }, { status: 400 });
    }

    // Load share info before deletion
    const shares = await base44.entities.DocumentPermission.filter({ id: share_id });
    const share = shares[0];

    if (!share) {
      return Response.json({ error: 'Share not found' }, { status: 404 });
    }

    // Delete the share
    await base44.entities.DocumentPermission.delete(share_id);

    // Send notifications
    try {
      await base44.functions.invoke('sendRevokeNotifications', {
        shared_with_email: share.shared_with_email,
        shared_by_email: share.shared_by_email,
        document_id: share.document_id,
        revoker_email: user.email
      });
    } catch (notifError) {
      console.error('Failed to send revoke notifications:', notifError);
    }

    return Response.json({
      success: true,
      message: 'Share revoked successfully'
    });

  } catch (error) {
    console.error('Error revoking share:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});