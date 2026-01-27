import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { share_ids } = await req.json();

    if (!share_ids || !Array.isArray(share_ids) || share_ids.length === 0) {
      return Response.json({ error: 'Invalid share_ids' }, { status: 400 });
    }

    // Load shares before deletion for notifications
    const sharesToRevoke = [];
    for (const shareId of share_ids) {
      try {
        const shares = await base44.entities.DocumentPermission.filter({ id: shareId });
        if (shares[0]) sharesToRevoke.push(shares[0]);
      } catch (error) {
        console.error(`Failed to load share ${shareId}:`, error);
      }
    }

    // Delete all specified shares
    let revokedCount = 0;
    for (const shareId of share_ids) {
      try {
        await base44.entities.DocumentPermission.delete(shareId);
        revokedCount++;
      } catch (error) {
        console.error(`Failed to revoke share ${shareId}:`, error);
      }
    }

    // Send bulk revoke notifications
    if (sharesToRevoke.length > 0) {
      try {
        await base44.functions.invoke('sendBulkRevokeNotifications', {
          shares: sharesToRevoke,
          revoker_email: user.email
        });
      } catch (notifError) {
        console.error('Failed to send bulk revoke notifications:', notifError);
      }
    }

    return Response.json({
      success: true,
      revoked: revokedCount,
      requested: share_ids.length
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});