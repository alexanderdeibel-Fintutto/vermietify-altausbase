import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Hole ELSTER Settings
        const settings = await base44.asServiceRole.entities.ElsterSettings.filter({ user_email: user.email });
        const ericServiceUrl = settings[0]?.eric_service_url || Deno.env.get('ERIC_SERVICE_URL');
        const ericApiKey = Deno.env.get('ERIC_SERVICE_API_KEY');

        if (!ericServiceUrl) {
            return Response.json({
                microservice_online: false,
                error: 'ERiC service URL not configured'
            });
        }

        const result = {
            microservice_online: false,
            eric_version: null,
            elster_reachable: false,
            test_mode: settings[0]?.test_mode !== false,
            last_check: new Date().toISOString()
        };

        // 1. Prüfe Microservice Erreichbarkeit
        try {
            const healthResponse = await fetch(`${ericServiceUrl}/health`, {
                method: 'GET',
                headers: { 'X-API-Key': ericApiKey }
            });
            
            if (healthResponse.ok) {
                result.microservice_online = true;
            }
        } catch (error) {
            result.error = 'Microservice not reachable: ' + error.message;
            return Response.json(result);
        }

        // 2. Prüfe ERiC-Version
        try {
            const versionResponse = await fetch(`${ericServiceUrl}/eric/version`, {
                method: 'GET',
                headers: { 'X-API-Key': ericApiKey }
            });
            
            if (versionResponse.ok) {
                const versionData = await versionResponse.json();
                result.eric_version = versionData.version;
            }
        } catch (error) {
            result.eric_version_error = error.message;
        }

        // 3. Prüfe ELSTER-Verbindung
        try {
            const elsterTestResponse = await fetch(`${ericServiceUrl}/eric/test-connection`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': ericApiKey
                },
                body: JSON.stringify({
                    test_mode: result.test_mode
                })
            });
            
            if (elsterTestResponse.ok) {
                const elsterData = await elsterTestResponse.json();
                result.elster_reachable = elsterData.success || false;
                result.elster_server = elsterData.server;
            }
        } catch (error) {
            result.elster_error = error.message;
        }

        return Response.json(result);

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});