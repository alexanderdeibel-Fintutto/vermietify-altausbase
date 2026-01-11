import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  console.log('[saveLetterXpressCredentials] Request received');
  
  if (req.method !== 'POST') {
    return Response.json({ success: false, message: 'POST only' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    console.log('[saveLetterXpressCredentials] User:', user?.email);

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
    console.log('[saveLetterXpressCredentials] Fields:', { apiKey: !!apiKey, accountId: !!accountId, email: !!email });

    if (!apiKey || !accountId || !email) {
      return Response.json({ 
        success: false,
        message: 'Alle Felder erforderlich'
      }, { status: 400 });
    }

    // Delete existing
    try {
      const existing = await base44.entities.LetterXpressCredential.list();
      for (const cred of existing) {
        await base44.entities.LetterXpressCredential.delete(cred.id);
      }
    } catch (err) {
      console.log('[saveLetterXpressCredentials] Delete error (ok):', err.message);
    }

    // Create new
    const result = await base44.entities.LetterXpressCredential.create({
      api_key: apiKey,
      account_id: accountId,
      email: email
    });

    console.log('[saveLetterXpressCredentials] Success:', result.id);
    return Response.json({
      success: true,
      message: 'Zugangsdaten gespeichert',
      credentialId: result.id
    });
  } catch (error) {
    console.error('[saveLetterXpressCredentials] Error:', error.message);
    return Response.json({
      success: false,
      message: 'Fehler: ' + error.message
    }, { status: 500 });
  }
});