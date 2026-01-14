import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    const debugLogs = [];
    const logDebug = (msg) => {
        debugLogs.push(msg);
        console.error(msg);
    };

    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Forbidden' }, { status: 403 });
        }

        logDebug("=== getAllEntitySchemas START ===");
        logDebug(`User: ${user?.email}`);

        // Lade alle verfügbaren Entities direkt aus Base44
        const schemas = {};
        
        // Nutze getAllEntitySchemas API direkt
        try {
            const allSchemas = await base44.asServiceRole.entities._getAllSchemas();
            Object.assign(schemas, allSchemas);
            logDebug(`✓ Geladen via _getAllSchemas: ${Object.keys(allSchemas).length} Entities`);
        } catch (err) {
            logDebug(`✗ _getAllSchemas nicht verfügbar: ${err.message}`);
        }

        logDebug(`Schemas geladen: ${Object.keys(schemas).length}`);
        logDebug(`Schema names: ${Object.keys(schemas).join(', ')}`);

        return Response.json({
            success: true,
            count: Object.keys(schemas).length,
            schemas,
            debugLogs,
            note: `Geladen: ${Object.keys(schemas).length} Entity-Schemas`
        });

    } catch (error) {
        debugLogs.push(`Error: ${error.message}`);
        console.error('Error:', error);
        return Response.json({
            error: error.message,
            debugLogs
        }, { status: 500 });
    }
});