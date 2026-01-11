import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  console.log('testLetterXpressConnection called');
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      console.log('No user');
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { apiKey, accountId, email } = await req.json();
    console.log('Testing with:', { accountId, email, apiKey: apiKey ? 'provided' : 'missing' });

    // Validate inputs
    if (!apiKey || !accountId || !email) {
      console.log('Missing fields');
      return Response.json({ 
        success: false, 
        message: 'Alle Felder müssen gefüllt sein' 
      });
    }

    // For demo mode - just return success if credentials exist
    console.log('Credentials validation passed');
    return Response.json({ 
      success: true, 
      message: 'Demo-Modus: Verbindung erfolgreich (API-Test deaktiviert)' 
    });
  } catch (error) {
    console.error('Test connection error:', error);
    return Response.json({ 
      success: false, 
      message: 'Fehler: ' + error.message 
    });
  }
});