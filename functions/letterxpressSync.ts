import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  console.log('[letterxpressSync] Function started');
  
  if (req.method !== 'POST') {
    return Response.json({ success: false, message: 'POST only' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      console.log('[letterxpressSync] User not authenticated');
      return Response.json({ success: false, message: 'Authentifizierung erforderlich' }, { status: 401 });
    }

    console.log('[letterxpressSync] User authenticated:', user.email);

    // Demo-Modus: 5 Versände synchronisiert
    const result = {
      success: true,
      synced: 5,
      message: 'Demo-Modus: 5 Versände synchronisiert',
      isDemo: true,
      data: [
        { id: 1, recipient: 'Max Mustermann', status: 'delivered', cost: 1.50 },
        { id: 2, recipient: 'Anna Schmidt', status: 'pending', cost: 0.95 }
      ]
    };

    console.log('[letterxpressSync] Returning result:', result);
    return Response.json(result);
    
  } catch (error) {
    console.error('[letterxpressSync] Error:', error);
    return Response.json({ 
      success: false,
      message: 'Fehler: ' + error.message
    }, { status: 500 });
  }
});