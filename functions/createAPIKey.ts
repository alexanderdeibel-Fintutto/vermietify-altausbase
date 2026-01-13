import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, key, scopes } = await req.json();

    // Create API key
    const apiKey = await base44.entities.APIKey?.create?.({
      name: name,
      key: key, // In production, encrypt this
      secret: Math.random().toString(36).substr(2, 32),
      scopes: scopes,
      is_active: true
    });

    return Response.json({
      data: {
        id: apiKey?.id,
        name: apiKey?.name,
        key: apiKey?.key,
        created: true
      }
    });

  } catch (error) {
    console.error('API Key creation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});