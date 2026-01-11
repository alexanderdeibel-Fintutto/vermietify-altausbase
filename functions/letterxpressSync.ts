Deno.serve(async (req) => {
  console.log('[letterxpressSync] Minimal test - no auth required');
  
  if (req.method !== 'POST') {
    return Response.json({ success: false, message: 'POST only' }, { status: 405 });
  }

  try {
    // Demo mode - return success without auth
    console.log('[letterxpressSync] Demo mode response');
    return Response.json({ 
      success: true,
      synced: 0,
      message: 'Demo-Modus: LetterXpress synchronisiert (keine Daten)',
      isDemo: true
    });
  } catch (error) {
    console.error('[letterxpressSync] Error:', error);
    return Response.json({ 
      success: false,
      message: 'Fehler: ' + error.message
    }, { status: 500 });
  }
});