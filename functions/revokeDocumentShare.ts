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

    // Delete the share
    await base44.entities.DocumentPermission.delete(share_id);

    return Response.json({
      success: true,
      message: 'Share revoked successfully'
    });

  } catch (error) {
    console.error('Error revoking share:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});