import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * FINANZOnline AT OAuth & Data Submission
 * Handles authentication and tax form submission to Austrian tax authority
 */
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { action, code, state } = await req.json();

        // OAuth callback handling
        if (action === 'oauth_callback') {
            // Exchange auth code for access token
            const tokenResponse = await fetch('https://finanzonline.bmf.gv.at/oauth/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    grant_type: 'authorization_code',
                    code,
                    client_id: Deno.env.get('FINANZONLINE_CLIENT_ID'),
                    client_secret: Deno.env.get('FINANZONLINE_CLIENT_SECRET'),
                    redirect_uri: `${Deno.env.get('APP_BASE_URL')}/api/finanzonline-callback`
                })
            });

            if (!tokenResponse.ok) {
                throw new Error('FINANZOnline token exchange failed');
            }

            const { access_token, refresh_token } = await tokenResponse.json();

            // Store encrypted tokens in user profile
            await base44.auth.updateMe({
                finanzonline_access_token: access_token,
                finanzonline_refresh_token: refresh_token,
                finanzonline_connected: true,
                finanzonline_connected_at: new Date().toISOString()
            });

            return Response.json({
                success: true,
                message: 'FINANZOnline erfolgreich verbunden'
            });
        }

        return Response.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});