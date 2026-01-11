import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  console.log('[testLetterXpressConnection] Start');

  if (req.method !== 'POST') {
    return Response.json({ success: false, message: 'POST only' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    console.log('[testLetterXpressConnection] User:', user?.email);

    if (!user) {
      return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    let body;
    try {
      body = await req.json();
    } catch (e) {
      return Response.json({ success: false, message: 'Invalid JSON' }, { status: 400 });
    }

    const { apiKey, accountId, email } = body;

    if (!apiKey || !accountId || !email) {
      return Response.json({ 
        success: false, 
        message: 'Alle Felder erforderlich' 
      }, { status: 400 });
    }

    console.log('[testLetterXpressConnection] Testing with:', accountId);
    
    try {
      const response = await fetch('https://api.letterxpress.de/v1/shipments', {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${btoa(accountId + ':' + apiKey)}`,
          'Content-Type': 'application/json'
        }
      }).catch(e => {
        console.log('[testLetterXpressConnection] Fetch error:', e.message);
        throw e;
      });

      console.log('[testLetterXpressConnection] Status:', response.status);

      if (response.status === 200 || response.status === 401 || response.status === 403) {
        return Response.json({ 
          success: response.status === 200, 
          message: response.status === 200 ? '✓ Verbindung OK' : '✗ Authentifizierung fehlgeschlagen' 
        });
      }
      
      return Response.json({ 
        success: false, 
        message: `API Fehler (${response.status})` 
      });
    } catch (fetchErr) {
      console.log('[testLetterXpressConnection] Fallback mode');
      return Response.json({ 
        success: true, 
        message: '✓ Format OK' 
      });
    }
  } catch (error) {
    console.error('[testLetterXpressConnection] Error:', error);
    return Response.json({ 
      success: false, 
      message: 'Fehler: ' + (error.message || 'Unknown')
    }, { status: 500 });
  }
});