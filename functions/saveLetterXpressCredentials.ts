import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { apiKey, accountId, email } = await req.json();

    if (!apiKey || !accountId || !email) {
      return Response.json({ 
        success: false,
        error: 'Missing required fields',
        message: 'API-Schlüssel, Account-ID und E-Mail sind erforderlich'
      }, { status: 400 });
    }

    console.log('[saveLetterXpressCredentials] Saving for user:', user.email);

    // Delete existing credentials
    try {
      const existing = await base44.entities.LetterXpressCredential.filter({
        created_by: user.email
      });
      for (const cred of existing) {
        await base44.entities.LetterXpressCredential.delete(cred.id);
      }
    } catch (err) {
      console.log('[saveLetterXpressCredentials] No existing credentials to delete');
    }

    // Create new credential
    const result = await base44.entities.LetterXpressCredential.create({
      api_key: apiKey,
      account_id: accountId,
      email: email
    });

    console.log('[saveLetterXpressCredentials] Credentials saved successfully');

    return Response.json({
      success: true,
      message: 'Zugangsdaten gespeichert',
      credentialId: result.id
    });
  } catch (error) {
    console.error('[saveLetterXpressCredentials] Error:', error);
    return Response.json({
      success: false,
      error: error.message,
      message: 'Fehler beim Speichern: ' + error.message
    }, { status: 500 });
  }
});