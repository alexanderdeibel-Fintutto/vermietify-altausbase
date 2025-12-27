import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const FINAPI_BASE_URL = Deno.env.get("FINAPI_BASE_URL")?.replace(/\/$/, '');
const CLIENT_ID = Deno.env.get("FINAPI_CLIENT_ID");
const CLIENT_SECRET = Deno.env.get("FINAPI_CLIENT_SECRET");

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ 
                error: 'Bitte melden Sie sich an.' 
            }, { status: 401 });
        }

        if (!FINAPI_BASE_URL || !CLIENT_ID || !CLIENT_SECRET) {
            return Response.json({ 
                error: 'Bankverbindung nicht konfiguriert.'
            }, { status: 500 });
        }

        // Get client credentials token
        const credentials = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`);
        const tokenResponse = await fetch(`${FINAPI_BASE_URL}/oauth/token`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            },
            body: new URLSearchParams({
                grant_type: 'client_credentials'
            })
        });

        if (!tokenResponse.ok) {
            const error = await tokenResponse.text();
            console.error('Token error:', error);
            return Response.json({ 
                error: `FinAPI-Authentifizierung fehlgeschlagen (${tokenResponse.status}). Bitte überprüfen Sie CLIENT_ID und CLIENT_SECRET.`
            }, { status: 500 });
        }

        const { access_token } = await tokenResponse.json();

        // Create FinAPI user ID from app user email
        const finapiUserId = user.email.replace(/[@.]/g, '_').toLowerCase();
        const userPassword = crypto.randomUUID();

        // Get app URL for callback
        const appUrl = new URL(req.url).origin;
        const callbackUrl = `${appUrl}/FinAPICallback`;

        // Create Web Form for bank connection import
        const webFormResponse = await fetch(`${FINAPI_BASE_URL}/api/v1/webForms/bankConnectionImport`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${access_token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                userId: finapiUserId,
                userPassword: userPassword,
                storeSecrets: true,
                skipPositionsDownload: false,
                loadOwnerData: true,
                callbackUrl: callbackUrl
            })
        });

        if (!webFormResponse.ok) {
            const error = await webFormResponse.text();
            console.error('Web Form error:', error);
            return Response.json({ 
                error: 'Bankverbindung konnte nicht initialisiert werden.'
            }, { status: 500 });
        }

        const webFormData = await webFormResponse.json();
        const webFormUrl = `${FINAPI_BASE_URL}/webForm?webFormToken=${webFormData.token}`;

        // Store FinAPI user ID for later use
        await base44.auth.updateMe({ finapi_user_id: finapiUserId });

        return Response.json({
            success: true,
            webFormUrl: webFormUrl
        });

    } catch (error) {
        console.error('FinAPI connect error:', error);
        return Response.json({ 
            error: 'Ein Fehler ist aufgetreten.'
        }, { status: 500 });
    }
});