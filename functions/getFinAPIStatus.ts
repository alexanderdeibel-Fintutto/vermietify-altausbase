import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await req.json();

    if (userId !== user.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if user has saved FinAPI credentials
    const userMe = await base44.auth.me();
    const finAPIData = userMe?.finapi_data || {};

    return Response.json({
      connected: !!finAPIData.access_token,
      accounts: finAPIData.accounts || [],
      lastSync: finAPIData.last_sync
    });
  } catch (error) {
    console.error('getFinAPIStatus error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});