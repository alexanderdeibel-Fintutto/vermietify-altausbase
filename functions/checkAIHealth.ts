import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const settingsList = await base44.asServiceRole.entities.AISettings.list();
    const settings = settingsList?.[0];
    
    if (!settings) {
      return Response.json({ error: 'AISettings not found' }, { status: 404 });
    }

    // Test API-Verbindung mit minimaler Anfrage
    try {
      const testResponse = await base44.asServiceRole.functions.invoke('aiCoreService', {
        action: 'chat',
        prompt: 'Test',
        userId: 'system',
        featureKey: 'chat',
        maxTokens: 10
      });

      if (testResponse.data.success) {
        await base44.asServiceRole.entities.AISettings.update(settings.id, {
          api_status: 'active',
          last_api_check: new Date().toISOString()
        });

        return Response.json({ 
          status: 'active', 
          message: 'API-Verbindung erfolgreich',
          checked_at: new Date().toISOString()
        });
      } else {
        throw new Error('API test failed');
      }
    } catch (apiError) {
      await base44.asServiceRole.entities.AISettings.update(settings.id, {
        api_status: 'error',
        last_api_check: new Date().toISOString()
      });

      return Response.json({ 
        status: 'error', 
        message: apiError.message,
        checked_at: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Health check error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});