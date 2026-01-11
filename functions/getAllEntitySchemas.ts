import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Forbidden' }, { status: 403 });
        }

        // This is the correct way to get all schemas.
        // entities.list() without an entity name returns a list of all entity definitions.
        const entityList = await base44.asServiceRole.entities.list();
        
        const schemas = {};
        
        // Extract the schema from each entity definition
        for (const entityDef of entityList) {
            if (entityDef.name && entityDef.schema) {
                schemas[entityDef.name] = { name: entityDef.name, ...entityDef.schema };
            }
        }

        return Response.json({
            success: true,
            count: Object.keys(schemas).length,
            schemas
        });

    } catch (error) {
        console.error('Get all entity schemas error:', error);
        return Response.json({
            error: error.message
        }, { status: 500 });
    }
});