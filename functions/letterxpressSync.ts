Deno.serve(async (req) => {
  console.log('[letterxpressSync] Request received');
  
  if (req.method !== 'POST') {
    return Response.json({ success: false, message: 'POST only' }, { status: 405 });
  }

  try {
    // Simple demo response - no auth required
    return Response.json({ 
      success: true,
      synced: 5,
      message: 'Demo-Modus: 5 Versände synchronisiert',
      isDemo: true,
      data: [
        { id: 1, recipient: 'Max Mustermann', status: 'delivered', cost: 1.50 },
        { id: 2, recipient: 'Anna Schmidt', status: 'pending', cost: 0.95 }
      ]
    });
  } catch (error) {
    console.error('[letterxpressSync] Error:', error);
    return Response.json({ 
      success: false,
      message: 'Fehler: ' + error.message
    }, { status: 500 });
  }
});