import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const FINAPI_BASE_URL = Deno.env.get("FINAPI_BASE_URL");
const CLIENT_ID = Deno.env.get("FINAPI_CLIENT_ID");
const CLIENT_SECRET = Deno.env.get("FINAPI_CLIENT_SECRET");

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ 
                error: 'Nicht autorisiert. Bitte melden Sie sich an.' 
            }, { status: 401 });
        }

        if (!FINAPI_BASE_URL || !CLIENT_ID || !CLIENT_SECRET) {
            return Response.json({ 
                error: 'FinAPI ist nicht konfiguriert. Bitte Secrets überprüfen.'
            }, { status: 500 });
        }

        console.log('Creating FinAPI Web Form Token for user:', user.email);

        // Step 1: Get mandator access token using Basic Auth
        const credentials = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`);
        const tokenResponse = await fetch(`${FINAPI_BASE_URL}/oauth/token`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'client_credentials'
            })
        });

        if (!tokenResponse.ok) {
            const error = await tokenResponse.text();
            console.error('Token error:', error);
            return Response.json({ 
                error: 'FinAPI Authentifizierung fehlgeschlagen. Bitte überprüfen Sie CLIENT_ID und CLIENT_SECRET.'
            }, { status: 403 });
        }

        const { access_token } = await tokenResponse.json();
        console.log('Mandator token obtained');

        // Step 2: Create Web Form Token
        const userId = user.email.replace('@', '_at_').replace(/\./g, '_');
        
        const webFormResponse = await fetch(`${FINAPI_BASE_URL}/api/v1/webForms/bankConnectionImport`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${access_token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: userId,
                userPassword: crypto.randomUUID(),
                storeSecrets: true,
                skipPositionsDownload: false,
                loadOwnerData: true
            })
        });

        if (!webFormResponse.ok) {
            const error = await webFormResponse.text();
            console.error('Web Form creation error:', error);
            return Response.json({ 
                error: 'Web Form konnte nicht erstellt werden',
                details: error
            }, { status: 400 });
        }

        const webFormData = await webFormResponse.json();
        console.log('Web Form Token created:', webFormData.token);

        const webFormUrl = `${FINAPI_BASE_URL}/webForm?webFormToken=${webFormData.token}`;

        return Response.json({
            success: true,
            message: 'Bitte authentifizieren Sie sich bei Ihrer Bank',
            webFormUrl
        });

    } catch (error) {
        console.error('FinAPI connect error:', error);
        return Response.json({ 
            error: error.message || 'Interner Fehler beim Verbinden der Bank',
            details: error.stack
        }, { status: 500 });
    }
});