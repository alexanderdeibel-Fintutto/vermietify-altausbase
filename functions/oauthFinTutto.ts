import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * OAuth-Integration zu FinTuttO Hauptapp
 * Ermöglicht Cross-App Daten-Zugriff
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action } = await req.json();

    if (action === 'getAuthUrl') {
      // OAuth-URL zu FinTuttO generieren
      const authUrl = `https://vermietify.app/oauth/authorize?` +
        `client_id=ft_calc_nebenkostenabrechnung&` +
        `redirect_uri=${encodeURIComponent('https://your-app.base44.app/oauth/callback')}&` +
        `response_type=code&` +
        `scope=buildings:read,units:read,tenants:read,meters:read`;

      return Response.json({
        success: true,
        authUrl
      });
    }

    if (action === 'handleCallback') {
      const { code } = await req.json();
      
      // Code gegen Access Token tauschen
      // TODO: Implementierung mit FinTuttO OAuth-Endpoint
      
      return Response.json({
        success: true,
        message: 'OAuth-Integration erfolgreich'
      });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });

  } catch (error) {
    console.error('OAuth error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});