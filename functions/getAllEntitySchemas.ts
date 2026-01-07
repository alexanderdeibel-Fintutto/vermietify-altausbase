import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Liste aller Entity-Namen aus der Datenbank
        const entityList = await base44.asServiceRole.entities.list();
        
        const schemas = {};
        
        // Für jede Entity Schema aus Datensatz ableiten
        for (const entityDef of entityList) {
            if (entityDef.schema && entityDef.schema.properties) {
                schemas[entityDef.name] = entityDef.schema;
            }
        }

        return Response.json({
            success: true,
            count: Object.keys(schemas).length,
            schemas
        });

    } catch (error) {
        console.error('Get entity schemas error:', error);
        return Response.json({
            error: error.message
        }, { status: 500 });
    }
});