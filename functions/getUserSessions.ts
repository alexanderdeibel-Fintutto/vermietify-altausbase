import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Mock data - in production this would come from session store
    const sessions = [
      {
        id: '1',
        device: 'Chrome auf Windows',
        ip: '192.168.1.1',
        last_activity: new Date().toISOString(),
        current: true
      }
    ];

    return Response.json(sessions);
  } catch (error) {
    console.error('Error getting sessions:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});