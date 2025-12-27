import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const FINAPI_BASE_URL = Deno.env.get("FINAPI_BASE_URL")?.replace(/\/$/, ''); // Remove trailing slash
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
                error: 'FinAPI ist nicht konfiguriert. Bitte Secrets überprüfen.',
                debug: {
                    hasBaseUrl: !!FINAPI_BASE_URL,
                    hasClientId: !!CLIENT_ID,
                    hasClientSecret: !!CLIENT_SECRET,
                    baseUrlValue: FINAPI_BASE_URL
                }
            }, { status: 500 });
        }

        if (!FINAPI_BASE_URL.startsWith('http://') && !FINAPI_BASE_URL.startsWith('https://')) {
            return Response.json({ 
                error: `FINAPI_BASE_URL muss mit http:// oder https:// beginnen.`,
                hint: 'Beispiel: https://sandbox.finapi.io oder https://live.finapi.io',
                currentValue: FINAPI_BASE_URL
            }, { status: 500 });
        }

        console.log('FinAPI Config:', { 
            baseUrl: FINAPI_BASE_URL, 
            clientId: CLIENT_ID?.substring(0, 5) + '...',
            user: user.email 
        });

        // Step 1: Get mandator access token
        const credentials = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`);
        const tokenUrl = `${FINAPI_BASE_URL}/oauth/token`;
        
        console.log('Requesting token from:', tokenUrl);
        
        const tokenResponse = await fetch(tokenUrl, {
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

        const tokenText = await tokenResponse.text();
        
        if (!tokenResponse.ok) {
            console.error('Token request failed:', {
                status: tokenResponse.status,
                statusText: tokenResponse.statusText,
                body: tokenText,
                url: tokenUrl
            });
            
            return Response.json({ 
                error: 'FinAPI Authentifizierung fehlgeschlagen',
                details: tokenText,
                status: tokenResponse.status,
                hint: tokenResponse.status === 403 
                    ? 'Prüfen Sie ob CLIENT_ID und CLIENT_SECRET korrekt sind und ob Ihr FinAPI Mandator aktiviert ist'
                    : 'Prüfen Sie die FINAPI_BASE_URL (z.B. https://sandbox.finapi.io)'
            }, { status: tokenResponse.status });
        }

        const { access_token } = JSON.parse(tokenText);
        console.log('✓ Mandator token erhalten');

        // Step 2: Create or get FinAPI user
        const userId = user.email.replace(/[@.]/g, '_');
        const userPassword = crypto.randomUUID();
        
        // Step 3: Create Web Form Token
        const webFormUrl = `${FINAPI_BASE_URL}/api/v1/webForms/bankConnectionImport`;
        console.log('Creating Web Form at:', webFormUrl);
        
        const webFormResponse = await fetch(webFormUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${access_token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                userId: userId,
                userPassword: userPassword,
                storeSecrets: true,
                skipPositionsDownload: false,
                loadOwnerData: true
            })
        });

        const webFormText = await webFormResponse.text();
        
        if (!webFormResponse.ok) {
            console.error('Web Form creation failed:', {
                status: webFormResponse.status,
                body: webFormText
            });
            
            return Response.json({ 
                error: 'Web Form konnte nicht erstellt werden',
                details: webFormText,
                status: webFormResponse.status
            }, { status: webFormResponse.status });
        }

        const webFormData = JSON.parse(webFormText);
        console.log('✓ Web Form Token erstellt');

        const finalWebFormUrl = `${FINAPI_BASE_URL}/webForm?webFormToken=${webFormData.token}`;

        return Response.json({
            success: true,
            message: 'Bank-Authentifizierung bereit',
            webFormUrl: finalWebFormUrl
        });

    } catch (error) {
        console.error('FinAPI connect error:', error);
        return Response.json({ 
            error: error.message || 'Interner Fehler',
            stack: error.stack
        }, { status: 500 });
    }
});