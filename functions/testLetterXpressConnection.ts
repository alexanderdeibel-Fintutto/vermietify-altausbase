import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { apiKey, accountId, email } = await req.json();

    // Validate inputs
    if (!apiKey || !accountId || !email) {
      return Response.json({ 
        success: false, 
        message: 'Alle Felder müssen gefüllt sein' 
      });
    }

    // Test LetterXpress API connection
    const response = await fetch('https://api.letterxpress.de/v1/account/status', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'X-Account-ID': accountId,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      return Response.json({ 
        success: true, 
        message: 'Verbindung erfolgreich! Ihre Zugangsdaten sind gültig.' 
      });
    } else if (response.status === 401) {
      return Response.json({ 
        success: false, 
        message: 'Authentifizierung fehlgeschlagen. Überprüfen Sie Ihren API Key und Account ID.' 
      });
    } else {
      return Response.json({ 
        success: false, 
        message: `Fehler bei der Verbindung (${response.status}). Bitte versuchen Sie es später erneut.` 
      });
    }
  } catch (error) {
    console.error('Test connection error:', error);
    return Response.json({ 
      success: false, 
      message: 'Netzwerkfehler: ' + error.message 
    });
  }
});