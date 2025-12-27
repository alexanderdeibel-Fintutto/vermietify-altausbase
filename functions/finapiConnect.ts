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

        console.log('Creating FinAPI Web Form for user:', user.email);

        // Generate Web Form for bank connection - this creates user automatically if needed
        const webFormUrl = `${FINAPI_BASE_URL}/webForm/bankConnectionImport?` + new URLSearchParams({
            clientId: CLIENT_ID,
            clientSecret: CLIENT_SECRET,
            userId: user.email.replace('@', '_at_').replace(/\./g, '_'),
            userPassword: crypto.randomUUID(),
            storeSecrets: 'true',
            skipPositionsDownload: 'false',
            loadOwnerData: 'true'
        });

        console.log('Web Form URL generated');

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